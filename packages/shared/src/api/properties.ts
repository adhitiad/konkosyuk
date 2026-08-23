import { z } from "zod";
import type { PropertyPackages, PackageItem } from "../types/property-packages";
import {
  PROPERTY_TYPES,
  UNIT_STATUSES,
  PROPERTY_STATUSES,
  SEASONAL_RULE_TYPES,
} from "../constants/enums";

const packageItemSchema: z.ZodType<PackageItem> = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  unit: z.enum(["hours", "days", "months", "years"]),
  value: z.coerce.number().int().positive(),
  basePrice: z.coerce.number().nonnegative(),
  discountPercent: z.coerce.number().min(0).max(100).default(0),
  ppnPercent: z.coerce.number().min(0).max(100).default(11),
  appFeePercent: z.coerce.number().min(0).max(100).default(0.63),
  finalPrice: z.coerce.number().nonnegative(),
  isAvailable: z.boolean().default(true),
});

const propertyPackagesSchema: z.ZodType<PropertyPackages> = z.object({
  predefined: z.array(packageItemSchema).default([]),
  custom: z
    .object({
      enabled: z.boolean().default(false),
      label: z.string().min(1).default("Custom Duration"),
      unit: z.enum(["hours", "days", "months", "years"]).default("days"),
      pricePerUnit: z.coerce.number().nonnegative().default(0),
      minDuration: z.coerce.number().int().positive().default(1),
      maxDuration: z.coerce.number().int().positive().default(365),
    })
    .default({
      enabled: false,
      label: "Custom Duration",
      unit: "days",
      pricePerUnit: 0,
      minDuration: 1,
      maxDuration: 365,
    }),
});

export const seasonalPricingRuleSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(255),
  ruleType: z.enum(SEASONAL_RULE_TYPES),
  adjustmentValue: z.coerce.number().nonnegative(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  minNights: z.coerce.number().int().positive().optional(),
  maxNights: z.coerce.number().int().positive().optional(),
  priority: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateSeasonalPricingRuleSchema =
  seasonalPricingRuleSchema.partial();

export const seasonalPricingQuerySchema = z.object({
  propertyId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export const createPropertySchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  address: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  type: z.enum(PROPERTY_TYPES),
  basePrice: z.string().optional(),
  packages: propertyPackagesSchema.optional(),
  status: z.enum(PROPERTY_STATUSES).optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  gpsVerified: z.boolean().optional(),
  featuredUntil: z.string().optional(),
  icalExportToken: z.string().optional(),
  icalImportUrl: z.string().optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

export const createUnitSchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  price: z.string().min(1),
  capacity: z.string().optional(),
  size: z.string().optional(),
  status: z.enum(UNIT_STATUSES).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateUnitSchema = createUnitSchema.partial();

export const propertyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  ownerId: z.string().uuid().optional(),
  type: z.enum(PROPERTY_TYPES).optional(),
  city: z.string().optional(),
  search: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().positive().default(5).optional(),
  radius: z.coerce.number().positive().optional(),
  amenities: z.array(z.string()).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  isFeatured: z.coerce.boolean().optional(),
  ids: z.array(z.string().uuid()).optional(),
  area: z.string().optional(),
  campus: z.string().optional(),
  duration: z.string().optional(),
  gender: z.string().optional(),
  swLat: z.coerce.number().optional(),
  swLng: z.coerce.number().optional(),
  neLat: z.coerce.number().optional(),
  neLng: z.coerce.number().optional(),
});

export const unitQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  propertyId: z.string().uuid().optional(),
  status: z.enum(UNIT_STATUSES).optional(),
});

export type PackageItemInput = z.infer<typeof packageItemSchema>;
export type PropertyPackagesInput = z.infer<typeof propertyPackagesSchema>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
export type PropertyQuery = z.infer<typeof propertyQuerySchema>;
export type UnitQuery = z.infer<typeof unitQuerySchema>;
export type SeasonalPricingRuleInput = z.infer<typeof seasonalPricingRuleSchema>;
export type SeasonalPricingQuery = z.infer<typeof seasonalPricingQuerySchema>;
