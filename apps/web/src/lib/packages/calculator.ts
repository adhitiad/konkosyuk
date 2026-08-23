import type {
  PackageItem,
  PropertyPackages,
  DurationUnit,
} from "@/lib/types/property-packages";
import {
  calculateSeasonalPrice,
  type AppliedSeasonalRule,
} from "@/lib/pricing/seasonal";
import type { SeasonalPricingRule } from "@/db/schema";

export function calculatePackageFinalPrice(
  basePrice: number,
  discountPercent: number,
  ppnPercent: number,
  appFeePercent: number,
): number {
  const discounted = basePrice - (basePrice * discountPercent) / 100;
  const final =
    discounted +
    (discounted * ppnPercent) / 100 +
    (discounted * appFeePercent) / 100;
  return Math.round(final);
}

export function calculatePackageEndDate(
  startDate: string | Date,
  unit: DurationUnit,
  value: number,
): Date {
  const date = new Date(startDate);
  switch (unit) {
    case "hours":
      date.setHours(date.getHours() + value);
      break;
    case "days":
      date.setDate(date.getDate() + value);
      break;
    case "months":
      date.setMonth(date.getMonth() + value);
      break;
    case "years":
      date.setFullYear(date.getFullYear() + value);
      break;
  }
  return date;
}

export function getPackageById(
  packages: PropertyPackages,
  packageId: string,
): PackageItem | null {
  const found = packages.predefined.find((p) => p.id === packageId);
  if (found) return found;
  if (packageId === "custom" && packages.custom.enabled) {
    return {
      id: "custom",
      label: packages.custom.label,
      unit: packages.custom.unit,
      value: 0,
      basePrice: packages.custom.pricePerUnit,
      discountPercent: 0,
      ppnPercent: 11,
      appFeePercent: 0.63,
      finalPrice: packages.custom.pricePerUnit,
      isAvailable: true,
    };
  }
  return null;
}

export function validateBookingPackage(
  packages: PropertyPackages,
  packageId: string,
  customDuration?: number,
): { valid: boolean; error?: string } {
  const pkg = getPackageById(packages, packageId);
  if (!pkg) {
    return { valid: false, error: "Paket tidak ditemukan" };
  }
  if (!pkg.isAvailable) {
    return { valid: false, error: "Paket tidak tersedia" };
  }
  if (packageId === "custom" && packages.custom.enabled) {
    if (
      !customDuration ||
      customDuration < packages.custom.minDuration ||
      customDuration > packages.custom.maxDuration
    ) {
      return {
        valid: false,
        error: `Durasi custom harus antara ${packages.custom.minDuration} - ${packages.custom.maxDuration} ${packages.custom.unit}`,
      };
    }
  }
  return { valid: true };
}

export function calculateCustomPrice(
  packages: PropertyPackages,
  customDuration: number,
  seasonalRules?: SeasonalPricingRule[],
  checkIn?: Date,
  checkOut?: Date,
): { basePrice: number; finalPrice: number; seasonal?: AppliedSeasonalRule } {
  const basePrice = packages.custom.pricePerUnit * customDuration;
  let finalPrice = calculatePackageFinalPrice(basePrice, 0, 11, 0.63);
  let seasonal: AppliedSeasonalRule | undefined;

  if (seasonalRules?.length && checkIn && checkOut) {
    const result = calculateSeasonalPrice(
      basePrice,
      seasonalRules,
      checkIn,
      checkOut,
    );
    if (result) {
      seasonal = result;
      finalPrice = calculatePackageFinalPrice(
        result.adjustedPrice,
        0,
        11,
        0.63,
      );
    }
  }

  return { basePrice, finalPrice, seasonal };
}

export function calculatePackagePriceWithSeasonal(
  basePrice: number,
  discountPercent: number,
  ppnPercent: number,
  appFeePercent: number,
  seasonalRules?: SeasonalPricingRule[],
  checkIn?: Date,
  checkOut?: Date,
): { basePrice: number; finalPrice: number; seasonal?: AppliedSeasonalRule } {
  let seasonal: AppliedSeasonalRule | undefined;

  if (seasonalRules?.length && checkIn && checkOut) {
    const result = calculateSeasonalPrice(
      basePrice,
      seasonalRules,
      checkIn,
      checkOut,
    );
    if (result) {
      seasonal = result;
      const adjustedBase = result.adjustedPrice;
      const discounted = adjustedBase - (adjustedBase * discountPercent) / 100;
      const final =
        discounted +
        (discounted * ppnPercent) / 100 +
        (discounted * appFeePercent) / 100;
      return {
        basePrice: adjustedBase,
        finalPrice: Math.round(final),
        seasonal,
      };
    }
  }

  const finalPrice = calculatePackageFinalPrice(
    basePrice,
    discountPercent,
    ppnPercent,
    appFeePercent,
  );
  return { basePrice, finalPrice, seasonal };
}
