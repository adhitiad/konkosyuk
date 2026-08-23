import { db } from "@/db";
import { bookings, properties, units, payments } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const session = await requireSession(["owner", "admin", "staff"]);

    const ownerProperties = await db
      .select({ id: properties.id })
      .from(properties)
      .where(eq(properties.ownerId, session.user.id));

    const propertyIds = ownerProperties.map((p) => p.id);

    const totalBookings = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(eq(bookings.propertyId, propertyIds[0]));

    const totalRevenue = await db
      .select({ sum: sql<number>`sum(CAST(${payments.amount} AS NUMERIC))` })
      .from(payments)
      .where(eq(payments.propertyId, propertyIds[0]));

    const totalUnits = await db
      .select({ count: sql<number>`count(*)` })
      .from(units)
      .where(eq(units.propertyId, propertyIds[0]));

    const bookedUnits = await db
      .select({ count: sql<number>`count(*)` })
      .from(units)
      .where(
        and(eq(units.propertyId, propertyIds[0]), eq(units.status, "booked")),
      );

    const occupancyRate =
      Number(totalUnits[0]?.count || 0) > 0
        ? Number(bookedUnits[0]?.count || 0) / Number(totalUnits[0]?.count || 0)
        : 0;

    return ok({
      totalBookings: Number(totalBookings[0]?.count || 0),
      totalRevenue: Number(totalRevenue[0]?.sum || 0),
      occupancyRate,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
