import { describe, it, expect } from "vitest";
import {
  getCommissionRate,
  calculateCommissionAmount,
  calculateEligibleAt,
} from "@/lib/referrals/commission";

describe("getCommissionRate", () => {
  it("returns correct owner tier rates", () => {
    expect(getCommissionRate("owner", 1)).toBe(0.01);
    expect(getCommissionRate("owner", 2)).toBe(0.02);
    expect(getCommissionRate("owner", 3)).toBe(0.0367);
    expect(getCommissionRate("owner", 4)).toBe(0.0482);
  });

  it("returns correct tenant tier rates", () => {
    expect(getCommissionRate("tenant", 1)).toBe(0.009);
    expect(getCommissionRate("tenant", 2)).toBe(0.0186);
    expect(getCommissionRate("tenant", 3)).toBe(0.0279);
    expect(getCommissionRate("tenant", 4)).toBe(0.0396);
  });

  it("falls back to tier 1 for unknown tier", () => {
    expect(getCommissionRate("owner", 99)).toBe(0.01);
    expect(getCommissionRate("tenant", 99)).toBe(0.009);
  });
});

describe("calculateCommissionAmount", () => {
  it("calculates owner commission correctly", () => {
    expect(calculateCommissionAmount(1_000_000, "owner", 1)).toBe(10000);
    expect(calculateCommissionAmount(1_000_000, "owner", 2)).toBe(20000);
    expect(calculateCommissionAmount(1_000_000, "owner", 3)).toBe(36700);
    expect(calculateCommissionAmount(1_000_000, "owner", 4)).toBe(48200);
  });

  it("calculates tenant commission correctly", () => {
    expect(calculateCommissionAmount(1_000_000, "tenant", 1)).toBe(9000);
    expect(calculateCommissionAmount(1_000_000, "tenant", 2)).toBe(18600);
    expect(calculateCommissionAmount(1_000_000, "tenant", 3)).toBe(27900);
    expect(calculateCommissionAmount(1_000_000, "tenant", 4)).toBe(39600);
  });

  it("rounds to nearest integer", () => {
    expect(calculateCommissionAmount(500_000, "owner", 3)).toBe(18350);
    expect(calculateCommissionAmount(500_000, "tenant", 2)).toBe(9300);
  });
});

describe("calculateEligibleAt", () => {
  it("returns date 5 days from now", () => {
    const now = new Date();
    const eligibleAt = calculateEligibleAt(now);
    const diffDays = (eligibleAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeCloseTo(5, 0);
  });

  it("uses custom fromDate", () => {
    const fromDate = new Date("2026-01-01T00:00:00Z");
    const eligibleAt = calculateEligibleAt(fromDate);
    expect(eligibleAt.toISOString().slice(0, 10)).toBe("2026-01-06");
  });
});
