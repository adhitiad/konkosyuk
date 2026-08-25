export type CommissionCategory = "owner" | "tenant";

export const OWNER_TIER_RATES: Record<number, number> = {
  1: 0.01,
  2: 0.02,
  3: 0.0367,
  4: 0.0482,
};

export const TENANT_TIER_RATES: Record<number, number> = {
  1: 0.009,
  2: 0.0186,
  3: 0.0279,
  4: 0.0396,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const REFERRAL_ELIGIBILITY_DAYS = 5;

export function getCommissionRate(
  category: CommissionCategory,
  tier: number,
): number {
  const rates = category === "owner" ? OWNER_TIER_RATES : TENANT_TIER_RATES;
  return rates[tier] ?? rates[1];
}

export function calculateCommissionAmount(
  baseAmount: number,
  category: CommissionCategory,
  tier: number,
): number {
  const rate = getCommissionRate(category, tier);
  return Math.round(baseAmount * rate);
}

export function calculateEligibleAt(fromDate: Date = new Date()): Date {
  const eligibleAt = new Date(fromDate.getTime() + REFERRAL_ELIGIBILITY_DAYS * MS_PER_DAY);
  return eligibleAt;
}
