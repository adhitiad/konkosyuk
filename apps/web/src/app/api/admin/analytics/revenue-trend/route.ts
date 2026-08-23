import { NextRequest } from "next/server";
import { db } from "@/db";
import { payments, bookings, properties, platformSettings } from "@/db/schema";
import { eq, sql, gte, lte, and } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api";
import type { Role } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireSession(["admin", "staff"] as Role[]);
    const { searchParams } = new URL(req.url);
    const months = parseInt(searchParams.get("months") || "12", 10);

    const [settings] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.id, "default"))
      .limit(1);

    const feePercent = parseFloat(settings?.platformFeePercent || "1.8") / 100;

    const now = new Date();
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth() - months + 1,
      1,
    );

    const monthlyData = await db
      .select({
        month: sql<string>`to_char(${payments.paidAt}, 'YYYY-MM')`,
        totalGMV: sql<number>`sum(CAST(${payments.amount} AS NUMERIC))`,
        platformFee: sql<number>`sum(CAST(${payments.amount} AS NUMERIC)) * ${feePercent}`,
        count: sql<number>`count(${payments.id})`,
      })
      .from(payments)
      .leftJoin(bookings, eq(payments.bookingId, bookings.id))
      .leftJoin(properties, eq(bookings.propertyId, properties.id))
      .where(
        and(
          eq(payments.status, "success"),
          gte(payments.paidAt, startDate),
          lte(payments.paidAt, now),
        ),
      )
      .groupBy(sql`to_char(${payments.paidAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${payments.paidAt}, 'YYYY-MM')`);

    const chartData = monthlyData.map((row) => ({
      month: row.month,
      totalGMV: Number(row.totalGMV.toFixed(2)),
      platformFee: Number(row.platformFee.toFixed(2)),
      ownerEarnings: Number((row.totalGMV - row.platformFee).toFixed(2)),
      count: Number(row.count),
    }));

    return ok({
      chartData,
      feePercent: Number((feePercent * 100).toFixed(2)),
      period: {
        startDate: startDate.toISOString().split("T")[0],
        endDate: now.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/analytics/revenue-trend");
  }
}
