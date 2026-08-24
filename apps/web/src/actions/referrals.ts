"use server";

import { eq, and } from "drizzle-orm";
import { referrals, users } from "@/db/schema";
import { db } from "@/db";
import { logError } from "@/lib/logger";

export interface LinkReferralResult {
  success: boolean;
  error?: string;
}

export async function linkReferralCode(
  userId: string,
  refCode: string,
): Promise<LinkReferralResult> {
  try {
    if (!refCode || !userId) {
      return { success: false, error: "Parameter tidak valid" };
    }

    const [referral] = await db
      .select()
      .from(referrals)
      .where(and(eq(referrals.code, refCode), eq(referrals.status, "pending")))
      .limit(1);

    if (!referral) {
      return { success: false, error: "Kode referral tidak valid atau sudah digunakan" };
    }

    await db
      .update(referrals)
      .set({
        refereeId: userId,
        status: "verifying",
      })
      .where(eq(referrals.id, referral.id));

    await db
      .update(users)
      .set({
        referredBy: referral.referrerId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return { success: true };
  } catch (error) {
    logError(error, "linkReferralCode error");
    return { success: false, error: "Gagal menghubungkan kode referral" };
  }
}
