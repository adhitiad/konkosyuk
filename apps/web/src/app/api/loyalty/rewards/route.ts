import { NextRequest } from "next/server";
import { db } from "@/db";
import {
  rewards,
  rewardRedemptions,
  loyaltyTransactions,
  users,
} from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { dispatchNotification } from "@/lib/notification-service";

const redeemRewardSchema = z.object({
  rewardId: z.string().uuid(),
});

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const activeOnly = url.searchParams.get("active") !== "false";

    const rewardList = await db
      .select()
      .from(rewards)
      .where(activeOnly ? eq(rewards.isActive, true) : undefined)
      .orderBy(desc(rewards.createdAt));

    return ok({ data: rewardList });
  } catch (error) {
    return handleApiError(error, "GET /api/loyalty/rewards");
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = redeemRewardSchema.parse(await req.json());

    const [reward] = await db
      .select()
      .from(rewards)
      .where(eq(rewards.id, body.rewardId))
      .limit(1);

    if (!reward) {
      return fail("Reward tidak ditemukan", 404);
    }

    if (!reward.isActive) {
      return fail("Reward tidak aktif", 400);
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return fail("User tidak ditemukan", 404);
    }

    const pointsBalanceResult = await db
      .select({ balance: sql<number>`sum(${loyaltyTransactions.amount})` })
      .from(loyaltyTransactions)
      .where(eq(loyaltyTransactions.userId, session.user.id));

    const pointsBalance = Number(pointsBalanceResult[0]?.balance ?? 0);

    if (pointsBalance < reward.pointsCost) {
      return fail("Poin tidak cukup", 400);
    }

    const redemption = await db.transaction(async (tx) => {
      const [redemption] = await tx
        .insert(rewardRedemptions)
        .values({
          userId: session.user.id,
          rewardId: reward.id,
          pointsUsed: reward.pointsCost,
          status: "pending",
        })
        .returning();

      await tx.insert(loyaltyTransactions).values({
        userId: session.user.id,
        amount: -reward.pointsCost,
        type: "redeem",
        description: `Redeem reward: ${reward.name}`,
        referenceId: redemption.id,
        referenceType: "reward_redemption",
      });

      return redemption;
    });

    dispatchNotification({
      userId: session.user.id,
      type: "referral_reward_earned",
      category: "system",
      priority: "normal",
      title: "Reward Berhasil Ditebus",
      message: `Anda berhasil menebus ${reward.name} menggunakan ${reward.pointsCost} poin.`,
      actionUrl: "/dashboard/loyalty",
      referenceId: redemption.id,
    }).catch(() => {});

    return ok(redemption, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message || "Input tidak valid", 400);
    }
    return handleApiError(error, "POST /api/loyalty/rewards/redeem");
  }
}
