import { NextRequest } from "next/server";
import { db } from "@/db";
import { loyaltyTransactions } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api";
import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";

const loyaltyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum(["earn", "redeem", "expire", "bonus"]).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const url = new URL(req.url);
    const query = loyaltyQuerySchema.parse(
      Object.fromEntries(url.searchParams),
    );
    const { page, limit, type } = query;

    const conditions = [eq(loyaltyTransactions.userId, session.user.id)];
    if (type) {
      conditions.push(eq(loyaltyTransactions.type, type));
    }

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(loyaltyTransactions)
        .where(and(...conditions))
        .orderBy(desc(loyaltyTransactions.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ count: sql<number>`count(*)` })
        .from(loyaltyTransactions)
        .where(and(...conditions)),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);
    const totalPages = Math.ceil(total / limit);

    const balanceResult = await db
      .select({ balance: sql<number>`sum(${loyaltyTransactions.amount})` })
      .from(loyaltyTransactions)
      .where(eq(loyaltyTransactions.userId, session.user.id));

    const balance = Number(balanceResult[0]?.balance ?? 0);

    return ok({ data, meta: { page, limit, total, totalPages }, balance });
  } catch (error) {
    return handleApiError(error, "GET /api/loyalty/transactions");
  }
}
