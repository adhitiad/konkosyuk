import { db } from "@/db";
import { pricingAnalytics, properties } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(["owner", "admin", "staff"]);
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");
    const months = searchParams.get("months") || "12";

    const monthCount = Number(months);

    let effectivePropertyId = propertyId;

    if (session.user.role === "owner") {
      const ownerProperties = await db
        .select({ id: properties.id })
        .from(properties)
        .where(eq(properties.ownerId, session.user.id));

      const propertyIds = ownerProperties.map((p) => p.id);

      if (propertyIds.length === 0) {
        return ok({ data: [] });
      }

      if (!propertyId || !propertyIds.includes(propertyId)) {
        effectivePropertyId = propertyIds[0];
      }
    }

    if (!effectivePropertyId) {
      return ok({ data: [] });
    }

    const data = await db
      .select()
      .from(pricingAnalytics)
      .where(eq(pricingAnalytics.propertyId, effectivePropertyId))
      .orderBy(desc(pricingAnalytics.month))
      .limit(monthCount);

    return ok({ data });
  } catch (error) {
    return handleApiError(error, "GET /api/owner/pricing/analytics");
  }
}
