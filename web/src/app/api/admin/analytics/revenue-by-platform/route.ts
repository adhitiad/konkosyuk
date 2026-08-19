import { NextRequest } from "next/server";
import { db } from "@/db";
import { payments, bookings, properties } from "@/db/schema";
import { eq, sql, and, gte, lte } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api";
import type { Role } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireSession(["admin", "staff"] as Role[]);
    const { searchParams } = new URL(req.url);
    const months = parseInt(searchParams.get("months") || "12", 10);

    const now = new Date();
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth() - months + 1,
      1,
    );
    const endDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const platformRevenue = await db
      .select({
        provider: payments.provider,
        totalRevenue: sql<number>`sum(CAST(${payments.amount} AS NUMERIC))`,
        count: sql<number>`count(${payments.id})`,
      })
      .from(payments)
      .leftJoin(bookings, eq(payments.bookingId, bookings.id))
      .leftJoin(properties, eq(bookings.propertyId, properties.id))
      .where(
        and(
          eq(payments.status, "success"),
          gte(payments.paidAt, startDate),
          lte(payments.paidAt, endDate),
        ),
      )
      .groupBy(payments.provider)
      .orderBy(sql`sum(CAST(${payments.amount} AS NUMERIC)) DESC`);

    const chartData = platformRevenue.map((row) => ({
      platform: row.provider,
      revenue: Number(row.totalRevenue.toFixed(2)),
      count: Number(row.count),
    }));

    return ok({
      chartData,
      period: {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    return handleApiError(
      error,
      "GET /api/admin/analytics/revenue-by-platform",
    );
  }
}
