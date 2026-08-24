import { eq, and, lt } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { referrals } from "@/db/schema";
import { db as defaultDb } from "@/db";
import {
  calculateCommissionAmount,
  calculateEligibleAt,
  type CommissionCategory,
} from "./commission";
import { dispatchReferralStatusUpdate } from "@/lib/notification-service";
import { logInfo, logError } from "@/lib/logger";

type DbExecutor = NodePgDatabase<typeof import("@/db/schema")>;

export interface StartReferralVerificationInput {
  refereeUserId: string;
  paymentId: string;
  paymentAmount: number;
}

export async function startReferralVerification(
  executor: DbExecutor,
  input: StartReferralVerificationInput,
): Promise<void> {
  const { refereeUserId, paymentId, paymentAmount } = input;

  const [referral] = await executor
    .select()
    .from(referrals)
    .where(
      and(
        eq(referrals.refereeId, refereeUserId),
        eq(referrals.status, "verifying"),
      ),
    )
    .limit(1);

  if (!referral) {
    return;
  }

  const category: CommissionCategory =
    (referral.category as CommissionCategory) || "tenant";
  const tier = referral.tier || 1;
  const baseAmount = paymentAmount;
  const commissionAmount = calculateCommissionAmount(
    baseAmount,
    category,
    tier,
  );
  const commissionRate = calculateCommissionAmount(1, category, tier) / 1;
  const eligibleAt = calculateEligibleAt();

  await executor
    .update(referrals)
    .set({
      baseAmount: baseAmount.toFixed(2),
      commissionRate: commissionRate.toFixed(4),
      commissionAmount: commissionAmount.toFixed(2),
      refereeTransactionId: paymentId,
      eligibleAt,
    })
    .where(eq(referrals.id, referral.id));

  dispatchReferralStatusUpdate(referral.referrerId, referral.code, "verifying", {
    eligibleAt: eligibleAt.toISOString(),
  }).catch(() => {});
}

export async function handleReferralFailureOnRefund(
  executor: DbExecutor,
  paymentId: string,
): Promise<void> {
  const [referral] = await executor
    .select()
    .from(referrals)
    .where(eq(referrals.refereeTransactionId, paymentId))
    .limit(1);

  if (!referral) {
    return;
  }

  if (referral.status === "completed" || referral.status === "cancelled") {
    return;
  }

  await executor
    .update(referrals)
    .set({
      status: "failed",
      commissionAmount: "0",
      commissionRate: "0",
      baseAmount: "0",
      eligibleAt: null,
    })
    .where(eq(referrals.id, referral.id));

  dispatchReferralStatusUpdate(referral.referrerId, referral.code, "failed", {
    reason: "Payment refunded",
  }).catch(() => {});
}

export async function sweepEligibleReferrals(): Promise<number> {
  const now = new Date();

  logInfo("Sweep referral eligibility dimulai", { timestamp: now.toISOString() });

  try {
    const candidates = await defaultDb
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.status, "verifying"),
          lt(referrals.eligibleAt, now),
        ),
      )
      .limit(100);

    let processedCount = 0;

    for (const referral of candidates) {
      await defaultDb
        .update(referrals)
        .set({
          status: "eligible",
        })
        .where(eq(referrals.id, referral.id));

      dispatchReferralStatusUpdate(
        referral.referrerId,
        referral.code,
        "eligible",
        {},
      ).catch(() => {});

      processedCount++;
    }

    logInfo("Sweep referral eligibility selesai", { processedCount });
    return processedCount;
  } catch (error) {
    logError(error, "Sweep referral eligibility gagal");
    throw error;
  }
}
