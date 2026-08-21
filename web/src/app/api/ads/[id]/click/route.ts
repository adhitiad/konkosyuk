import { NextRequest } from "next/server";
import { db } from "@/db";
import { propertyAds } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { ok, fail, handleApiError } from "@/lib/api";
import { logApiRequest, logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const startTime = Date.now();
  const { id } = await params;

  try {
    if (!id || typeof id !== "string") {
      return fail("Invalid ad id", 400);
    }

    const [ad] = await db
      .select()
      .from(propertyAds)
      .where(eq(propertyAds.id, id))
      .limit(1);

    if (!ad) {
      return fail("Ad not found", 404);
    }

    await db
      .update(propertyAds)
      .set({ clicks: sql`${propertyAds.clicks} + 1` })
      .where(eq(propertyAds.id, id));

    const duration = Date.now() - startTime;
    logApiRequest("POST", `/api/ads/${id}/click`, 200, duration);

    return ok({ redirectUrl: ad.targetUrl });
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(error, "POST /api/ads/[id]/click");
    logApiRequest("POST", `/api/ads/${id}/click`, 500, duration);
    return handleApiError(error, "POST /api/ads/[id]/click");
  }
}
