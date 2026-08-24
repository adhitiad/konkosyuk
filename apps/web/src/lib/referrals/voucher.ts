import { eq } from "drizzle-orm";

import { referrals } from "@/db/schema";
import { db } from "@/db";

const MAX_VOUCHER_DISCOUNT_PERCENT = 0.5;

export interface VoucherValidationResult {
  valid: boolean;
  error?: string;
  finalAmount?: number;
  referralId?: string;
}

export async function validateAndApplyVoucher(
  voucherCode: string,
  ownerId: string,
  originalAmount: number,
): Promise<VoucherValidationResult> {
  if (originalAmount <= 0) {
    return { valid: false, error: "Jumlah tidak valid" };
  }

  const [referral] = await db
    .select()
    .from(referrals)
    .where(eq(referrals.voucherCode, voucherCode))
    .limit(1);

  if (!referral) {
    return { valid: false, error: "Kode voucher tidak ditemukan" };
  }

  if (referral.referrerId !== ownerId) {
    return { valid: false, error: "Voucher ini milik pengguna lain" };
  }

  if (referral.status !== "completed" || !referral.voucherCode) {
    return { valid: false, error: "Voucher belum dapat digunakan" };
  }

  if (referral.voucherRedeemedAt) {
    return { valid: false, error: "Voucher sudah pernah digunakan" };
  }

  const commissionAmount = Number(referral.commissionAmount || 0);
  const maxDiscount = Math.round(originalAmount * MAX_VOUCHER_DISCOUNT_PERCENT);
  const discount = Math.min(commissionAmount, maxDiscount);
  const finalAmount = originalAmount - discount;

  return {
    valid: true,
    finalAmount,
    referralId: referral.id,
  };
}

export async function markVoucherRedeemed(referralId: string): Promise<void> {
  await db
    .update(referrals)
    .set({
      voucherRedeemedAt: new Date(),
    })
    .where(eq(referrals.id, referralId));
}
