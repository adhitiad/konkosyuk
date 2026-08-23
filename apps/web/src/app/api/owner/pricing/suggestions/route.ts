import { NextRequest } from "next/server";
import { db } from "@/db";
import { pricingSuggestions, properties } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(["owner", "admin", "staff"]);
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");
    const status = searchParams.get("status") || "pending";

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
      .from(pricingSuggestions)
      .where(
        and(
          eq(pricingSuggestions.propertyId, effectivePropertyId),
          eq(
            pricingSuggestions.status,
            status as "pending" | "accepted" | "rejected" | "expired",
          ),
        ),
      )
      .orderBy(
        desc(pricingSuggestions.priority),
        desc(pricingSuggestions.createdAt),
      );

    return ok({ data });
  } catch (error) {
    return handleApiError(error, "GET /api/owner/pricing/suggestions");
  }
}
