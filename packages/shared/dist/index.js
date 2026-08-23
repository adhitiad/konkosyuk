// src/api/bookings.ts
import { z } from "zod";

// src/constants/enums.ts
var USER_ROLES = ["cust", "owner", "admin", "staff"];
var PROPERTY_TYPES = ["kost", "kontrakan", "apartemen", "rumah", "ruko"];
var UNIT_STATUSES = ["available", "booked", "maintenance"];
var BOOKING_TYPES = ["instant", "request"];
var BOOKING_REQUEST_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "paid",
  "cancelled"
];
var BOOKING_STATUSES = [
  "pending_dp",
  "awaiting_owner_approval",
  "awaiting_full_payment",
  "confirmed",
  "completed",
  "rejected",
  "cancelled"
];
var REVIEW_TYPES = ["tenant", "property"];
var NOTIFICATION_TYPES = [
  "report",
  "booking",
  "payment",
  "system",
  "booking_approved",
  "booking_rejected",
  "payment_success",
  "inspection",
  "maintenance",
  "chat",
  "review",
  "review_reply",
  "booking_reminder_24h",
  "booking_reminder_1h",
  "pricing_alert",
  "referral_reward_earned",
  "referral_verifying",
  "referral_eligible",
  "referral_failed",
  "referral_completed",
  "referral_voucher_converted",
  "referral_offset_applied",
  "group_booking_invite",
  "group_booking_updated"
];
var NOTIFICATION_CATEGORIES = [
  "booking",
  "payment",
  "maintenance",
  "inspection",
  "chat",
  "review",
  "system"
];
var NOTIFICATION_PRIORITIES = ["low", "normal", "high", "urgent"];
var MAINTENANCE_PRIORITIES = ["low", "medium", "high", "urgent"];
var MAINTENANCE_STATUSES = ["reported", "in_progress", "resolved", "cancelled"];
var MAINTENANCE_REPORT_CATEGORIES = [
  "air",
  "listrik",
  "kunci_pintu",
  "ac",
  "furniture",
  "lainnya"
];
var MAINTENANCE_REPORT_STATUSES = [
  "pending",
  "in_progress",
  "resolved",
  "rejected"
];
var KYC_VERIFICATION_STATUSES = ["pending", "approved", "rejected", "expired"];
var KYC_DOCUMENT_TYPES = ["ktp", "passport", "driving_license"];
var PAYMENT_PROVIDERS = ["doku", "ipaymu", "nicepay", "mock"];
var PAYMENT_PURPOSES = ["dp", "full_payment", "featured_listing"];
var PAYMENT_STATUSES = ["pending", "success", "failed", "expired", "refunded"];
var PAYMENT_TRANSACTION_STATUSES = ["pending", "success", "failed", "expired", "refunded"];
var KYC_STATUSES = ["none", "pending", "verified", "rejected"];
var BANK_ACCOUNT_TYPES = ["bank", "ewallet"];
var WITHDRAWAL_STATUSES = ["pending", "processing", "success", "rejected"];
var GATEWAY_ENVIRONMENTS = ["sandbox", "production"];
var ACCOUNT_TYPES = ["asset", "liability", "equity", "revenue", "expense"];
var LEDGER_REFERENCE_TYPES = ["payment", "withdrawal", "fee", "refund", "adjustment"];
var LOYALTY_TIERS = ["bronze", "silver", "gold", "platinum"];
var SEASONAL_RULE_TYPES = ["percentage", "fixed", "multiplier"];
var INSPECTION_STATUSES = ["pending", "move_in_done", "move_out_done", "completed"];
var INSPECTION_INSTANCE_STATUSES = ["pending", "in_progress", "completed", "disputed"];
var PROPERTY_STATUSES = ["aktif", "nonaktif"];
var REFERRAL_STATUSES = [
  "pending",
  "verifying",
  "eligible",
  "failed",
  "completed",
  "cancelled"
];
var REFERRAL_CATEGORIES = ["owner", "tenant"];
var LOYALTY_TRANSACTION_TYPES = ["earn", "redeem", "expire", "bonus"];
var GROUP_BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "completed"];

// src/api/bookings.ts
var createBookingSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid(),
  packageId: z.string().min(1),
  customDuration: z.coerce.number().int().positive().optional(),
  bookingType: z.enum(BOOKING_TYPES),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  paymentType: z.enum(PAYMENT_PURPOSES).default("dp"),
  metadata: z.record(z.string(), z.unknown()).optional()
});
var bookingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  status: z.string().optional()
});
var checkoutBookingSchema = z.object({
  paymentProvider: z.enum(PAYMENT_PROVIDERS)
});
var checkoutFeaturedSchema = z.object({
  paymentProvider: z.enum(PAYMENT_PROVIDERS)
});
var reviewBookingSchema = z.object({
  status: z.enum(["confirmed", "rejected"]),
  note: z.string().optional()
});
var ipaymuWebhookSchema = z.object({
  transaction_id: z.string().optional(),
  reference_id: z.string().optional(),
  status: z.string().optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  payment_method: z.string().optional(),
  payment_time: z.string().optional()
});
// src/api/properties.ts
import { z as z2 } from "zod";
var packageItemSchema = z2.object({
  id: z2.string().min(1),
  label: z2.string().min(1),
  unit: z2.enum(["hours", "days", "months", "years"]),
  value: z2.coerce.number().int().positive(),
  basePrice: z2.coerce.number().nonnegative(),
  discountPercent: z2.coerce.number().min(0).max(100).default(0),
  ppnPercent: z2.coerce.number().min(0).max(100).default(11),
  appFeePercent: z2.coerce.number().min(0).max(100).default(0.63),
  finalPrice: z2.coerce.number().nonnegative(),
  isAvailable: z2.boolean().default(true)
});
var propertyPackagesSchema = z2.object({
  predefined: z2.array(packageItemSchema).default([]),
  custom: z2.object({
    enabled: z2.boolean().default(false),
    label: z2.string().min(1).default("Custom Duration"),
    unit: z2.enum(["hours", "days", "months", "years"]).default("days"),
    pricePerUnit: z2.coerce.number().nonnegative().default(0),
    minDuration: z2.coerce.number().int().positive().default(1),
    maxDuration: z2.coerce.number().int().positive().default(365)
  }).default({
    enabled: false,
    label: "Custom Duration",
    unit: "days",
    pricePerUnit: 0,
    minDuration: 1,
    maxDuration: 365
  })
});
var seasonalPricingRuleSchema = z2.object({
  propertyId: z2.string().uuid(),
  unitId: z2.string().uuid().optional().nullable(),
  name: z2.string().min(1).max(255),
  ruleType: z2.enum(SEASONAL_RULE_TYPES),
  adjustmentValue: z2.coerce.number().nonnegative(),
  startDate: z2.string().datetime(),
  endDate: z2.string().datetime(),
  minNights: z2.coerce.number().int().positive().optional(),
  maxNights: z2.coerce.number().int().positive().optional(),
  priority: z2.coerce.number().int().min(0).default(0),
  isActive: z2.boolean().default(true),
  metadata: z2.record(z2.string(), z2.unknown()).optional()
});
var updateSeasonalPricingRuleSchema = seasonalPricingRuleSchema.partial();
var seasonalPricingQuerySchema = z2.object({
  propertyId: z2.string().uuid().optional(),
  unitId: z2.string().uuid().optional(),
  isActive: z2.coerce.boolean().optional(),
  page: z2.coerce.number().int().positive().default(1),
  limit: z2.coerce.number().int().positive().max(100).default(50)
});
var createPropertySchema = z2.object({
  title: z2.string().min(1).max(255),
  description: z2.string().optional(),
  address: z2.string().optional(),
  province: z2.string().optional(),
  city: z2.string().optional(),
  district: z2.string().optional(),
  type: z2.enum(PROPERTY_TYPES),
  basePrice: z2.string().optional(),
  packages: propertyPackagesSchema.optional(),
  status: z2.enum(PROPERTY_STATUSES).optional(),
  amenities: z2.array(z2.string()).optional(),
  images: z2.array(z2.string().url()).optional(),
  metadata: z2.record(z2.string(), z2.unknown()).optional(),
  latitude: z2.coerce.number().optional(),
  longitude: z2.coerce.number().optional(),
  isActive: z2.boolean().optional(),
  isFeatured: z2.boolean().optional(),
  gpsVerified: z2.boolean().optional(),
  featuredUntil: z2.string().optional(),
  icalExportToken: z2.string().optional(),
  icalImportUrl: z2.string().optional()
});
var updatePropertySchema = createPropertySchema.partial();
var createUnitSchema = z2.object({
  propertyId: z2.string().uuid(),
  name: z2.string().min(1).max(255),
  description: z2.string().optional(),
  price: z2.string().min(1),
  capacity: z2.string().optional(),
  size: z2.string().optional(),
  status: z2.enum(UNIT_STATUSES).optional(),
  metadata: z2.record(z2.string(), z2.unknown()).optional()
});
var updateUnitSchema = createUnitSchema.partial();
var propertyQuerySchema = z2.object({
  page: z2.coerce.number().int().positive().default(1),
  limit: z2.coerce.number().int().positive().max(100).default(10),
  ownerId: z2.string().uuid().optional(),
  type: z2.enum(PROPERTY_TYPES).optional(),
  city: z2.string().optional(),
  search: z2.string().optional(),
  lat: z2.coerce.number().optional(),
  lng: z2.coerce.number().optional(),
  radiusKm: z2.coerce.number().positive().default(5).optional(),
  radius: z2.coerce.number().positive().optional(),
  amenities: z2.array(z2.string()).optional(),
  minPrice: z2.coerce.number().nonnegative().optional(),
  maxPrice: z2.coerce.number().nonnegative().optional(),
  isFeatured: z2.coerce.boolean().optional(),
  ids: z2.array(z2.string().uuid()).optional(),
  area: z2.string().optional(),
  campus: z2.string().optional(),
  duration: z2.string().optional(),
  gender: z2.string().optional(),
  swLat: z2.coerce.number().optional(),
  swLng: z2.coerce.number().optional(),
  neLat: z2.coerce.number().optional(),
  neLng: z2.coerce.number().optional()
});
var unitQuerySchema = z2.object({
  page: z2.coerce.number().int().positive().default(1),
  limit: z2.coerce.number().int().positive().max(100).default(10),
  propertyId: z2.string().uuid().optional(),
  status: z2.enum(UNIT_STATUSES).optional()
});
// src/api/payments.ts
import { z as z3 } from "zod";
var addBankAccountSchema = z3.object({
  account_type: z3.enum(BANK_ACCOUNT_TYPES),
  provider_name: z3.string().min(1),
  account_number: z3.string().min(5).max(30).regex(/^\d+$/, "Nomor rekening hanya boleh angka"),
  account_name: z3.string().min(3).max(100)
});
var createWithdrawalSchema = z3.object({
  bank_account_id: z3.string().uuid(),
  amount: z3.coerce.number().positive("Jumlah penarikan harus lebih dari 0")
});
// src/api/referrals-loyalty.ts
import { z as z4 } from "zod";
var createReferralSchema = z4.object({
  refereeEmail: z4.string().email("Format email tidak valid"),
  refereeName: z4.string().min(1, "Nama harus diisi"),
  category: z4.enum(REFERRAL_CATEGORIES).default("tenant"),
  propertyId: z4.string().uuid().optional(),
  message: z4.string().optional()
});
var referralQuerySchema = z4.object({
  page: z4.coerce.number().int().positive().default(1),
  limit: z4.coerce.number().int().positive().max(100).default(20),
  category: z4.enum(REFERRAL_CATEGORIES).optional(),
  status: z4.enum(REFERRAL_STATUSES).optional()
});
var redeemRewardSchema = z4.object({
  rewardId: z4.string().uuid()
});
var loyaltyTransactionSchema = z4.object({
  userId: z4.string().uuid(),
  amount: z4.coerce.number().int("Jumlah poin harus bilangan bulat"),
  type: z4.enum(LOYALTY_TRANSACTION_TYPES),
  description: z4.string().min(1),
  referenceId: z4.string().uuid().optional(),
  referenceType: z4.string().optional(),
  expiresAt: z4.string().datetime().optional()
});
var loyaltyQuerySchema = z4.object({
  page: z4.coerce.number().int().positive().default(1),
  limit: z4.coerce.number().int().positive().max(100).default(20),
  type: z4.enum(LOYALTY_TRANSACTION_TYPES).optional()
});
var createGroupBookingSchema = z4.object({
  name: z4.string().min(1, "Nama group harus diisi").max(255),
  description: z4.string().optional(),
  propertyId: z4.string().uuid(),
  unitId: z4.string().uuid(),
  startDate: z4.string().datetime(),
  endDate: z4.string().datetime(),
  maxMembers: z4.coerce.number().int().positive().max(50),
  memberIds: z4.array(z4.string().uuid()).min(1, "Minimal 1 anggota"),
  metadata: z4.record(z4.string(), z4.unknown()).optional()
});
var updateGroupBookingSchema = z4.object({
  name: z4.string().min(1).max(255).optional(),
  description: z4.string().optional(),
  status: z4.enum(GROUP_BOOKING_STATUSES).optional(),
  maxMembers: z4.coerce.number().int().positive().max(50).optional(),
  metadata: z4.record(z4.string(), z4.unknown()).optional()
});
var groupBookingQuerySchema = z4.object({
  page: z4.coerce.number().int().positive().default(1),
  limit: z4.coerce.number().int().positive().max(100).default(20),
  status: z4.enum(GROUP_BOOKING_STATUSES).optional(),
  propertyId: z4.string().uuid().optional()
});
// src/api/auth.ts
import { z as z5 } from "zod";
var updateUserProfileSchema = z5.object({
  phone: z5.string().min(10, "Nomor telepon minimal 10 digit").regex(/^[0-9+]+$/, "Nomor telepon hanya boleh angka dan tanda +"),
  whatsapp: z5.string().min(10, "WhatsApp minimal 10 digit"),
  telegram: z5.string().min(5, "Telegram minimal 5 karakter"),
  email: z5.string().email("Format email tidak valid")
});
// src/constants/roles.ts
var ROLE_OPTIONS = [
  { value: "cust", label: "Customer" },
  { value: "owner", label: "Owner" },
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Admin" }
];
function getRoleBadgeVariant(role) {
  switch (role) {
    case "admin":
      return "destructive";
    case "staff":
      return "secondary";
    case "owner":
      return "default";
    default:
      return "outline";
  }
}
// src/constants/business-rules.ts
var DEFAULT_PLATFORM_FEE_PERCENT = 1.8;
var MIN_PLATFORM_FEE_PERCENT = 0;
var MAX_PLATFORM_FEE_PERCENT = 10;
var DEFAULT_FEATURED_PRICE = 50000;
var DEFAULT_FEATURED_DURATION_DAYS = 7;
var DEFAULT_FEATURED_MAX_PER_DAY = 10;
var CURRENCY = "IDR";
var BOOKING_RULES = {
  platformFeePercent: DEFAULT_PLATFORM_FEE_PERCENT,
  minPlatformFeePercent: MIN_PLATFORM_FEE_PERCENT,
  maxPlatformFeePercent: MAX_PLATFORM_FEE_PERCENT,
  featuredListingPrice: DEFAULT_FEATURED_PRICE,
  featuredDurationDays: DEFAULT_FEATURED_DURATION_DAYS,
  featuredMaxPerDay: DEFAULT_FEATURED_MAX_PER_DAY,
  currency: CURRENCY
};
export {
  ACCOUNT_TYPES,
  BANK_ACCOUNT_TYPES,
  BOOKING_REQUEST_STATUSES,
  BOOKING_RULES,
  BOOKING_STATUSES,
  BOOKING_TYPES,
  CURRENCY,
  DEFAULT_FEATURED_DURATION_DAYS,
  DEFAULT_FEATURED_MAX_PER_DAY,
  DEFAULT_FEATURED_PRICE,
  DEFAULT_PLATFORM_FEE_PERCENT,
  GATEWAY_ENVIRONMENTS,
  GROUP_BOOKING_STATUSES,
  INSPECTION_INSTANCE_STATUSES,
  INSPECTION_STATUSES,
  KYC_DOCUMENT_TYPES,
  KYC_STATUSES,
  KYC_VERIFICATION_STATUSES,
  LEDGER_REFERENCE_TYPES,
  LOYALTY_TIERS,
  LOYALTY_TRANSACTION_TYPES,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_REPORT_CATEGORIES,
  MAINTENANCE_REPORT_STATUSES,
  MAINTENANCE_STATUSES,
  MAX_PLATFORM_FEE_PERCENT,
  MIN_PLATFORM_FEE_PERCENT,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_TYPES,
  PAYMENT_PROVIDERS,
  PAYMENT_PURPOSES,
  PAYMENT_STATUSES,
  PAYMENT_TRANSACTION_STATUSES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  REFERRAL_CATEGORIES,
  REFERRAL_STATUSES,
  REVIEW_TYPES,
  ROLE_OPTIONS,
  SEASONAL_RULE_TYPES,
  UNIT_STATUSES,
  USER_ROLES,
  WITHDRAWAL_STATUSES,
  addBankAccountSchema,
  bookingQuerySchema,
  checkoutBookingSchema,
  checkoutFeaturedSchema,
  createBookingSchema,
  createGroupBookingSchema,
  createPropertySchema,
  createReferralSchema,
  createUnitSchema,
  createWithdrawalSchema,
  getRoleBadgeVariant,
  groupBookingQuerySchema,
  ipaymuWebhookSchema,
  loyaltyQuerySchema,
  loyaltyTransactionSchema,
  propertyQuerySchema,
  redeemRewardSchema,
  referralQuerySchema,
  reviewBookingSchema,
  seasonalPricingQuerySchema,
  seasonalPricingRuleSchema,
  unitQuerySchema,
  updateGroupBookingSchema,
  updatePropertySchema,
  updateSeasonalPricingRuleSchema,
  updateUnitSchema,
  updateUserProfileSchema
};
