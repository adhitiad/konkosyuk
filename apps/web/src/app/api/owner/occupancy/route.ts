import { NextRequest } from "next/server";
import { db } from "@/db";
import { bookings, properties, units } from "@/db/schema";
import { eq, sql, and, gte, lte, inArray } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api";
import { z } from "zod";

const occupancyQuerySchema = z.object({
  propertyId: z.string().uuid().optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(["owner", "admin", "staff"]);

    const { searchParams } = new URL(req.url);
    const query = occupancyQuerySchema.parse(Object.fromEntries(searchParams));

    const now = new Date();
    const year = query.year ?? now.getFullYear();
    const month = query.month ?? now.getMonth() + 1;

    const ownerProperties = await db
      .select({ id: properties.id })
      .from(properties)
      .where(eq(properties.ownerId, session.user.id));

    const propertyIds = ownerProperties.map((p) => p.id);

    if (propertyIds.length === 0) {
      return ok({
        overallOccupancy: 0,
        byProperty: [],
        dailyData: [],
      });
    }

    const effectivePropertyIds = query.propertyId
      ? propertyIds.includes(query.propertyId)
        ? [query.propertyId]
        : []
      : propertyIds;

    if (effectivePropertyIds.length === 0) {
      return ok({
        overallOccupancy: 0,
        byProperty: [],
        dailyData: [],
      });
    }

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    const totalUnitsRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(units)
      .where(inArray(units.propertyId, effectivePropertyIds));

    const totalUnits = Number(totalUnitsRow[0]?.count || 0);

    const occupiedUnitsRow = await db
      .select({ count: sql<number>`count(DISTINCT ${bookings.unitId})` })
      .from(bookings)
      .where(
        and(
          inArray(bookings.propertyId, effectivePropertyIds),
          inArray(bookings.status, ["confirmed", "completed"]),
          lte(bookings.startDate, monthEnd),
          gte(bookings.endDate, monthStart),
        ),
      );

    const occupiedUnits = Number(occupiedUnitsRow[0]?.count || 0);
    const overallOccupancy =
      totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    const byPropertyRows = await db
      .select({
        propertyId: properties.id,
        propertyName: properties.name,
        totalUnits: sql<number>`count(DISTINCT ${units.id})`,
        occupiedUnits: sql<number>`count(DISTINCT ${bookings.unitId})`,
      })
      .from(properties)
      .leftJoin(
        units,
        and(inArray(units.propertyId, effectivePropertyIds)),
      )
      .leftJoin(
        bookings,
        and(
          eq(bookings.propertyId, properties.id),
          inArray(bookings.status, ["confirmed", "completed"]),
          lte(bookings.startDate, monthEnd),
          gte(bookings.endDate, monthStart),
        ),
      )
      .where(inArray(properties.id, effectivePropertyIds))
      .groupBy(properties.id, properties.name);

    const byProperty = await Promise.all(
      byPropertyRows.map(async (row) => {
        const avgDailyRateRow = await db
          .select({ avg: sql<number>`avg(CAST(${units.price} AS NUMERIC))` })
          .from(units)
          .where(
            and(
              eq(units.propertyId, row.propertyId),
              eq(units.status, "booked"),
            ),
          );

        const total = Number(row.totalUnits || 0);
        const occupied = Number(row.occupiedUnits || 0);
        const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;

        return {
          propertyId: row.propertyId,
          propertyName: row.propertyName,
          totalUnits: total,
          occupiedUnits: occupied,
          occupancyRate: rate,
          avgDailyRate: Number(avgDailyRateRow[0]?.avg || 0),
        };
      }),
    );

    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyData: { date: string; occupied: number; total: number; rate: number }[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().split("T")[0];
      const dayStart = new Date(year, month - 1, day, 0, 0, 0);
      const dayEnd = new Date(year, month - 1, day, 23, 59, 59);

      const occupiedRow = await db
        .select({ count: sql<number>`count(DISTINCT ${bookings.unitId})` })
        .from(bookings)
        .where(
          and(
            inArray(bookings.propertyId, effectivePropertyIds),
            inArray(bookings.status, ["confirmed", "completed"]),
            lte(bookings.startDate, dayEnd),
            gte(bookings.endDate, dayStart),
          ),
        );

      const occupied = Number(occupiedRow[0]?.count || 0);
      const rate = totalUnits > 0 ? Math.round((occupied / totalUnits) * 100) : 0;

      dailyData.push({
        date: dateStr,
        occupied,
        total: totalUnits,
        rate,
      });
    }

    return ok({
      overallOccupancy,
      byProperty,
      dailyData,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/owner/occupancy");
  }
}
