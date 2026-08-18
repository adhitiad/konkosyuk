import { db } from "@/db";
import { bookingRequests, units, properties, users } from "@/db/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const session = await requireSession(["owner"] as Role[]);

    const ownerProperties = await db
      .select({ id: properties.id })
      .from(properties)
      .where(eq(properties.ownerId, session.user.id));

    const propertyIds = ownerProperties.map((p) => p.id);
    if (propertyIds.length === 0) {
      return ok({ data: [] });
    }

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
      .where(inArray(bookingRequests.propertyId, propertyIds))
      .orderBy(desc(bookingRequests.createdAt));

    return ok({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
