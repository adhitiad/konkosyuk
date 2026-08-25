import { NextRequest } from "next/server";
import { db } from "@/db";
import { propertyAds, adPackages } from "@/db/schema";
import { eq, and, sql, gte, lte, desc, sum, count } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireSession(["admin"]);

    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get("period") || "month";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const now = new Date();
    let start: Date;
    let end: Date = now;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (period) {
        case "today":
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "week":
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "quarter":
          start = new Date(
            now.getFullYear(),
            Math.floor(now.getMonth() / 3) * 3,
            1,
          );
          break;
        case "year":
          start = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          start = new Date(0);
      }
    }

    const paidAds = await db
      .select({
        id: propertyAds.id,
        title: propertyAds.title,
        advertiserName: propertyAds.advertiserName,
        paidAt: propertyAds.paidAt,
        paymentStatus: propertyAds.paymentStatus,
        packageId: propertyAds.packageId,
        price: propertyAds.price,
      })
      .from(propertyAds)
      .where(
        and(
          eq(propertyAds.paymentStatus, "paid"),
          gte(propertyAds.paidAt, start),
          lte(propertyAds.paidAt, end),
        ),
      )
      .orderBy(desc(propertyAds.paidAt))
      .limit(20);

    const [{ totalRevenue }] = await db
      .select({ totalRevenue: sum(propertyAds.price) })
      .from(propertyAds)
      .where(
        and(
          eq(propertyAds.paymentStatus, "paid"),
          gte(propertyAds.paidAt, start),
          lte(propertyAds.paidAt, end),
        ),
      );

    const [{ totalPaid }] = await db
      .select({ totalPaid: count() })
      .from(propertyAds)
      .where(
        and(
          eq(propertyAds.paymentStatus, "paid"),
          gte(propertyAds.paidAt, start),
          lte(propertyAds.paidAt, end),
        ),
      );

    const [{ totalPending }] = await db
      .select({ totalPending: count() })
      .from(propertyAds)
      .where(eq(propertyAds.paymentStatus, "pending"));

    const byTier = await db
      .select({
        tier: adPackages.tier,
        revenue: sql<number>`COALESCE(SUM(${propertyAds.price}), 0)`,
        count: count(),
      })
      .from(propertyAds)
      .leftJoin(adPackages, eq(propertyAds.packageId, adPackages.id))
      .where(
        and(
          eq(propertyAds.paymentStatus, "paid"),
          gte(propertyAds.paidAt, start),
          lte(propertyAds.paidAt, end),
        ),
      )
      .groupBy(adPackages.tier);

    const byPackage = await db
      .select({
        packageId: propertyAds.packageId,
        label: adPackages.label,
        tier: adPackages.tier,
        revenue: sql<number>`COALESCE(SUM(${propertyAds.price}), 0)`,
        count: count(),
      })
      .from(propertyAds)
      .leftJoin(adPackages, eq(propertyAds.packageId, adPackages.id))
      .where(
        and(
          eq(propertyAds.paymentStatus, "paid"),
          gte(propertyAds.paidAt, start),
          lte(propertyAds.paidAt, end),
        ),
      )
      .groupBy(propertyAds.packageId, adPackages.label, adPackages.tier);

    const conversionRate =
      totalPaid + totalPending > 0
        ? (totalPaid / (totalPaid + totalPending)) * 100
        : 0;

    return ok({
      totalRevenue: Number(totalRevenue) || 0,
      totalPaid: Number(totalPaid) || 0,
      totalPending: Number(totalPending) || 0,
      conversionRate: conversionRate.toFixed(1),
      byTier: byTier.reduce<Record<string, { revenue: number; count: number }>>(
        (acc, row) => {
          if (row.tier) {
            acc[row.tier] = {
              revenue: Number(row.revenue),
              count: Number(row.count),
            };
          }
          return acc;
        },
        {},
      ),
      byPackage: byPackage.map((row) => ({
        packageId: row.packageId,
        label: row.label,
        tier: row.tier,
        revenue: Number(row.revenue),
        count: Number(row.count),
      })),
      recentTransactions: paidAds.map((ad) => ({
        adId: ad.id,
        title: ad.title,
        advertiserName: ad.advertiserName,
        price: ad.price,
        paidAt: ad.paidAt,
        paymentStatus: ad.paymentStatus,
      })),
    });
  } catch (error) {
    logError(error, "GET /api/admin/ad-revenue");
    return handleApiError(error, "GET /api/admin/ad-revenue");
  }
}
