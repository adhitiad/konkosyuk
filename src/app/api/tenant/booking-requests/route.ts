import { NextRequest } from "next/server";
import { db } from "@/db";
import { bookingRequests, units, properties, users } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { validateMutationCsrf } from "@/lib/api-auth";
import { bookingRateLimit, enforceRateLimit } from "@/lib/rate-limit";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";
import type { Role } from "@/lib/auth";

const createBookingRequestSchema = z.object({
  unitId: z.string().uuid(),
  propertyId: z.string().uuid(),
  numOccupants: z.coerce.number().int().min(1),
  startDate: z.string().datetime(),
});

export async function GET(_req: NextRequest) {
  try {
    const session = await requireSession(["cust"] as Role[]);

    const data = await db
      .select({
        id: bookingRequests.id,
        numOccupants: bookingRequests.numOccupants,
        startDate: bookingRequests.startDate,
        status: bookingRequests.status,
        agreedPrice: bookingRequests.agreedPrice,
        createdAt: bookingRequests.createdAt,
        tenantName: users.name,
        tenantEmail: users.email,
        unitName: units.name,
        propertyName: properties.name,
        unitCapacity: units.capacity,
        matchedPrice: sql<number>`(
          SELECT price FROM unit_pricing_tiers 
          WHERE unit_id = ${bookingRequests.unitId} 
          AND max_occupants >= ${bookingRequests.numOccupants} 
          ORDER BY max_occupants ASC 
          LIMIT 1
        )`,
      })
      .from(bookingRequests)
      .leftJoin(users, eq(bookingRequests.tenantId, users.id))
      .leftJoin(units, eq(bookingRequests.unitId, units.id))
      .leftJoin(properties, eq(bookingRequests.propertyId, properties.id))
      .where(eq(bookingRequests.tenantId, session.user.id))
      .orderBy(desc(bookingRequests.createdAt));

    return ok(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const csrfError = validateMutationCsrf(req);
    if (csrfError) return csrfError;
    const limited = await enforceRateLimit(req, bookingRateLimit);
    if (limited) return limited;
    const session = await requireSession(["cust"] as Role[]);
    const body = createBookingRequestSchema.parse(await req.json());

    const [unit] = await db
      .select()
      .from(units)
      .where(eq(units.id, body.unitId))
      .limit(1);

    if (!unit) {
      return fail("Unit not found", 404);
    }

    if (unit.status !== "available") {
      return fail("Unit is not available", 400);
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, body.propertyId))
      .limit(1);

    if (!property) {
      return fail("Property not found", 404);
    }

    if (unit.propertyId !== property.id) {
      return fail("Unit does not belong to property", 400);
    }

    const capacity = unit.capacity ? parseInt(unit.capacity, 10) : Infinity;
    if (body.numOccupants > capacity) {
      return fail(
        `Jumlah penghuni melebihi kapasitas kamar (${capacity})`,
        400,
      );
    }

    const [existing] = await db
      .select()
      .from(bookingRequests)
      .where(
        and(
          eq(bookingRequests.unitId, body.unitId),
          eq(bookingRequests.tenantId, session.user.id),
          eq(bookingRequests.status, "pending"),
        ),
      )
      .limit(1);

    if (existing) {
      return fail(
        "Anda sudah memiliki permintaan booking yang sedang menunggu untuk unit ini",
        400,
      );
    }

    const id = crypto.randomUUID();

    const [request] = await db
      .insert(bookingRequests)
      .values({
        id,
        tenantId: session.user.id,
        unitId: body.unitId,
        propertyId: body.propertyId,
        numOccupants: body.numOccupants,
        startDate: new Date(body.startDate),
      })
      .returning();

    return ok(request, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
