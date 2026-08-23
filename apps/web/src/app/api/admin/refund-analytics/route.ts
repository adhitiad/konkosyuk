import { NextRequest } from "next/server";
import { db } from "@/db";
import { refundRequests } from "@/db/schema";
import { sql, desc, gte } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireSession(["admin", "staff"]);

    const searchParams = req.nextUrl.searchParams;
    const months = Number(searchParams.get("months") || "12");

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const monthlyStats = await db
      .select({
        month: sql<string>`TO_CHAR(${refundRequests.createdAt}, 'YYYY-MM')`,
        count: sql<number>`count(*)`,
        approved: sql<number>`count(*) FILTER (WHERE ${refundRequests.status} = 'approved')`,
        rejected: sql<number>`count(*) FILTER (WHERE ${refundRequests.status} = 'rejected')`,
        pending: sql<number>`count(*) FILTER (WHERE ${refundRequests.status} = 'pending')`,
        totalAmount: sql<number>`COALESCE(SUM(CAST(${refundRequests.amount} AS NUMERIC)), 0)`,
        approvedAmount: sql<number>`COALESCE(SUM(CAST(${refundRequests.approvedAmount} AS NUMERIC) * (CASE WHEN ${refundRequests.status} = 'approved' THEN 1 ELSE 0 END)), 0)`,
      })
      .from(refundRequests)
      .where(gte(refundRequests.createdAt, startDate))
      .groupBy(sql`TO_CHAR(${refundRequests.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${refundRequests.createdAt}, 'YYYY-MM')`);

    const topReasons = await db
      .select({
        reason: refundRequests.reason,
        count: sql<number>`count(*)`,
      })
      .from(refundRequests)
      .where(gte(refundRequests.createdAt, startDate))
      .groupBy(refundRequests.reason)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    const totalStats = await db
      .select({
        total: sql<number>`count(*)`,
        approved: sql<number>`count(*) FILTER (WHERE ${refundRequests.status} = 'approved')`,
        rejected: sql<number>`count(*) FILTER (WHERE ${refundRequests.status} = 'rejected')`,
        pending: sql<number>`count(*) FILTER (WHERE ${refundRequests.status} = 'pending')`,
        totalAmount: sql<number>`COALESCE(SUM(CAST(${refundRequests.amount} AS NUMERIC)), 0)`,
        approvedAmount: sql<number>`COALESCE(SUM(CAST(${refundRequests.approvedAmount} AS NUMERIC)), 0)`,
      })
      .from(refundRequests)
      .where(gte(refundRequests.createdAt, startDate));

    return ok({
      monthlyStats,
      topReasons,
      totals: totalStats[0] ?? {
        total: 0,
        approved: 0,
        rejected: 0,
        pending: 0,
        totalAmount: 0,
        approvedAmount: 0,
      },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/admin/refund-analytics");
  }
}
