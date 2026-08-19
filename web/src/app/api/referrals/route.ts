import { NextRequest } from "next/server";
import { db } from "@/db";
import { referrals, users, properties } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { dispatchReferralReward } from "@/lib/notification-service";

const createReferralSchema = z.object({
  refereeEmail: z.string().email("Format email tidak valid"),
  refereeName: z.string().min(1, "Nama harus diisi"),
  propertyId: z.string().uuid().optional(),
  message: z.string().optional(),
});

const referralQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["pending", "completed", "cancelled"]).optional(),
});

function generateReferralCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const url = new URL(req.url);
    const query = referralQuerySchema.parse(Object.fromEntries(url.searchParams));
    const { page, limit, status } = query;

    const conditions = [eq(referrals.referrerId, session.user.id)];
    if (status) {
      conditions.push(eq(referrals.status, status));
    }

    const [data, totalResult] = await Promise.all([
      db
        .select()
        .from(referrals)
        .where(and(...conditions))
        .orderBy(desc(referrals.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ count: sql<number>`count(*)` }).from(referrals).where(and(...conditions)),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);
    const totalPages = Math.ceil(total / limit);

    return ok({ data, meta: { page, limit, total, totalPages } });
  } catch (error) {
    return handleApiError(error, "GET /api/referrals");
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = createReferralSchema.parse(await req.json());

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.refereeEmail))
      .limit(1);

    if (existingUser && existingUser.id === session.user.id) {
      return fail("Tidak dapat mereferensikan diri sendiri", 400);
    }

    const code = generateReferralCode();
    const [referral] = await db
      .insert(referrals)
      .values({
        referrerId: session.user.id,
        refereeId: existingUser?.id || null,
        code,
        propertyId: body.propertyId || null,
        status: existingUser ? "completed" : "pending",
        completedAt: existingUser ? new Date() : null,
      })
      .returning();

    if (existingUser) {
      await db.insert(loyaltyTransactions).values({
        userId: session.user.id,
        amount: 10000,
        type: "earn",
        description: `Referral reward: ${body.refereeName}`,
        referenceId: referral.id,
        referenceType: "referral",
      });

      dispatchReferralReward(session.user.id, 10000, code).catch(() => {});
    }

    return ok(referral, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message || "Input tidak valid", 400);
    }
    return handleApiError(error, "POST /api/referrals");
  }
}
