import { describe, it, expect } from "vitest";
import {
  calculatePackageFinalPrice,
  calculatePackageEndDate,
  getPackageById,
  validateBookingPackage,
  calculateCustomPrice,
} from "@/lib/packages/calculator";
import type { PropertyPackages } from "@/lib/types/property-packages";

const mockPackages: PropertyPackages = {
  predefined: [
    {
      id: "pkg-1",
      label: "1 Bulan",
      unit: "months",
      value: 1,
      basePrice: 1500000,
      discountPercent: 0,
      ppnPercent: 11,
      appFeePercent: 0.63,
      finalPrice: 0,
      isAvailable: true,
    },
    {
      id: "pkg-2",
      label: "3 Bulan",
      unit: "months",
      value: 3,
      basePrice: 4000000,
      discountPercent: 10,
      ppnPercent: 11,
      appFeePercent: 0.63,
      finalPrice: 0,
      isAvailable: true,
    },
  ],
  custom: {
    enabled: true,
    label: "Custom Duration",
    unit: "days",
    pricePerUnit: 50000,
    minDuration: 1,
    maxDuration: 365,
  },
};

describe("calculatePackageFinalPrice", () => {
  it("calculates final price with PPN and app fee", () => {
    const result = calculatePackageFinalPrice(1500000, 0, 11, 0.63);
    expect(result).toBeCloseTo(1674450, 0);
  });

  it("applies discount correctly", () => {
    const result = calculatePackageFinalPrice(1000000, 10, 11, 0.63);
    expect(result).toBeCloseTo(1004670, 0);
  });

  it("handles zero values", () => {
    const result = calculatePackageFinalPrice(0, 0, 0, 0);
    expect(result).toBe(0);
  });
});

describe("calculatePackageEndDate", () => {
  it("adds months correctly", () => {
    const result = calculatePackageEndDate("2026-09-01", "months", 3);
    expect(result.toISOString().split("T")[0]).toBe("2026-12-01");
  });

  it("adds days correctly", () => {
    const result = calculatePackageEndDate("2026-09-01", "days", 7);
    expect(result.toISOString().split("T")[0]).toBe("2026-09-08");
  });

  it("adds hours correctly", () => {
    const result = calculatePackageEndDate("2026-09-01T10:00:00", "hours", 5);
    const hours = result.getUTCHours();
    expect(hours).toBe(8);
  });

  it("adds years correctly", () => {
    const result = calculatePackageEndDate("2026-09-01", "years", 1);
    expect(result.toISOString().split("T")[0]).toBe("2027-09-01");
  });
});

describe("getPackageById", () => {
  it("returns predefined package when found", () => {
    const result = getPackageById(mockPackages, "pkg-1");
    expect(result).not.toBeNull();
    expect(result?.label).toBe("1 Bulan");
  });

  it("returns custom package when enabled and id is custom", () => {
    const result = getPackageById(mockPackages, "custom");
    expect(result).not.toBeNull();
    expect(result?.label).toBe("Custom Duration");
    expect(result?.basePrice).toBe(50000);
  });

  it("returns null for unknown package id", () => {
    const result = getPackageById(mockPackages, "unknown");
    expect(result).toBeNull();
  });

  it("returns null for custom when disabled", () => {
    const packages: PropertyPackages = {
      predefined: [],
      custom: {
        enabled: false,
        label: "Custom",
        unit: "days",
        pricePerUnit: 0,
        minDuration: 1,
        maxDuration: 365,
      },
    };
    const result = getPackageById(packages, "custom");
    expect(result).toBeNull();
  });
});

describe("validateBookingPackage", () => {
  it("validates existing available package", () => {
    const result = validateBookingPackage(mockPackages, "pkg-1");
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("rejects unknown package", () => {
    const result = validateBookingPackage(mockPackages, "unknown");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Paket tidak ditemukan");
  });

  it("rejects custom package with invalid duration", () => {
    const result = validateBookingPackage(mockPackages, "custom", 0);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Durasi custom harus antara");
  });

  it("validates custom package with valid duration", () => {
    const result = validateBookingPackage(mockPackages, "custom", 7);
    expect(result.valid).toBe(true);
  });
});

describe("calculateCustomPrice", () => {
  it("calculates base and final price for custom duration", () => {
    const result = calculateCustomPrice(mockPackages, 7);
    expect(result.basePrice).toBe(350000);
    expect(result.finalPrice).toBeCloseTo(390705, 0);
  });
});
