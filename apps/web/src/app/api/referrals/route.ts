import { NextRequest } from "next/server";
import { db } from "@/db";
import { referrals, users } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { validateCsrfToken } from "@/lib/csrf";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { enforceRateLimit, generalRateLimit } from "@/lib/rate-limit";
import {
  dispatchReferralStatusUpdate,
  dispatchReferralVoucherConverted,
  dispatchReferralOffsetApplied,
} from "@/lib/notification-service";
import {
  createReferralSchema,
  referralQuerySchema,
  referralActionSchema,
} from "@konkosyuk/shared";

export const referralStatus = [
  "pending",
  "verifying",
  "eligible",
  "failed",
  "completed",
  "cancelled",
] as const;
export const referralCategory = ["owner", "tenant"] as const;

function generateReferralCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getTierForCategory(
  category: "owner" | "tenant",
  completedCount: number,
): number {
  if (category === "owner") {
    if (completedCount >= 847) return 4;
    if (completedCount >= 373) return 3;
    if (completedCount >= 101) return 2;
    return 1;
  }
  if (completedCount >= 847) return 4;
  if (completedCount >= 373) return 3;
  if (completedCount >= 101) return 2;
  return 1;
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const url = new URL(req.url);
    const query = referralQuerySchema.parse(
      Object.fromEntries(url.searchParams),
    );
    const { page, limit, category, status } = query;

    const conditions = [eq(referrals.referrerId, session.user.id)];
    if (category) {
      conditions.push(eq(referrals.category, category));
    }
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
      db
        .select({ count: sql<number>`count(*)` })
        .from(referrals)
        .where(and(...conditions)),
    ]);

    const completedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(referrals)
      .where(
        and(
          eq(referrals.referrerId, session.user.id),
          eq(referrals.status, "completed"),
        ),
      );

    const totalCompleted = Number(completedCount[0]?.count ?? 0);
    const currentTier = getTierForCategory(
      data[0]?.category || "tenant",
      totalCompleted,
    );

    const total = Number(totalResult[0]?.count ?? 0);
    const totalPages = Math.ceil(total / limit);

    return ok({
      data,
      meta: { page, limit, total, totalPages },
      tier: currentTier,
      completedCount: totalCompleted,
    });
  } catch (error) {
    return handleApiError(error, "GET /api/referrals");
  }
}

export async function POST(req: NextRequest) {
  try {
    const limited = await enforceRateLimit(req, generalRateLimit);
    if (limited) return limited;

    const session = await requireSession();

    const csrfResult = validateCsrfToken(req);
    if (!csrfResult.success) return csrfResult.error!;

    const body = createReferralSchema.parse(await req.json());

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.refereeEmail))
      .limit(1);

    if (existingUser && existingUser.id === session.user.id) {
      return fail("Tidak dapat mereferensikan diri sendiri", 400);
    }

    const existingReferral = await db
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.referrerId, session.user.id),
          eq(referrals.refereeId, existingUser?.id || ""),
        ),
      )
      .limit(1);

    if (existingReferral.length > 0) {
      return fail("Referral untuk pengguna ini sudah ada", 400);
    }

    if (body.category === "tenant" && existingUser) {
      const [priorCompleted] = await db
        .select()
        .from(referrals)
        .where(
          and(
            eq(referrals.referrerId, session.user.id),
            eq(referrals.refereeId, existingUser.id),
            eq(referrals.category, "tenant"),
            eq(referrals.status, "completed"),
          ),
        )
        .limit(1);
      if (priorCompleted) {
        return fail(
          "Sudah pernah mendapat komisi tenant dari referee ini",
          400,
        );
      }
    }

    const code = generateReferralCode();
    const completedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(referrals)
      .where(
        and(
          eq(referrals.referrerId, session.user.id),
          eq(referrals.status, "completed"),
        ),
      );

    const totalCompleted = Number(completedCount[0]?.count ?? 0);
    const tier = getTierForCategory(body.category, totalCompleted);

    const [referral] = await db
      .insert(referrals)
      .values({
        referrerId: session.user.id,
        refereeId: existingUser?.id || null,
        code,
        category: body.category,
        propertyId: body.propertyId || null,
        status: existingUser ? "verifying" : "pending",
        tier,
        metadata: { refereeName: body.refereeName, message: body.message },
      })
      .returning();

    if (existingUser) {
      dispatchReferralStatusUpdate(session.user.id, code, "verifying", {
        refereeEmail: body.refereeEmail,
      }).catch(() => {});
    }

    return ok(referral, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message || "Input tidak valid", 400);
    }
    return handleApiError(error, "POST /api/referrals");
  }
}

export async function PUT(req: NextRequest) {
  try {
    const limited = await enforceRateLimit(req, generalRateLimit);
    if (limited) return limited;

    const session = await requireSession();

    const csrfResult = validateCsrfToken(req);
    if (!csrfResult.success) return csrfResult.error!;

    const body = referralActionSchema.parse(await req.json());

    const result = await db.transaction(async (tx) => {
      const [referral] = await tx
        .select()
        .from(referrals)
        .where(eq(referrals.id, body.id))
        .for("update")
        .limit(1);

      if (!referral) {
        return fail("Referral tidak ditemukan", 404);
      }

      if (
        referral.referrerId !== session.user.id &&
        session.user.role !== "admin"
      ) {
        return fail("Forbidden", 403);
      }

      if (body.action === "convert_voucher" && referral.category === "owner") {
        if (referral.status !== "eligible") {
          return fail("Referral belum eligible untuk dikonversi", 400);
        }
        const voucherCode = `VOUCHER-${referral.code}`;
        await tx
          .update(referrals)
          .set({
            status: "completed",
            voucherCode,
            completedAt: new Date(),
          })
          .where(eq(referrals.id, body.id));

        await tx
          .update(users)
          .set({ totalReferrals: sql`${users.totalReferrals} + 1` })
          .where(eq(users.id, referral.referrerId));

        dispatchReferralVoucherConverted(
          session.user.id,
          referral.code,
          voucherCode,
        ).catch(() => {});

        return ok({ ...referral, status: "completed", voucherCode });
      }

      if (body.action === "apply_offset" && referral.category === "tenant") {
        if (referral.status !== "eligible") {
          return fail("Referral belum eligible untuk dipotong", 400);
        }
        if (referral.offsetApplied) {
          return fail("Offset sudah diterapkan", 400);
        }
        await tx
          .update(referrals)
          .set({
            offsetApplied: true,
            status: "completed",
            completedAt: new Date(),
          })
          .where(eq(referrals.id, body.id));

        await tx
          .update(users)
          .set({ totalReferrals: sql`${users.totalReferrals} + 1` })
          .where(eq(users.id, referral.referrerId));

        dispatchReferralOffsetApplied(session.user.id, referral.code).catch(
          () => {},
        );

        return ok({ ...referral, status: "completed", offsetApplied: true });
      }

      return fail("Action tidak dikenali", 400);
    });

    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message || "Input tidak valid", 400);
    }
    return handleApiError(error, "PUT /api/referrals/[id]");
  }
}
