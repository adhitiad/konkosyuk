import { NextRequest } from "next/server";
import { db } from "@/db";
import { propertyComparisons } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";

const comparisonSchema = z.object({
  propertyIds: z.array(z.string().uuid()).min(2).max(4),
  name: z.string().max(100).optional(),
});

const comparisonQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const rawParams = Object.fromEntries(req.nextUrl.searchParams);
    const query = comparisonQuerySchema.parse(rawParams);
    const { page, limit } = query;

    const offset = (page - 1) * limit;

    const [data, [{ count: totalCount }]] = await Promise.all([
      db
        .select()
        .from(propertyComparisons)
        .where(eq(propertyComparisons.userId, session.user.id))
        .orderBy(propertyComparisons.createdAt)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(propertyComparisons)
        .where(eq(propertyComparisons.userId, session.user.id)),
    ]);

    const total = Number(totalCount);
    const totalPages = Math.ceil(total / limit);

    return ok({ data, meta: { page, limit, total, totalPages } });
  } catch (error) {
    return handleApiError(error, "GET /api/comparisons");
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = comparisonSchema.parse(await req.json());

    const [comparison] = await db
      .insert(propertyComparisons)
      .values({
        userId: session.user.id,
        propertyIds: body.propertyIds,
        name: body.name,
      })
      .returning();

    return ok(comparison, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/comparisons");
  }
}
