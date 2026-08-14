import { describe, it, expect } from "vitest";
import { formatCurrency } from "@/lib/utils/currency";

describe("formatCurrency", () => {
  it("formats number to IDR currency format", () => {
    const result = formatCurrency(1000000);
    expect(result).toContain("1.000.000");
    expect(result).toContain("Rp");
  });

  it("handles zero correctly", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
    expect(result).toContain("Rp");
  });

  it("handles decimal values by rounding", () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain("1.235");
  });

  it("handles negative values", () => {
    const result = formatCurrency(-50000);
    expect(result).toContain("-Rp");
    expect(result).toContain("50.000");
  });

  it("handles large numbers correctly", () => {
    const result = formatCurrency(1000000000);
    expect(result).toContain("1.000.000.000");
  });
});
