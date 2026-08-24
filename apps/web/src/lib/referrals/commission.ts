export type CommissionCategory = "owner" | "tenant";

const OWNER_TIER_RATES: Record<number, number> = {
  1: 0.01,
  2: 0.0125,
  3: 0.015,
  4: 0.02,
};

const TENANT_TIER_RATES: Record<number, number> = {
  1: 0.015,
  2: 0.0186,
  3: 0.022,
  4: 0.025,
};

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
  const eligibleAt = new Date(fromDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  return eligibleAt;
}
