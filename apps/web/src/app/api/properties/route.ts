import { NextRequest } from "next/server";
import { db } from "@/db";
import { properties, bookings, seasonalPricingRules } from "@/db/schema";
import type { NewProperty } from "@/db/schema";
import { eq, and, or, sql, inArray } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { validateMutationCsrf } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { createPropertySchema, propertyQuerySchema } from "@konkosyuk/shared";
import type { Role } from "@/lib/auth";
import { calculateDistance } from "@/lib/geolocation";
import { jitterCoordinates } from "@/lib/utils/location";
import { logError, logApiRequest } from "@/lib/logger";
import { enforceRateLimit, publicRateLimit } from "@/lib/rate-limit";
import { getCachedData, buildCacheKey } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    const limited = await enforceRateLimit(req, publicRateLimit);
    if (limited) return limited;

    const rawParams = Object.fromEntries(req.nextUrl.searchParams);
    const query = propertyQuerySchema.parse(rawParams);
    const {
      page,
      limit,
      ownerId,
      type,
      city,
      search,
      lat,
      lng,
      radiusKm,
      amenities,
      minPrice,
      maxPrice,
      isFeatured,
      ids,
      area,
      campus,
      duration: durationFilter,
      gender,
      swLat,
      swLng,
      neLat,
      neLng,
    } = query;

    const cursor = req.nextUrl.searchParams.get("cursor");
    const cursorLimit = Math.min(limit, 50);

    if (ids && ids.length > 0) {
      const rows = await db
        .select()
        .from(properties)
        .where(inArray(properties.id, ids));

      return ok({
        data: rows,
        meta: {
          page: 1,
          limit: rows.length,
          total: rows.length,
          totalPages: 1,
        },
      });
    }

    let isOwner = false;
    let effectiveOwnerId = ownerId;

    try {
      const session = await requireSession();
      isOwner = session.user.role === "owner";
      effectiveOwnerId = isOwner ? session.user.id : ownerId;
    } catch {}

    const conditions = [];
    if (effectiveOwnerId) {
      conditions.push(eq(properties.ownerId, effectiveOwnerId));
    }
    if (type) {
      conditions.push(eq(properties.type, type));
    }
    if (city) {
      conditions.push(eq(properties.city, city));
    }
    if (isFeatured !== undefined) {
      conditions.push(eq(properties.isFeatured, isFeatured));
    }
    if (search) {
      const searchCondition = sql`
        to_tsvector('indonesian', ${properties.name} || ' ' || ${properties.address} || ' ' || COALESCE(${properties.description}, ''))
        @@ websearch_to_tsquery('indonesian', ${search})
      `;
      conditions.push(searchCondition);
    }
    if (area) {
      const areaCity = area.replace(/-/g, " ");
      conditions.push(sql`${properties.city} ILIKE ${'%' + areaCity + '%'}`);
    }
    if (campus) {
      const campusQuery = campus.replace(/-/g, " ");
      conditions.push(
        sql`${properties.address} ILIKE ${'%' + campusQuery + '%'} OR ${properties.description} ILIKE ${'%' + campusQuery + '%'}`,
      );
    }
    if (amenities && amenities.length > 0) {
      conditions.push(sql`${properties.amenities} @> ${amenities}`);
    }
    if (
      swLat !== undefined &&
      swLng !== undefined &&
      neLat !== undefined &&
      neLng !== undefined
    ) {
      conditions.push(
        sql`${properties.latitude} IS NOT NULL AND ${properties.longitude} IS NOT NULL`,
      );
      conditions.push(
        sql`${properties.latitude} BETWEEN ${swLat} AND ${neLat}`,
      );
      conditions.push(
        sql`${properties.longitude} BETWEEN ${swLng} AND ${neLng}`,
      );
    }

    let orderBy = sql`${properties.gpsVerified} DESC, ${properties.createdAt} DESC`;

    if (lat !== undefined && lng !== undefined && radiusKm !== undefined) {
      const distanceExpr = sql<number>`
        6371 * acos(
          LEAST(1, GREATEST(-1,
            cos(radians(${lat})) *
            cos(radians(${properties.latitude})) *
            cos(radians(${properties.longitude}) - radians(${lng})) +
            sin(radians(${lat})) *
            sin(radians(${properties.latitude}))
          ))
        )
      `;
      conditions.push(eq(properties.isActive, true));
      conditions.push(eq(properties.gpsVerified, true));
      conditions.push(
        sql`${properties.latitude} IS NOT NULL AND ${properties.longitude} IS NOT NULL`,
      );
      conditions.push(sql`${distanceExpr} <= ${radiusKm}`);
      orderBy = sql`${distanceExpr} ASC`;
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const cacheKey = buildCacheKey("properties", {
      ownerId: effectiveOwnerId ?? "null",
      type: type ?? "null",
      city: city ?? "null",
      search: search ?? "null",
      lat: lat ?? "null",
      lng: lng ?? "null",
      radiusKm: radiusKm ?? "null",
      amenities: amenities?.join(",") ?? "null",
      minPrice: minPrice ?? "null",
      maxPrice: maxPrice ?? "null",
      cursor: cursor ?? "null",
      limit: cursorLimit,
      area: area ?? "null",
      campus: campus ?? "null",
      duration: durationFilter ?? "null",
      gender: gender ?? "null",
      swLat: swLat ?? "null",
      swLng: swLng ?? "null",
      neLat: neLat ?? "null",
      neLng: neLng ?? "null",
    });

    const result = await getCachedData(
      cacheKey,
      async () => {
        const offset = cursor ? 0 : (page - 1) * limit;

        const [rows, [{ count: totalCount }]] = await Promise.all([
          db
            .select()
            .from(properties)
            .where(where)
            .orderBy(orderBy)
            .limit(cursor ? cursorLimit + 1 : limit)
            .offset(cursor ? 0 : offset),
          db
            .select({ count: sql<number>`count(*)` })
            .from(properties)
            .where(where),
        ]);

        let data = cursor ? rows.slice(0, cursorLimit) : rows;
        const hasMore = cursor ? rows.length > cursorLimit : false;
        const nextCursor = hasMore ? rows[cursorLimit].id : undefined;

        if (lat !== undefined && lng !== undefined && radiusKm !== undefined) {
          data = data.map((property) => ({
            ...property,
            distance: calculateDistance(
              lat,
              lng,
              Number(property.latitude),
              Number(property.longitude),
            ),
          }));
        }

        if (amenities && amenities.length > 0) {
          data = data.filter((property) => {
            const propertyAmenities = Array.isArray(property.amenities)
              ? property.amenities
              : [];
            return amenities.every((amenity: string) =>
              propertyAmenities.includes(amenity),
            );
          });
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
          data = data.filter((property) => {
            const packages = property.packages as {
              predefined?: { finalPrice?: number }[];
            } | null;
            const prices =
              packages?.predefined
                ?.map((p) => p.finalPrice)
                .filter((p): p is number => typeof p === "number") ?? [];
            if (prices.length === 0) return false;

            const min = Math.min(...prices);
            const max = Math.max(...prices);

            if (minPrice !== undefined && max < Number(minPrice)) return false;
            if (maxPrice !== undefined && min > Number(maxPrice)) return false;

            return true;
          });
        }

        let viewerId: string | null = null;
        try {
          const viewerSession = await requireSession();
          viewerId = viewerSession.user.id;
        } catch {}

        if (viewerId && data.length > 0) {
          const propertyIds = data.map((p) => p.id);
          const qualifyingBookings = await db
            .select({ propertyId: bookings.propertyId })
            .from(bookings)
            .where(
              and(
                eq(bookings.userId, viewerId),
                or(
                  eq(bookings.status, "confirmed"),
                  eq(bookings.status, "awaiting_full_payment"),
                ),
                sql`${bookings.propertyId} IN ${propertyIds}`,
              ),
            );

          const unlockedPropertyIds = new Set(
            qualifyingBookings.map((b) => b.propertyId),
          );

          data = data.map((property) => {
            if (unlockedPropertyIds.has(property.id)) {
              return property;
            }

            const maskedAddress =
              property.city && property.province
                ? `Lokasi Perkiraan di ${property.city}, ${property.province}`
                : "Lokasi Perkiraan";

            const maskedLatLng =
              property.latitude && property.longitude
                ? jitterCoordinates(
                    Number(property.latitude),
                    Number(property.longitude),
                  )
                : null;

            return {
              ...property,
              address: maskedAddress,
              latitude: maskedLatLng
                ? String(maskedLatLng.lat)
                : property.latitude,
              longitude: maskedLatLng
                ? String(maskedLatLng.lng)
                : property.longitude,
            };
          });
        } else if (!viewerId && data.length > 0) {
          data = data.map((property) => {
            const maskedAddress =
              property.city && property.province
                ? `Lokasi Perkiraan di ${property.city}, ${property.province}`
                : "Lokasi Perkiraan";

            const maskedLatLng =
              property.latitude && property.longitude
                ? jitterCoordinates(
                    Number(property.latitude),
                    Number(property.longitude),
                  )
                : null;

            return {
              ...property,
              address: maskedAddress,
              latitude: maskedLatLng
                ? String(maskedLatLng.lat)
                : property.latitude,
              longitude: maskedLatLng
                ? String(maskedLatLng.lng)
                : property.longitude,
            };
          });
        }

        if (data.length > 0) {
          const propertyIds = data.map((p) => p.id);
          const activeSeasonalRules = await db
            .select({ propertyId: seasonalPricingRules.propertyId })
            .from(seasonalPricingRules)
            .where(
              and(
                inArray(seasonalPricingRules.propertyId, propertyIds),
                eq(seasonalPricingRules.isActive, true),
              ),
            );

          const seasonalCounts = new Map<string, number>();
          for (const rule of activeSeasonalRules) {
            seasonalCounts.set(
              rule.propertyId,
              (seasonalCounts.get(rule.propertyId) || 0) + 1,
            );
          }

          data = data.map((property) => ({
            ...property,
            hasSeasonalPricing: (seasonalCounts.get(property.id) || 0) > 0,
            seasonalPricingCount: seasonalCounts.get(property.id) || 0,
          }));
        }

        const total = Number(totalCount);
        const totalPages = cursor ? undefined : Math.ceil(total / limit);

        return {
          data,
          meta: {
            ...(cursor
              ? { nextCursor, hasMore }
              : { page, limit, total, totalPages }),
          },
        };
      },
      { ttlSeconds: 60, tags: ["properties"] },
    );

    const duration = Date.now() - startTime;
    logApiRequest("GET", "/api/properties", 200, duration);

    return ok(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    const statusCode =
      error instanceof Error && "statusCode" in error
        ? (error as { statusCode: number }).statusCode
        : 500;
    logApiRequest("GET", "/api/properties", statusCode, duration);
    logError(error, "GET /api/properties");
    return handleApiError(error, "GET /api/properties");
  }
}

export async function POST(req: NextRequest) {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const session = await requireSession(["owner", "staff", "admin"] as Role[]);
    const body = createPropertySchema.parse(await req.json());

    if (session.user.role === "owner") {
      if (session.user.kycStatus !== "verified") {
        return fail("Verifikasi KTP Anda terlebih dahulu.", 403);
      }

      if (!session.user.phone) {
        return fail("Nomor HP/WA wajib diisi di profil.", 400);
      }

      if (!session.user.name || session.user.name.trim().length < 2) {
        return fail(
          "Nama profil tidak sesuai dengan data KYC terverifikasi.",
          400,
        );
      }
    }

    const [property] = await db
      .insert(properties)
      .values({
        name: body.title,
        description: body.description,
        address: body.address ?? "",
        province: body.province ?? "",
        city: body.city ?? "",
        district: body.district ?? "",
        type: body.type,
        basePrice: body.basePrice,
        packages: body.packages,
        status: body.status,
        amenities: body.amenities,
        images: body.images,
        metadata: body.metadata,
        ownerId: session.user.id,
        latitude:
          body.latitude !== undefined ? String(body.latitude) : undefined,
        longitude:
          body.longitude !== undefined ? String(body.longitude) : undefined,
      } satisfies NewProperty)
      .returning();

    return ok(property, 201);
  } catch (error) {
    logError(error, "POST /api/properties");
    return handleApiError(error, "POST /api/properties");
  }
}
