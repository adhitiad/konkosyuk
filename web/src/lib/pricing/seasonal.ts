import type { SeasonalPricingRule } from "@/db/schema";

export type RuleType = "percentage" | "fixed" | "multiplier";

export interface AppliedSeasonalRule {
  ruleId: string;
  ruleName: string;
  ruleType: RuleType;
  adjustmentValue: number;
  originalPrice: number;
  adjustedPrice: number;
}

export function findApplicableSeasonalRules(
  rules: SeasonalPricingRule[],
  checkIn: Date,
  checkOut: Date,
  nights: number,
): SeasonalPricingRule[] {
  return rules.filter((rule) => {
    if (!rule.isActive) return false;

    const start = new Date(rule.startDate);
    const end = new Date(rule.endDate);

    const bookingStartsInRule = checkIn >= start && checkIn <= end;
    const bookingEndsInRule = checkOut >= start && checkOut <= end;
    const ruleOverlapsBooking = start <= checkIn && end >= checkOut;

    const overlaps =
      bookingStartsInRule || bookingEndsInRule || ruleOverlapsBooking;
    if (!overlaps) return false;

    if (rule.minNights !== null && nights < rule.minNights) return false;
    if (rule.maxNights !== null && nights > rule.maxNights) return false;

    return true;
  });
}

export function getHighestPriorityRule(
  rules: SeasonalPricingRule[],
): SeasonalPricingRule | null {
  if (rules.length === 0) return null;

  return rules.reduce((highest, current) => {
    const currentPriority = current.priority ?? 0;
    const highestPriority = highest.priority ?? 0;
    if (currentPriority > highestPriority) return current;
    if (
      currentPriority === highestPriority &&
      new Date(current.createdAt ?? 0) > new Date(highest.createdAt ?? 0)
    ) {
      return current;
    }
    return highest;
  });
}

export function applySeasonalAdjustment(
  basePrice: number,
  rule: SeasonalPricingRule,
): number {
  const value = Number(rule.adjustmentValue);

  switch (rule.ruleType) {
    case "percentage":
      return basePrice + (basePrice * value) / 100;
    case "fixed":
      return basePrice + value;
    case "multiplier":
      return basePrice * value;
    default:
      return basePrice;
  }
}

export function calculateSeasonalPrice(
  basePrice: number,
  rules: SeasonalPricingRule[],
  checkIn: Date,
  checkOut: Date,
): AppliedSeasonalRule | null {
  const nights = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
  );
  const applicableRules = findApplicableSeasonalRules(
    rules,
    checkIn,
    checkOut,
    nights,
  );
  const highestRule = getHighestPriorityRule(applicableRules);

  if (!highestRule) return null;

  const adjustedPrice = applySeasonalAdjustment(basePrice, highestRule);

  return {
    ruleId: highestRule.id,
    ruleName: highestRule.name,
    ruleType: highestRule.ruleType,
    adjustmentValue: Number(highestRule.adjustmentValue),
    originalPrice: basePrice,
    adjustedPrice,
  };
}
