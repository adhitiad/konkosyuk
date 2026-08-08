export type DurationUnit = 'hours' | 'days' | 'months' | 'years';

export interface PackageItem {
  id: string;
  label: string;
  unit: DurationUnit;
  value: number;
  basePrice: number;
  discountPercent: number;
  ppnPercent: number;
  appFeePercent: number;
  finalPrice: number;
  isAvailable: boolean;
}

export interface PropertyPackages {
  predefined: PackageItem[];
  custom: {
    enabled: boolean;
    label: string;
    unit: DurationUnit;
    pricePerUnit: number;
    minDuration: number;
    maxDuration: number;
  };
}