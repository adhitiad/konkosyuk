import { NextRequest } from "next/server";
import { db } from "@/db";
import { bookings, properties, units, payments } from "@/db/schema";
import { eq, and, sql, count, sum, inArray } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api";
import type { Role } from "@/lib/auth";
import { logError } from "@/lib/logger";
import type { PgColumn } from "drizzle-orm/pg-core";

export async function GET(_req: NextRequest) {
  try {
    const session = await requireSession(["owner", "admin"] as Role[]);

    const ownerProperties = await db
      .select({ id: properties.id })
      .from(properties)
      .where(eq(properties.ownerId, session.user.id));

    const propertyIds = ownerProperties.map((p) => p.id);

    if (propertyIds.length === 0) {
      return ok({
        totalRevenue: 0,
        monthlyRevenue: 0,
        totalProperties: 0,
        totalUnits: 0,
        occupiedUnits: 0,
        availableUnits: 0,
        totalBookings: 0,
        pendingBookings: 0,
        occupancyRate: 0,
      });
    }

    const [propertiesCount] = await db
      .select({ count: count() })
      .from(properties)
      .where(eq(properties.ownerId, session.user.id));

    const unitsStats = await db
      .select({
        total: count(),
        occupied: sql<number>`COUNT(CASE WHEN ${units.status} = 'booked' THEN 1 END)`,
        available: sql<number>`COUNT(CASE WHEN ${units.status} = 'available' THEN 1 END)`,
      })
      .from(units)
      .where(inArray(units.propertyId, propertyIds));

    const bookingsStats = await db
      .select({
        total: count(),
        pending: sql<number>`COUNT(CASE WHEN ${bookings.status} = 'pending_dp' THEN 1 END)`,
      })
      .from(bookings)
      .where(inArray(bookings.propertyId, propertyIds));

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [revenueStats] = await db
      .select({
        total: sum(castAmount(payments.amount)),
        monthly: sum(
          sql<number>`CASE WHEN ${payments.paidAt} >= ${startOfMonth} THEN ${castAmount(payments.amount)} ELSE 0 END`,
        ),
      })
      .from(payments)
      .where(
        and(
          inArray(payments.propertyId, propertyIds),
          eq(payments.status, "success"),
        ),
      );

    const totalRevenue = Number(revenueStats?.total ?? 0);
    const monthlyRevenue = Number(revenueStats?.monthly ?? 0);
    const totalUnits = Number(unitsStats[0]?.total ?? 0);
    const occupiedUnits = Number(unitsStats[0]?.occupied ?? 0);
    const availableUnits = Number(unitsStats[0]?.available ?? 0);
    const occupancyRate =
      totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    return ok({
      totalRevenue,
      monthlyRevenue,
      totalProperties: Number(propertiesCount?.count ?? 0),
      totalUnits,
      occupiedUnits,
      availableUnits,
      totalBookings: Number(bookingsStats[0]?.total ?? 0),
      pendingBookings: Number(bookingsStats[0]?.pending ?? 0),
      occupancyRate,
    });
  } catch (error) {
    logError(error, "GET /api/owner/reports");
    return handleApiError(error, "GET /api/owner/reports");
  }
}

function castAmount(column: PgColumn): sql.SQL<number> {
  return sql<number>`CAST(${column} AS NUMERIC)`;
}
