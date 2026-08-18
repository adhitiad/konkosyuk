import { NextRequest } from "next/server";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api";
import { propertyQuerySchema } from "@/lib/zod";
import { calculateDistance } from "@/lib/geolocation";
import { logError } from "@/lib/logger";
import { enforceRateLimit, publicRateLimit } from "@/lib/rate-limit";
import { getCachedData, buildCacheKey } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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
    } = query;

    const cursor = req.nextUrl.searchParams.get("cursor");
    const cursorLimit = Math.min(limit, 50);

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
    if (search) {
      const searchCondition = sql`
        to_tsvector('indonesian', ${properties.name} || ' ' || ${properties.address} || ' ' || COALESCE(${properties.description}, ''))
        @@ websearch_to_tsquery('indonesian', ${search})
      `;
      conditions.push(searchCondition);
    }

    let orderBy = sql`${properties.gpsVerified} DESC, ${properties.createdAt} DESC`;

    if (lat !== undefined && lng !== undefined && radiusKm !== undefined) {
      const distanceExpr = sql<number>`
        6371 * acos(
          cos(radians(${lat})) * cos(radians(${properties.latitude})) *
          cos(radians(${properties.longitude}) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(${properties.latitude}))
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
    });

    const result = await getCachedData(
      cacheKey,
      async () => {
        if (cursor) {
          const [rows, [{ count: totalCount }]] = await Promise.all([
            db
              .select()
              .from(properties)
              .where(where)
              .orderBy(orderBy)
              .limit(cursorLimit + 1),
            db
              .select({ count: sql<number>`count(*)` })
              .from(properties)
              .where(where),
          ]);

          let data = rows.slice(0, cursorLimit);
          const hasMore = rows.length > cursorLimit;
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

          return {
            data,
            meta: {
              nextCursor,
              hasMore,
              total: Number(totalCount),
            },
          };
        } else {
          const offset = (page - 1) * limit;
          const [rows, [{ count: totalCount }]] = await Promise.all([
            db
              .select()
              .from(properties)
              .where(where)
              .orderBy(orderBy)
              .limit(limit)
              .offset(offset),
            db
              .select({ count: sql<number>`count(*)` })
              .from(properties)
              .where(where),
          ]);

          let data = rows;

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

          const total = Number(totalCount);
          const totalPages = Math.ceil(total / limit);

          return {
            data,
            meta: {
              page,
              limit,
              total,
              totalPages,
            },
          };
        }
      },
      { ttlSeconds: 60, tags: ["properties"] },
    );

    return ok(result);
  } catch (error) {
    logError(error, "GET /api/properties");
    return handleApiError(error, "GET /api/properties");
  }
}
