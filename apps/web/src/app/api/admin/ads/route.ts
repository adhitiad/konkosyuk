import { NextRequest } from "next/server";
import { db } from "@/db";
import { propertyAds, properties, adPackages } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api";
import { logApiRequest, logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    await requireSession(["admin", "staff"]);

    const searchParams = req.nextUrl.searchParams;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 100);
    const isActive = searchParams.get("isActive");

    const offset = (page - 1) * limit;

    const conditions = [];
    if (isActive !== null) {
      conditions.push(eq(propertyAds.isActive, isActive === "true"));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [ads, [{ count: totalCount }]] = await Promise.all([
      db
        .select({
          id: propertyAds.id,
          propertyId: propertyAds.propertyId,
          propertyName: properties.name,
          advertiserName: propertyAds.advertiserName,
          advertiserPhone: propertyAds.advertiserPhone,
          advertiserWhatsApp: propertyAds.advertiserWhatsApp,
          title: propertyAds.title,
          description: propertyAds.description,
          imageUrl: propertyAds.imageUrl,
          targetUrl: propertyAds.targetUrl,
          location: propertyAds.location,
          price: propertyAds.price,
          type: propertyAds.type,
          position: propertyAds.position,
          isActive: propertyAds.isActive,
          clicks: propertyAds.clicks,
          impressions: propertyAds.impressions,
          startDate: propertyAds.startDate,
          endDate: propertyAds.endDate,
          createdAt: propertyAds.createdAt,
          updatedAt: propertyAds.updatedAt,
          packageId: propertyAds.packageId,
          packageLabel: adPackages.label,
          packageTier: adPackages.tier,
          paymentStatus: propertyAds.paymentStatus,
          paidAt: propertyAds.paidAt,
          adminNote: propertyAds.adminNote,
        })
        .from(propertyAds)
        .leftJoin(properties, eq(propertyAds.propertyId, properties.id))
        .leftJoin(adPackages, eq(propertyAds.packageId, adPackages.id))
        .where(where)
        .orderBy(desc(propertyAds.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(propertyAds)
        .where(where),
    ]);

    const totalPages = Math.ceil(Number(totalCount) / limit);

    const duration = Date.now() - startTime;
    logApiRequest("GET", "/api/admin/ads", 200, duration);

    return ok({
      data: ads,
      meta: { page, limit, total: Number(totalCount), totalPages },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const statusCode =
      error instanceof Error && "statusCode" in error
        ? (error as { statusCode: number }).statusCode
        : 500;
    logApiRequest("GET", "/api/admin/ads", statusCode, duration);
    logError(error, "GET /api/admin/ads");
    return handleApiError(error, "GET /api/admin/ads");
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession(["admin"]);

    const body = await req.json();

    const [ad] = await db
      .insert(propertyAds)
      .values({
        propertyId: body.propertyId,
        advertiserName: body.advertiserName,
        advertiserPhone: body.advertiserPhone,
        advertiserWhatsApp: body.advertiserWhatsApp,
        title: body.title,
        description: body.description,
        imageUrl: body.imageUrl,
        targetUrl: body.targetUrl,
        location: body.location,
        price: body.price,
        type: body.type,
        position: body.position ?? 0,
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        endDate: body.endDate ? new Date(body.endDate) : null,
      })
      .returning();

    return ok(ad, 201);
  } catch (error) {
    logError(error, "POST /api/admin/ads");
    return handleApiError(error, "POST /api/admin/ads");
  }
}
