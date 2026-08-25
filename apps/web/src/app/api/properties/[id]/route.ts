import { NextRequest } from "next/server";
import { db } from "@/db";
import { properties, bookings, users, propertyRules, nearbyPlaces } from "@/db/schema";
import { eq, and, or, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { validateMutationCsrf } from "@/lib/api-auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { updatePropertySchema } from "@konkosyuk/shared";
import type { Role } from "@/lib/auth";
import { jitterCoordinates } from "@/lib/utils/location";
import { enforceRateLimit, generalRateLimit } from "@/lib/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    let viewerId: string | null = null;
    let isAdmin = false;

    try {
      const session = await requireSession();
      viewerId = session.user.id;
      isAdmin = session.user.role === "admin";
    } catch {}

    const { id: propertyId } = await params;

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!property) {
      return fail("Property not found", 404);
    }

    const rules = await db
      .select({
        id: propertyRules.id,
        rule: propertyRules.rule,
        sortOrder: propertyRules.sortOrder,
      })
      .from(propertyRules)
      .where(eq(propertyRules.propertyId, propertyId))
      .orderBy(propertyRules.sortOrder);

    const nearby = await db
      .select({
        id: nearbyPlaces.id,
        name: nearbyPlaces.name,
        type: nearbyPlaces.type,
        distance: nearbyPlaces.distance,
        latitude: nearbyPlaces.latitude,
        longitude: nearbyPlaces.longitude,
      })
      .from(nearbyPlaces)
      .where(eq(nearbyPlaces.propertyId, propertyId))
      .orderBy(nearbyPlaces.distance);

    const [ownerResult] = await db
      .select({
        id: users.id,
        name: users.name,
        image: users.image,
        activeSince: users.createdAt,
        transactionCount: sql<number>`COUNT(${bookings.id})`,
      })
      .from(users)
      .leftJoin(
        bookings,
        and(
          eq(bookings.propertyId, propertyId),
          eq(bookings.status, "completed"),
        ),
      )
      .where(eq(users.id, property.ownerId))
      .groupBy(users.id);

    const owner = ownerResult
      ? {
          ...ownerResult,
          activeSince: ownerResult.activeSince,
          transactionCount: Number(ownerResult.transactionCount),
        }
      : null;

    const extra = {
      rules,
      nearbyPlaces: nearby.map((p) => ({
        ...p,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude),
      })),
      owner,
    };

    if (viewerId && !isAdmin && property.ownerId !== viewerId) {
      const [qualifyingBooking] = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.propertyId, propertyId),
            eq(bookings.userId, viewerId),
            or(
              eq(bookings.status, "confirmed"),
              eq(bookings.status, "awaiting_full_payment"),
            ),
          ),
        )
        .limit(1);

      if (!qualifyingBooking) {
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

        return ok({
          ...property,
          address: maskedAddress,
          latitude: maskedLatLng?.lat ?? property.latitude,
          longitude: maskedLatLng?.lng ?? property.longitude,
          ...extra,
        });
      }
    } else if (!viewerId) {
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

      return ok({
        ...property,
        address: maskedAddress,
        latitude: maskedLatLng?.lat ?? property.latitude,
        longitude: maskedLatLng?.lng ?? property.longitude,
        ...extra,
      });
    }

    return ok({ ...property, ...extra });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const limited = await enforceRateLimit(req, generalRateLimit);
    if (limited) return limited;

    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const session = await requireSession(["owner", "staff", "admin"] as Role[]);
    const { id: propertyId } = await params;
    const body = updatePropertySchema.parse(await req.json());

    const [existing] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!existing) {
      return fail("Property not found", 404);
    }

    if (session.user.role !== "admin" && existing.ownerId !== session.user.id) {
      return fail("Forbidden", 403);
    }

    const [updated] = await db
      .update(properties)
      .set({
        name: body.title,
        description: body.description,
        address: body.address,
        province: body.province,
        city: body.city,
        type: body.type,
        basePrice: body.basePrice,
        packages: body.packages,
        status: body.status,
        amenities: body.amenities,
        images: body.images,
        metadata: body.metadata,
        latitude:
          body.latitude !== undefined ? String(body.latitude) : undefined,
        longitude:
          body.longitude !== undefined ? String(body.longitude) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, propertyId))
      .returning();

    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const limited = await enforceRateLimit(req, generalRateLimit);
    if (limited) return limited;

    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const session = await requireSession(["owner", "staff", "admin"] as Role[]);
    const { id: propertyId } = await params;

    const [existing] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!existing) {
      return fail("Property not found", 404);
    }

    if (session.user.role !== "admin" && existing.ownerId !== session.user.id) {
      return fail("Forbidden", 403);
    }

    await db.delete(properties).where(eq(properties.id, propertyId));

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
