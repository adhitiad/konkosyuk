import { NextRequest } from "next/server";
import { db } from "@/db";
import { seasonalPricingRules, properties } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { eq } from "drizzle-orm";
import { updateSeasonalPricingRuleSchema } from "@/lib/zod";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(["owner", "admin", "staff"]);
    const { id } = await params;

    const [rule] = await db
      .select()
      .from(seasonalPricingRules)
      .where(eq(seasonalPricingRules.id, id))
      .limit(1);

    if (!rule) {
      return fail("Aturan pricing tidak ditemukan", 404);
    }

    if (session.user.role === "owner") {
      const [property] = await db
        .select()
        .from(properties)
        .where(eq(properties.id, rule.propertyId))
        .limit(1);

      if (!property || property.ownerId !== session.user.id) {
        return fail("Forbidden", 403);
      }
    }

    return ok(rule);
  } catch (error) {
    return handleApiError(error, "GET /api/owner/pricing/[id]");
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(["owner", "admin", "staff"]);
    const { id } = await params;
    const body = updateSeasonalPricingRuleSchema.parse(await req.json());

    const [existing] = await db
      .select()
      .from(seasonalPricingRules)
      .where(eq(seasonalPricingRules.id, id))
      .limit(1);

    if (!existing) {
      return fail("Aturan pricing tidak ditemukan", 404);
    }

    if (session.user.role === "owner") {
      const [property] = await db
        .select()
        .from(properties)
        .where(eq(properties.id, existing.propertyId))
        .limit(1);

      if (!property || property.ownerId !== session.user.id) {
        return fail("Forbidden", 403);
      }
    }

    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.ruleType !== undefined) updateData.ruleType = body.ruleType;
    if (body.adjustmentValue !== undefined)
      updateData.adjustmentValue = String(body.adjustmentValue);
    if (body.startDate !== undefined)
      updateData.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate);
    if (body.minNights !== undefined) updateData.minNights = body.minNights;
    if (body.maxNights !== undefined) updateData.maxNights = body.maxNights;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;

    const [updated] = await db
      .update(seasonalPricingRules)
      .set(updateData)
      .where(eq(seasonalPricingRules.id, id))
      .returning();

    return ok(updated);
  } catch (error) {
    return handleApiError(error, "PUT /api/owner/pricing/[id]");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(["owner", "admin", "staff"]);
    const { id } = await params;

    const [existing] = await db
      .select()
      .from(seasonalPricingRules)
      .where(eq(seasonalPricingRules.id, id))
      .limit(1);

    if (!existing) {
      return fail("Aturan pricing tidak ditemukan", 404);
    }

    if (session.user.role === "owner") {
      const [property] = await db
        .select()
        .from(properties)
        .where(eq(properties.id, existing.propertyId))
        .limit(1);

      if (!property || property.ownerId !== session.user.id) {
        return fail("Forbidden", 403);
      }
    }

    await db
      .delete(seasonalPricingRules)
      .where(eq(seasonalPricingRules.id, id));

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error, "DELETE /api/owner/pricing/[id]");
  }
}
