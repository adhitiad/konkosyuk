import type { PropertyPackages, DurationUnit } from "@/types/property";

interface PackageTemplate {
  id: string;
  label: string;
  unit: DurationUnit;
  value: number;
  discountPercent: number;
  ppnPercent: number;
  appFeePercent: number;
  isAvailable: boolean;
}

const KOST_PACKAGES: Omit<PackageTemplate, "basePrice" | "finalPrice">[] = [
  { id: "kost-6h", label: "6 Jam", unit: "hours", value: 6, discountPercent: 0, ppnPercent: 11, appFeePercent: 0.63, isAvailable: true },
  { id: "kost-1d", label: "1 Hari", unit: "days", value: 1, discountPercent: 0, ppnPercent: 11, appFeePercent: 0.63, isAvailable: true },
  { id: "kost-3d", label: "3 Hari", unit: "days", value: 3, discountPercent: 0, ppnPercent: 11, appFeePercent: 0.63, isAvailable: true },
  { id: "kost-7d", label: "7 Hari", unit: "days", value: 7, discountPercent: 0, ppnPercent: 11, appFeePercent: 0.63, isAvailable: true },
  { id: "kost-14d", label: "14 Hari", unit: "days", value: 14, discountPercent: 0, ppnPercent: 11, appFeePercent: 0.63, isAvailable: true },
  { id: "kost-1m", label: "1 Bulan", unit: "months", value: 1, discountPercent: 0, ppnPercent: 11, appFeePercent: 0.63, isAvailable: true },
  { id: "kost-3m", label: "3 Bulan", unit: "months", value: 3, discountPercent: 0, ppnPercent: 11, appFeePercent: 0.63, isAvailable: true },
  { id: "kost-6m", label: "6 Bulan", unit: "months", value: 6, discountPercent: 0, ppnPercent: 11, appFeePercent: 0.63, isAvailable: true },
  { id: "kost-1y", label: "1 Tahun", unit: "years", value: 1, discountPercent: 0, ppnPercent: 11, appFeePercent: 0.63, isAvailable: true },
  { id: "kost-2y", label: "2 Tahun", unit: "years", value: 2, discountPercent: 0, ppnPercent: 11, appFeePercent: 0.63, isAvailable: true },
];

const KONTRAKAN_PACKAGES: Omit<PackageTemplate, "basePrice" | "finalPrice">[] = [
  { id: "kontrakan-1m", label: "1 Bulan", unit: "months", value: 1, discountPercent: 0, ppnPercent: 11, appFeePercent: 0.63, isAvailable: true },
  { id: "kontrakan-3m", label: "3 Bulan", unit: "months", value: 3, discountPercent: 0, ppnPercent: 11, appFeePercent: 0.63, isAvailable: true },
  { id: "kontrakan-6m", label: "6 Bulan", unit: "months", value: 6, discountPercent: 0, ppnPercent: 11, appFeePercent: 0.63, isAvailable: true },
  { id: "kontrakan-1y", label: "1 Tahun", unit: "years", value: 1, discountPercent: 0, ppnPercent: 11, appFeePercent: 0.63, isAvailable: true },
  { id: "kontrakan-2y", label: "2 Tahun", unit: "years", value: 2, discountPercent: 0, ppnPercent: 11, appFeePercent: 0.63, isAvailable: true },
];

function calculateFinalPrice(
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

export function generateDefaultPackages(
  type: string,
  basePrice: number,
  idPrefix = "",
): PropertyPackages {
  const templates =
    type === "kost" ? KOST_PACKAGES : KONTRAKAN_PACKAGES;

  const predefined = templates.map((pkg) => {
    let basePriceCalculated: number;
    switch (pkg.unit) {
      case "hours":
        basePriceCalculated = Math.round(basePrice / 120);
        break;
      case "days":
        basePriceCalculated = Math.round(basePrice / 30);
        break;
      case "months":
        basePriceCalculated = Math.round(basePrice * pkg.value);
        break;
      case "years":
        basePriceCalculated = Math.round(basePrice * 12 * pkg.value);
        break;
      default:
        basePriceCalculated = 0;
    }

    return {
      id: idPrefix ? `${idPrefix}-${pkg.id}` : pkg.id,
      label: pkg.label,
      unit: pkg.unit,
      value: pkg.value,
      basePrice: basePriceCalculated,
      discountPercent: pkg.discountPercent,
      ppnPercent: pkg.ppnPercent,
      appFeePercent: pkg.appFeePercent,
      finalPrice: calculateFinalPrice(
        basePriceCalculated,
        pkg.discountPercent,
        pkg.ppnPercent,
        pkg.appFeePercent,
      ),
      isAvailable: pkg.isAvailable,
    };
  });

  return {
    predefined,
    custom: {
      enabled: false,
      label: "Custom Duration",
      unit: "days",
      pricePerUnit: 0,
      minDuration: 1,
      maxDuration: 365,
    },
  };
}
