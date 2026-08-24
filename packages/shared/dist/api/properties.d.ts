import { z } from "zod";
import type { PropertyPackages, PackageItem } from "../types/property-packages";
declare const packageItemSchema: z.ZodType<PackageItem>;
declare const propertyPackagesSchema: z.ZodType<PropertyPackages>;
export declare const seasonalPricingRuleSchema: z.ZodObject<{
    propertyId: z.ZodString;
    unitId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    name: z.ZodString;
    ruleType: z.ZodEnum<{
        percentage: "percentage";
        fixed: "fixed";
        multiplier: "multiplier";
    }>;
    adjustmentValue: z.ZodCoercedNumber<unknown>;
    startDate: z.ZodString;
    endDate: z.ZodString;
    minNights: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    maxNights: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    priority: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const updateSeasonalPricingRuleSchema: z.ZodObject<{
    propertyId: z.ZodOptional<z.ZodString>;
    unitId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    name: z.ZodOptional<z.ZodString>;
    ruleType: z.ZodOptional<z.ZodEnum<{
        percentage: "percentage";
        fixed: "fixed";
        multiplier: "multiplier";
    }>>;
    adjustmentValue: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    minNights: z.ZodOptional<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    maxNights: z.ZodOptional<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    priority: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    metadata: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strip>;
export declare const seasonalPricingQuerySchema: z.ZodObject<{
    propertyId: z.ZodOptional<z.ZodString>;
    unitId: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const createPropertySchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    province: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    district: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<{
        kost: "kost";
        kontrakan: "kontrakan";
        apartemen: "apartemen";
        rumah: "rumah";
        ruko: "ruko";
    }>;
    basePrice: z.ZodOptional<z.ZodString>;
    packages: z.ZodOptional<z.ZodType<PropertyPackages, unknown, z.core.$ZodTypeInternals<PropertyPackages, unknown>>>;
    status: z.ZodOptional<z.ZodEnum<{
        aktif: "aktif";
        nonaktif: "nonaktif";
    }>>;
    amenities: z.ZodOptional<z.ZodArray<z.ZodString>>;
    images: z.ZodOptional<z.ZodArray<z.ZodString>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    latitude: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    longitude: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    isFeatured: z.ZodOptional<z.ZodBoolean>;
    gpsVerified: z.ZodOptional<z.ZodBoolean>;
    featuredUntil: z.ZodOptional<z.ZodString>;
    icalExportToken: z.ZodOptional<z.ZodString>;
    icalImportUrl: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const updatePropertySchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    province: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    city: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    district: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    type: z.ZodOptional<z.ZodEnum<{
        kost: "kost";
        kontrakan: "kontrakan";
        apartemen: "apartemen";
        rumah: "rumah";
        ruko: "ruko";
    }>>;
    basePrice: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    packages: z.ZodOptional<z.ZodOptional<z.ZodType<PropertyPackages, unknown, z.core.$ZodTypeInternals<PropertyPackages, unknown>>>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        aktif: "aktif";
        nonaktif: "nonaktif";
    }>>>;
    amenities: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    metadata: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    latitude: z.ZodOptional<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    longitude: z.ZodOptional<z.ZodOptional<z.ZodCoercedNumber<unknown>>>;
    isActive: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    isFeatured: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    gpsVerified: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    featuredUntil: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    icalExportToken: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    icalImportUrl: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const createUnitSchema: z.ZodObject<{
    propertyId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    price: z.ZodString;
    capacity: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        available: "available";
        booked: "booked";
        maintenance: "maintenance";
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const updateUnitSchema: z.ZodObject<{
    propertyId: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    price: z.ZodOptional<z.ZodString>;
    capacity: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    size: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodEnum<{
        available: "available";
        booked: "booked";
        maintenance: "maintenance";
    }>>>;
    metadata: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, z.core.$strip>;
export declare const propertyQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    ownerId: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<{
        kost: "kost";
        kontrakan: "kontrakan";
        apartemen: "apartemen";
        rumah: "rumah";
        ruko: "ruko";
    }>>;
    city: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    lat: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    lng: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    radiusKm: z.ZodOptional<z.ZodDefault<z.ZodCoercedNumber<unknown>>>;
    radius: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    amenities: z.ZodOptional<z.ZodArray<z.ZodString>>;
    minPrice: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    maxPrice: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    isFeatured: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
    ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
    area: z.ZodOptional<z.ZodString>;
    campus: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodString>;
    gender: z.ZodOptional<z.ZodString>;
    swLat: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    swLng: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    neLat: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    neLng: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const unitQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    propertyId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        available: "available";
        booked: "booked";
        maintenance: "maintenance";
    }>>;
}, z.core.$strip>;
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
export {};
//# sourceMappingURL=properties.d.ts.map