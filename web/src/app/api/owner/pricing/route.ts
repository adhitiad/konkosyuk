import { NextRequest } from "next/server";
import { db } from "@/db";
import { seasonalPricingRules, properties } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { ok, handleApiError, fail } from "@/lib/api";
import { seasonalPricingRuleSchema, seasonalPricingQuerySchema } from "@/lib/zod";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(["owner", "admin", "staff"]);
    const rawParams = Object.fromEntries(req.nextUrl.searchParams);
    const query = seasonalPricingQuerySchema.parse(rawParams);
    const { propertyId, unitId, isActive, page, limit } = query;

    const ownerProperties = await db
      .select({ id: properties.id })
      .from(properties)
      .where(eq(properties.ownerId, session.user.id));

    const propertyIds = ownerProperties.map((p) => p.id);

    if (propertyIds.length === 0) {
      return ok({ data: [], meta: { total: 0, page, limit, totalPages: 0 } });
    }

    const conditions = [inArray(seasonalPricingRules.propertyId, propertyIds)];

    if (propertyId) {
      conditions.push(eq(seasonalPricingRules.propertyId, propertyId));
    }

    if (unitId) {
      if (unitId === "null") {
        conditions.push(sql`${seasonalPricingRules.unitId} IS NULL`);
      } else {
        conditions.push(eq(seasonalPricingRules.unitId, unitId));
      }
    }

    if (isActive !== undefined) {
      conditions.push(eq(seasonalPricingRules.isActive, isActive));
    }

    const where = and(...conditions);

    const offset = (page - 1) * limit;

    const [data, [{ count: totalCount }]] = await Promise.all([
      db
        .select()
        .from(seasonalPricingRules)
        .where(where)
        .orderBy(desc(seasonalPricingRules.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(seasonalPricingRules)
        .where(where),
    ]);

    const total = Number(totalCount);
    const totalPages = Math.ceil(total / limit);

    return ok({ data, meta: { page, limit, total, totalPages } });
  } catch (error) {
    return handleApiError(error, "GET /api/owner/pricing");
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(["owner", "admin", "staff"]);
    const body = seasonalPricingRuleSchema.parse(await req.json());

    if (session.user.role === "owner") {
      const [property] = await db
        .select()
        .from(properties)
        .where(eq(properties.id, body.propertyId))
        .limit(1);

      if (!property || property.ownerId !== session.user.id) {
        return fail("Forbidden", 403);
      }
    }

    const [rule] = await db
      .insert(seasonalPricingRules)
      .values({
        propertyId: body.propertyId,
        unitId: body.unitId,
        name: body.name,
        ruleType: body.ruleType,
        adjustmentValue: String(body.adjustmentValue),
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        minNights: body.minNights ?? null,
        maxNights: body.maxNights ?? null,
        priority: body.priority,
        isActive: body.isActive,
        metadata: body.metadata ?? {},
      })
      .returning();

    return ok(rule, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/owner/pricing");
  }
}
