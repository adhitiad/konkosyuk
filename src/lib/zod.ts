import { z } from "zod";
import type {
  PropertyPackages,
  PackageItem,
  DurationUnit,
} from "@/lib/types/property-packages";
import { BANKS, E_WALLETS } from "@/lib/constants/indonesian-payments";

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

export const propertyStatus = ["aktif", "nonaktif"] as const;

export const createPropertySchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  address: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  type: z.enum(["kost", "kontrakan"]),
  basePrice: z.string().optional(),
  packages: propertyPackagesSchema.optional(),
  status: z.enum(propertyStatus).optional(),
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
  status: z.enum(["available", "booked", "maintenance"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateUnitSchema = createUnitSchema.partial();

export const propertyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  ownerId: z.string().uuid().optional(),
  type: z.enum(["kost", "kontrakan"]).optional(),
  city: z.string().optional(),
  search: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().positive().default(5).optional(),
  radius: z.coerce.number().positive().optional(),
  amenities: z.array(z.string()).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
});

export const unitQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  propertyId: z.string().uuid().optional(),
  status: z.enum(["available", "booked", "maintenance"]).optional(),
});

export const createBookingSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid(),
  packageId: z.string().min(1),
  customDuration: z.coerce.number().int().positive().optional(),
  bookingType: z.enum(["instant", "request"]),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const bookingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  status: z.string().optional(),
});

export const checkoutBookingSchema = z.object({
  paymentProvider: z.enum(["doku", "ipaymu", "nicepay", "mock"]),
});

export const checkoutFeaturedSchema = z.object({
  paymentProvider: z.enum(["doku", "ipaymu", "nicepay", "mock"]),
});

export const reviewBookingSchema = z.object({
  status: z.enum(["confirmed", "rejected"]),
  note: z.string().optional(),
});

export const ipaymuWebhookSchema = z.object({
  transaction_id: z.string().optional(),
  reference_id: z.string().optional(),
  status: z.string().optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  payment_method: z.string().optional(),
  payment_time: z.string().optional(),
});

export const addBankAccountSchema = z.object({
  account_type: z.enum(["bank", "ewallet"]),
  provider_name: z.string().min(1),
  account_number: z
    .string()
    .min(5)
    .max(30)
    .regex(/^\d+$/, "Nomor rekening hanya boleh angka"),
  account_name: z.string().min(3).max(100),
});

export const createWithdrawalSchema = z.object({
  bank_account_id: z.string().uuid(),
  amount: z.coerce.number().positive("Jumlah penarikan harus lebih dari 0"),
});

export const updateUserProfileSchema = z.object({
  phone: z
    .string()
    .min(10, "Nomor telepon minimal 10 digit")
    .regex(/^[0-9+]+$/, "Nomor telepon hanya boleh angka dan tanda +"),
  whatsapp: z.string().min(10, "WhatsApp minimal 10 digit"),
  telegram: z.string().min(5, "Telegram minimal 5 karakter"),
  email: z.string().email("Format email tidak valid"),
});

export type AddBankAccountInput = z.infer<typeof addBankAccountSchema>;
export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type PropertyStatus = (typeof propertyStatus)[number];
export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
export type PropertyQuery = z.infer<typeof propertyQuerySchema>;
export type UnitQuery = z.infer<typeof unitQuerySchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CheckoutBookingInput = z.infer<typeof checkoutBookingSchema>;
export type ReviewBookingInput = z.infer<typeof reviewBookingSchema>;
export type IpaymuWebhookInput = z.infer<typeof ipaymuWebhookSchema>;
export type PackageItemInput = z.infer<typeof packageItemSchema>;
export type PropertyPackagesInput = z.infer<typeof propertyPackagesSchema>;
