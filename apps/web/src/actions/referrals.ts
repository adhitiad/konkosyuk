"use server";

import { eq, and } from "drizzle-orm";
import { referrals, users } from "@/db/schema";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { logError } from "@/lib/logger";

export interface LinkReferralResult {
  success: boolean;
  error?: string;
}

export async function linkReferralCode(
  refCode: string,
): Promise<LinkReferralResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return { success: false, error: "Anda harus masuk terlebih dahulu" };
    }

    const userId = session.user.id;
    if (!refCode || !userId) {
      return { success: false, error: "Parameter tidak valid" };
    }

    const result = await db.transaction(async (tx) => {
      const [referral] = await tx
        .select()
        .from(referrals)
        .where(
          and(eq(referrals.code, refCode), eq(referrals.status, "pending")),
        )
        .for("update")
        .limit(1);

      if (!referral) {
        return {
          success: false,
          error: "Kode referral tidak valid atau sudah digunakan",
        } as const;
      }

      await tx
        .update(referrals)
        .set({
          refereeId: userId,
          status: "verifying",
        })
        .where(eq(referrals.id, referral.id));

      await tx
        .update(users)
        .set({
          referredBy: referral.referrerId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return { success: true } as const;
    });

    return result;
  } catch (error) {
    logError(error, "linkReferralCode error");
    return { success: false, error: "Gagal menghubungkan kode referral" };
  }
}
