/**
 * Tipe-tipe properti, unit, fasilitas, dan paket harga.
 */

export type DurationUnit = "hours" | "days" | "months" | "years";

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

export type PropertyType = "kost" | "kontrakan" | "apartemen" | "rumah" | "ruko";

export interface Property {
  id: string;
  name: string;
  description: string | null;
  address: string;
  type: PropertyType;
  basePrice: string | null;
  amenities: string[];
  images: string[] | null;
  metadata: Record<string, unknown>;
  hasSeasonalPricing?: boolean;
  seasonalPricingCount?: number;
}

export interface Unit {
  id: string;
  name: string;
  price: number | string;
  roomSize: string | null;
  electricityIncluded: boolean;
  furnitureIncluded: boolean;
  facilities?: Array<{ name: string; icon: string }>;
  status?: "available" | "booked" | "maintenance";
  description?: string | null;
  images?: string[] | null;
}

export interface PricingTier {
  id: string;
  unitId: string;
  maxOccupants: number;
  price: number | string;
  createdAt: string;
}

export interface RoomFacility {
  name: string;
  icon: string;
  category: string;
}


