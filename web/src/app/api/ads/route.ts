import { NextRequest } from "next/server";
import { db } from "@/db";
import { propertyAds, adPackages } from "@/db/schema";
import { eq, and, sql, gte, inArray, desc, asc } from "drizzle-orm";
import { ok, handleApiError } from "@/lib/api";
import { enforceRateLimit, publicRateLimit } from "@/lib/rate-limit";
import { logApiRequest, logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    const limited = await enforceRateLimit(req, publicRateLimit);
    if (limited) return limited;

    const searchParams = req.nextUrl.searchParams;
    const limit = Math.min(Number(searchParams.get("limit")) || 3, 10);
    const type = searchParams.get("type");

    const now = new Date();

    const conditions = [
      eq(propertyAds.isActive, true),
      eq(propertyAds.paymentStatus, "paid"),
      gte(propertyAds.startDate, now),
      sql`${propertyAds.endDate} IS NULL OR ${propertyAds.endDate} >= ${now}`,
    ];

    if (type) {
      conditions.push(eq(propertyAds.type, type as "kos" | "kontrakan" | "apartemen" | "rumah"));
    }

    const ads = await db
      .select({
        id: propertyAds.id,
        title: propertyAds.title,
        description: propertyAds.description,
        imageUrl: propertyAds.imageUrl,
        targetUrl: propertyAds.targetUrl,
        location: propertyAds.location,
        price: propertyAds.price,
        type: propertyAds.type,
        advertiserName: propertyAds.advertiserName,
      })
      .from(propertyAds)
      .leftJoin(adPackages, eq(propertyAds.packageId, adPackages.id))
      .where(and(...conditions))
      .orderBy(
        asc(sql`CASE WHEN ${adPackages.positionType} = 'fixed_1' THEN 1 WHEN ${adPackages.positionType} = 'fixed_2' THEN 2 ELSE 3 END`),
        desc(propertyAds.paidAt),
      )
      .limit(limit);

    const adIds = ads.map((ad) => ad.id);
    if (adIds.length > 0) {
      await db
        .update(propertyAds)
        .set({ impressions: sql`${propertyAds.impressions} + 1` })
        .where(inArray(propertyAds.id, adIds));
    }

    const duration = Date.now() - startTime;
    logApiRequest("GET", "/api/ads", 200, duration);

    return ok({ ads });
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(error, "GET /api/ads");
    logApiRequest("GET", "/api/ads", 500, duration);
    return handleApiError(error, "GET /api/ads");
  }
}
