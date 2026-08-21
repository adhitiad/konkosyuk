import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  boolean,
  index,
  uniqueIndex,
  unique,
  numeric,
  integer,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import type { PropertyPackages } from "@/lib/types/property-packages";

export const userRole = ["cust", "owner", "admin", "staff"] as const;
export const propertyType = ["kost", "kontrakan", "ruko"] as const;
export const unitStatus = ["available", "booked", "maintenance"] as const;
export const bookingType = ["instant", "request"] as const;
export const bookingRequestStatus = [
  "pending",
  "approved",
  "rejected",
  "paid",
  "cancelled",
] as const;
export const bookingStatus = [
  "pending_dp",
  "awaiting_owner_approval",
  "awaiting_full_payment",
  "confirmed",
  "completed",
  "rejected",
  "cancelled",
] as const;
export const reviewType = ["tenant", "property"] as const;
export const notificationType = [
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
  "group_booking_updated",
] as const;
export const notificationCategory = [
  "booking",
  "payment",
  "maintenance",
  "inspection",
  "chat",
  "review",
  "system",
] as const;
export const notificationPriority = [
  "low",
  "normal",
  "high",
  "urgent",
] as const;
export const maintenancePriority = ["low", "medium", "high", "urgent"] as const;
export const maintenanceStatus = [
  "reported",
  "in_progress",
  "resolved",
  "cancelled",
] as const;
export const maintenanceReportCategory = [
  "air",
  "listrik",
  "kunci_pintu",
  "ac",
  "furniture",
  "lainnya",
] as const;
export const kycVerificationStatus = [
  "pending",
  "approved",
  "rejected",
  "expired",
] as const;
export const kycDocumentType = ["ktp", "passport", "driving_license"] as const;
export const maintenanceReportStatus = [
  "pending",
  "in_progress",
  "resolved",
  "rejected",
] as const;
export const paymentProvider = ["doku", "ipaymu", "nicepay", "mock"] as const;
export const paymentPurpose = [
  "dp",
  "full_payment",
  "featured_listing",
] as const;
export const paymentStatus = [
  "pending",
  "success",
  "failed",
  "expired",
  "refunded",
] as const;
export const paymentTransactionStatus = [
  "pending",
  "success",
  "failed",
  "expired",
  "refunded",
] as const;
export const kycStatus = ["none", "pending", "verified", "rejected"] as const;
export const bankAccountType = ["bank", "ewallet"] as const;
export const withdrawalStatus = [
  "pending",
  "processing",
  "success",
  "rejected",
] as const;
export const gatewayEnvironment = ["sandbox", "production"] as const;
export const accountType = [
  "asset",
  "liability",
  "equity",
  "revenue",
  "expense",
] as const;
export const ledgerReferenceType = [
  "payment",
  "withdrawal",
  "fee",
  "refund",
  "adjustment",
] as const;
export const loyaltyTier = ["bronze", "silver", "gold", "platinum"] as const;
export const seasonalRuleType = ["percentage", "fixed", "multiplier"] as const;
export const inspectionStatus = [
  "pending",
  "move_in_done",
  "move_out_done",
  "completed",
] as const;
export const inspectionInstanceStatus = [
  "pending",
  "in_progress",
  "completed",
  "disputed",
] as const;

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    name: text("name").notNull(),
    image: text("image"),
    phone: text("phone"),
    whatsapp: text("whatsapp"),
    telegram: text("telegram"),
    role: text("role", { enum: userRole }).notNull().default("cust"),
    isActive: boolean("is_active").notNull().default(true),
    isBanned: boolean("is_banned").notNull().default(false),
    banReason: text("ban_reason"),
    twoFactorEnabled: boolean("two_factor_enabled").default(false),
    kycStatus: text("kyc_status", { enum: kycStatus })
      .notNull()
      .default("none"),
    ktpNumber: text("ktp_number"),
    ktpImageUrl: text("ktp_image_url"),
    reputationScore: numeric("reputation_score", { precision: 4, scale: 2 })
      .notNull()
      .default("0.00"),
    balance: numeric("balance", { precision: 12, scale: 2 })
      .notNull()
      .default("0.00"),
    province: text("province"),
    city: text("city"),
    district: text("district"),
    referralCode: text("referral_code").unique(),
    referredBy: uuid("referred_by"),
    loyaltyTier: text("loyalty_tier", { enum: loyaltyTier })
      .notNull()
      .default("bronze"),
    totalReferrals: integer("total_referrals").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: unique("users_email_unique").on(table.email),
    isActiveIdx: index("users_is_active_idx").on(table.isActive),
  }),
);

export const ownerBankAccounts = pgTable(
  "owner_bank_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountType: text("account_type", { enum: bankAccountType }).notNull(),
    providerName: text("provider_name").notNull(),
    accountNumber: text("account_number").notNull(),
    accountName: text("account_name").notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    ownerIdIdx: index("owner_bank_accounts_owner_id_idx").on(table.ownerId),
    accountTypeIdx: index("owner_bank_accounts_account_type_idx").on(
      table.accountType,
    ),
  }),
);

export const withdrawals = pgTable(
  "withdrawals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bankAccountId: uuid("bank_account_id")
      .notNull()
      .references(() => ownerBankAccounts.id, { onDelete: "restrict" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    status: text("status", { enum: withdrawalStatus })
      .notNull()
      .default("pending"),
    adminNote: text("admin_note"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    ownerIdIdx: index("withdrawals_owner_id_idx").on(table.ownerId),
    statusIdx: index("withdrawals_status_idx").on(table.status),
    bankAccountIdIdx: index("withdrawals_bank_account_id_idx").on(
      table.bankAccountId,
    ),
  }),
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    token: text("token").unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
  }),
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      mode: "date",
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      mode: "date",
    }),
    expiresAt: timestamp("expires_at", { mode: "date" }),
    password: text("password"),
    scope: text("scope"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("accounts_user_id_idx").on(table.userId),
    providerIdx: index("accounts_provider_idx").on(
      table.providerId,
      table.accountId,
    ),
  }),
);

export const verifications = pgTable(
  "verifications",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    identifierIdx: index("verifications_identifier_idx").on(table.identifier),
  }),
);

export const twoFactor = pgTable(
  "twoFactor",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    verified: boolean("verified").notNull().default(true),
    failedVerificationCount: integer("failed_verification_count").default(0),
    lockedUntil: timestamp("locked_until", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("two_factor_user_id_idx").on(table.userId),
    secretIdx: index("two_factor_secret_idx").on(table.secret),
  }),
);

export const twoFactors = twoFactor;

export const propertyStatus = ["aktif", "nonaktif"] as const;

export const platformSettings = pgTable("platform_settings", {
  id: text("id").primaryKey().default("default"),
  platformFeePercent: numeric("platform_fee_percent", {
    precision: 5,
    scale: 2,
  }).default("1.8"),
  featuredListingPrice: numeric("featured_listing_price", {
    precision: 12,
    scale: 2,
  }).default("50000"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const properties = pgTable(
  "properties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    address: text("address").notNull(),
    province: text("province"),
    city: text("city"),
    district: text("district"),
    type: text("type", { enum: propertyType }).notNull(),
    basePrice: text("base_price"),
    packages: jsonb("packages")
      .$type<PropertyPackages>()
      .notNull()
      .default({
        predefined: [],
        custom: {
          enabled: false,
          label: "Custom Duration",
          unit: "days",
          pricePerUnit: 0,
          minDuration: 1,
          maxDuration: 365,
        },
      }),
    status: text("status", { enum: propertyStatus }).notNull().default("aktif"),
    amenities: jsonb("amenities").$type<string[]>().default([]),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    images: jsonb("images").$type<string[]>().default([]),
    latitude: numeric("latitude", { precision: 9, scale: 6 }),
    longitude: numeric("longitude", { precision: 9, scale: 6 }),
    isActive: boolean("is_active").notNull().default(false),
    isFeatured: boolean("is_featured").default(false),
    gpsVerified: boolean("gps_verified").notNull().default(false),
    featuredUntil: timestamp("featured_until"),
    icalExportToken: text("ical_export_token").unique(),
    icalImportUrl: text("ical_import_url"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    ownerIdIdx: index("properties_owner_id_idx").on(table.ownerId),
    typeIdx: index("properties_type_idx").on(table.type),
    statusIdx: index("properties_status_idx").on(table.status),
    cityIdx: index("properties_city_idx").on(table.city),
    provinceIdx: index("properties_province_idx").on(table.province),
    isActiveIdx: index("properties_is_active_idx").on(table.isActive),
    ownerActiveCreatedIdx: index("properties_owner_active_created_idx").on(
      table.ownerId,
      table.isActive,
      table.createdAt,
    ),
    amenitiesGinIdx: index("properties_amenities_gin_idx").using(
      "gin",
      table.amenities,
    ),
    metadataGinIdx: index("properties_metadata_gin_idx").using(
      "gin",
      table.metadata,
    ),
    coordsIdx: index("idx_properties_coords").on(table.latitude, table.longitude),
  }),
);

export const units = pgTable(
  "units",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    capacity: text("capacity"),
    size: text("size"),
    status: text("status", { enum: unitStatus }).notNull().default("available"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    propertyIdIdx: index("units_property_id_idx").on(table.propertyId),
    statusIdx: index("units_status_idx").on(table.status),
    propertyStatusCreatedIdx: index("units_property_status_created_idx").on(
      table.propertyId,
      table.status,
      table.createdAt,
    ),
    propertyNameUnique: unique("units_property_id_name_unique").on(
      table.propertyId,
      table.name,
    ),
  }),
);

export const unitPricingTiers = pgTable(
  "unit_pricing_tiers",
  {
    id: text("id").primaryKey(),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    maxOccupants: integer("max_occupants").notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    unitIdIdx: index("unit_pricing_tiers_unit_id_idx").on(table.unitId),
  }),
);

export const bookingRequests = pgTable(
  "booking_requests",
  {
    id: text("id").primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    numOccupants: integer("num_occupants").notNull(),
    startDate: timestamp("start_date", { mode: "date" }).notNull(),
    status: text("status", { enum: bookingRequestStatus })
      .notNull()
      .default("pending"),
    agreedPrice: numeric("agreed_price", { precision: 12, scale: 2 }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("booking_requests_tenant_id_idx").on(table.tenantId),
    unitIdIdx: index("booking_requests_unit_id_idx").on(table.unitId),
    propertyIdIdx: index("booking_requests_property_id_idx").on(
      table.propertyId,
    ),
    statusIdx: index("booking_requests_status_idx").on(table.status),
  }),
);

export const loyaltyPoints = pgTable("loyalty_points", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  points: integer("points").notNull().default(0),
  type: text("type", {
    enum: ["earned", "redeemed", "expired", "bonus"] as const,
  }).notNull(),
  source: text("source"),
  referenceId: text("reference_id"),
  description: text("description"),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const groupBookings = pgTable("group_bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadUserId: uuid("lead_user_id")
    .references(() => users.id)
    .notNull(),
  propertyId: uuid("property_id")
    .references(() => properties.id)
    .notNull(),
  unitId: uuid("unit_id")
    .references(() => units.id)
    .notNull(),
  status: text("status", {
    enum: ["pending", "confirmed", "cancelled", "completed"] as const,
  }).default("pending"),
  totalAmount: numeric("total_amount").notNull(),
  depositAmount: numeric("deposit_amount").notNull(),
  startDate: timestamp("start_date", { mode: "date" }).notNull(),
  endDate: timestamp("end_date", { mode: "date" }).notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const groupBookingMembers = pgTable("group_booking_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupBookingId: uuid("group_booking_id")
    .references(() => groupBookings.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  sharePercentage: numeric("share_percentage", {
    precision: 5,
    scale: 2,
  }).notNull(),
  shareAmount: numeric("share_amount").notNull(),
  paidAmount: numeric("paid_amount").default("0"),
  status: text("status", {
    enum: ["invited", "accepted", "rejected", "paid"] as const,
  }).default("invited"),
  joinedAt: timestamp("joined_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const roommatePreferences = pgTable("roommate_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull()
    .unique(),
  budgetMin: numeric("budget_min", { precision: 12, scale: 2 }),
  budgetMax: numeric("budget_max", { precision: 12, scale: 2 }),
  preferredLocation: text("preferred_location"),
  moveInDate: timestamp("move_in_date", { mode: "date" }),
  duration: text("duration"),
  lifestyle: jsonb("lifestyle").$type<Record<string, unknown>>().default({}),
  bio: text("bio"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const seasonalPricingRules = pgTable("seasonal_pricing_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id")
    .references(() => properties.id, { onDelete: "cascade" })
    .notNull(),
  unitId: uuid("unit_id").references(() => units.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  ruleType: text("rule_type", { enum: seasonalRuleType })
    .notNull()
    .default("percentage"),
  adjustmentValue: numeric("adjustment_value", {
    precision: 12,
    scale: 2,
  }).notNull(),
  startDate: timestamp("start_date", { mode: "date" }).notNull(),
  endDate: timestamp("end_date", { mode: "date" }).notNull(),
  minNights: integer("min_nights"),
  maxNights: integer("max_nights"),
  priority: integer("priority").default(0),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
});

export const pricingAnalytics = pgTable("pricing_analytics", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id")
    .references(() => properties.id, { onDelete: "cascade" })
    .notNull(),
  month: text("month").notNull(),
  avgOccupancy: numeric("avg_occupancy", { precision: 5, scale: 2 }),
  avgBookingValue: numeric("avg_booking_value", { precision: 12, scale: 2 }),
  totalBookings: integer("total_bookings").default(0),
  recommendedPrice: numeric("recommended_price", { precision: 12, scale: 2 }),
  recommendedAdjustment: numeric("recommended_adjustment", {
    precision: 5,
    scale: 2,
  }),
  confidenceScore: numeric("confidence_score", { precision: 3, scale: 2 }),
  factors: jsonb("factors").default({}),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const pricingSuggestions = pgTable("pricing_suggestions", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id")
    .references(() => properties.id, { onDelete: "cascade" })
    .notNull(),
  ruleId: uuid("rule_id").references(() => seasonalPricingRules.id),
  suggestedValue: numeric("suggested_value", {
    precision: 12,
    scale: 2,
  }).notNull(),
  reason: text("reason").notNull(),
  priority: text("priority", {
    enum: ["high", "medium", "low"] as const,
  }).default("medium"),
  status: text("status", {
    enum: ["pending", "accepted", "rejected", "expired"] as const,
  }).default("pending"),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const inspections = pgTable("inspections", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookingId: uuid("booking_id").notNull(),
  propertyId: uuid("property_id")
    .references(() => properties.id, { onDelete: "cascade" })
    .notNull(),
  unitId: uuid("unit_id")
    .references(() => units.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type", {
    enum: ["move_in", "move_out", "mid_stay"] as const,
  }).notNull(),
  status: text("status", { enum: inspectionInstanceStatus }).default("pending"),
  performedBy: uuid("performed_by")
    .references(() => users.id)
    .notNull(),
  witnessId: uuid("witness_id").references(() => users.id),
  overallCondition: text("overall_condition", {
    enum: ["excellent", "good", "fair", "poor", "damaged"] as const,
  }),
  notes: text("notes"),
  damageScore: numeric("damage_score", { precision: 5, scale: 2 }),
  estimatedRepairCost: numeric("estimated_repair_cost", {
    precision: 12,
    scale: 2,
  }),
  securityDeposit: numeric("security_deposit", { precision: 12, scale: 2 }),
  refundAmount: numeric("refund_amount", { precision: 12, scale: 2 }),
  isDisputed: boolean("is_disputed").default(false),
  disputeReason: text("dispute_reason"),
  completedAt: timestamp("completed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const inspectionItems = pgTable("inspection_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  inspectionId: uuid("inspection_id")
    .references(() => inspections.id, { onDelete: "cascade" })
    .notNull(),
  category: text("category", {
    enum: [
      "furniture",
      "electrical",
      "plumbing",
      "walls",
      "floor",
      "doors_windows",
      "ac",
      "kitchen",
      "bathroom",
      "other",
    ] as const,
  }).notNull(),
  itemName: text("item_name").notNull(),
  condition: text("condition", {
    enum: ["excellent", "good", "fair", "poor", "damaged", "missing"] as const,
  }),
  notes: text("notes"),
  repairCost: numeric("repair_cost", { precision: 12, scale: 2 }),
  photoUrls: jsonb("photo_urls").$type<string[]>().default([]),
  isNewDamage: boolean("is_new_damage").default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const inspectionPhotos = pgTable("inspection_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  inspectionId: uuid("inspection_id")
    .references(() => inspections.id, { onDelete: "cascade" })
    .notNull(),
  itemId: uuid("item_id").references(() => inspectionItems.id, {
    onDelete: "cascade",
  }),
  type: text("type", {
    enum: ["overview", "damage", "receipt", "document"] as const,
  }).notNull(),
  url: text("url").notNull(),
  caption: text("caption"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const damageReports = pgTable("damage_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  inspectionId: uuid("inspection_id")
    .references(() => inspections.id, { onDelete: "cascade" })
    .notNull(),
  itemId: uuid("item_id").references(() => inspectionItems.id),
  reportedBy: uuid("reported_by")
    .references(() => users.id)
    .notNull(),
  severity: text("severity", {
    enum: ["minor", "moderate", "major", "critical"] as const,
  }).notNull(),
  description: text("description").notNull(),
  estimatedCost: numeric("estimated_cost", { precision: 12, scale: 2 }),
  actualCost: numeric("actual_cost", { precision: 12, scale: 2 }),
  status: text("status", {
    enum: [
      "reported",
      "acknowledged",
      "disputed",
      "resolved",
      "waived",
    ] as const,
  }).default("reported"),
  resolution: text("resolution"),
  resolvedBy: uuid("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const inspectionTemplates = pgTable("inspection_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyType: text("property_type", {
    enum: ["kost", "kontrakan", "ruko"] as const,
  }).notNull(),
  items: jsonb("items")
    .$type<
      {
        category: string;
        itemName: string;
        description: string;
        isRequired: boolean;
      }[]
    >()
    .notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const propertyComparisons = pgTable("property_comparisons", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  propertyIds: jsonb("property_ids").$type<string[]>().notNull(),
  name: text("name"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const neighborhoodInsights = pgTable("neighborhood_insights", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id")
    .references(() => properties.id, { onDelete: "cascade" })
    .notNull(),
  category: text("category", {
    enum: [
      "safety",
      "transport",
      "food",
      "atm",
      "healthcare",
      "shopping",
      "noise",
      "parking",
    ] as const,
  }).notNull(),
  rating: numeric("rating", { precision: 3, scale: 2 }),
  description: text("description"),
  source: text("source", {
    enum: ["tenant", "owner", "admin", "auto"] as const,
  }).default("tenant"),
  submittedBy: uuid("submitted_by").references(() => users.id),
  isVerified: boolean("is_verified").default(false),
  helpfulCount: integer("helpful_count").default(0),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const neighborhoodPlaces = pgTable("neighborhood_places", {
  id: uuid("id").defaultRandom().primaryKey(),
  propertyId: uuid("property_id")
    .references(() => properties.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type", {
    enum: [
      "warung",
      "atm",
      "halte",
      "rumah_sakit",
      "apotek",
      "supermarket",
      "masjid",
      "pasar",
    ] as const,
  }).notNull(),
  name: text("name").notNull(),
  distance: numeric("distance", { precision: 5, scale: 2 }),
  walkingMinutes: integer("walking_minutes"),
  latitude: numeric("latitude", { precision: 9, scale: 6 }),
  longitude: numeric("longitude", { precision: 9, scale: 6 }),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    bookingType: text("booking_type", { enum: bookingType }).notNull(),
    status: text("status", { enum: bookingStatus })
      .notNull()
      .default("pending_dp"),
    startDate: timestamp("start_date", { mode: "date" }).notNull(),
    endDate: timestamp("end_date", { mode: "date" }).notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    rejectionReason: text("rejection_reason"),
    isGroupBooking: boolean("is_group_booking").default(false),
    groupBookingId: uuid("group_booking_id").references(() => groupBookings.id),
    pricingRuleId: uuid("pricing_rule_id").references(
      () => seasonalPricingRules.id,
    ),
    basePriceAtBooking: numeric("base_price_at_booking", {
      precision: 12,
      scale: 2,
    }),
    securityDeposit: numeric("security_deposit", { precision: 12, scale: 2 }),
    moveInInspectionId: uuid("move_in_inspection_id"),
    moveOutInspectionId: uuid("move_out_inspection_id"),
    inspectionStatus: text("inspection_status", { enum: inspectionStatus })
      .notNull()
      .default("pending"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("bookings_user_id_idx").on(table.userId),
    propertyIdIdx: index("bookings_property_id_idx").on(table.propertyId),
    unitIdIdx: index("bookings_unit_id_idx").on(table.unitId),
    statusIdx: index("bookings_status_idx").on(table.status),
    userStatusCreatedIdx: index("bookings_user_status_created_idx").on(
      table.userId,
      table.status,
      table.createdAt,
    ),
    propertyStatusCreatedIdx: index("bookings_property_status_created_idx").on(
      table.propertyId,
      table.status,
      table.createdAt,
    ),
  }),
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id").references(() => properties.id, {
      onDelete: "cascade",
    }),
    provider: text("provider", { enum: paymentProvider }).notNull(),
    purpose: text("purpose", { enum: paymentPurpose }).notNull(),
    amount: text("amount").notNull(),
    currency: text("currency").notNull().default("IDR"),
    status: text("status", { enum: paymentStatus })
      .notNull()
      .default("pending"),
    transactionId: text("transaction_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    rawResponse: jsonb("raw_response")
      .$type<Record<string, unknown>>()
      .default({}),
    paidAt: timestamp("paid_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    bookingIdIdx: index("payments_booking_id_idx").on(table.bookingId),
    providerIdx: index("payments_provider_idx").on(table.provider),
    statusIdx: index("payments_status_idx").on(table.status),
    propertyIdIdx: index("payments_property_id_idx").on(table.propertyId),
  }),
);

export const refundRequestStatus = ["pending", "approved", "rejected"] as const;

export const refundRequests = pgTable(
  "refund_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: text("amount").notNull(),
    approvedAmount: text("approved_amount"),
    reason: text("reason").notNull(),
    status: text("status", { enum: refundRequestStatus })
      .notNull()
      .default("pending"),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { mode: "date" }),
    reviewNote: text("review_note"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    bookingIdIdx: index("refund_requests_booking_id_idx").on(table.bookingId),
    paymentIdIdx: index("refund_requests_payment_id_idx").on(table.paymentId),
    userIdIdx: index("refund_requests_user_id_idx").on(table.userId),
    statusIdx: index("refund_requests_status_idx").on(table.status),
  }),
);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: text("provider").notNull(),
    eventId: text("event_id").notNull(),
    eventType: text("event_type"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    signatureValid: boolean("signature_valid").default(false),
    payloadHash: text("payload_hash"),
    details: jsonb("details").$type<Record<string, unknown>>().default({}),
    processedAt: timestamp("processed_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    providerEventIdIdx: unique("webhook_events_provider_event_id_unique").on(
      table.provider,
      table.eventId,
    ),
    providerIdx: index("webhook_events_provider_idx").on(table.provider),
    payloadHashIdx: index("webhook_events_payload_hash_idx").on(
      table.payloadHash,
    ),
  }),
);

export const reviewStatus = ["pending", "approved", "rejected"] as const;

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdById: uuid("created_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reviewedUserId: uuid("reviewed_user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    propertyId: uuid("property_id").references(() => properties.id, {
      onDelete: "cascade",
    }),
    type: text("type", { enum: reviewType }).notNull(),
    rating: numeric("rating", { precision: 3, scale: 2 }).notNull(),
    cleanliness: numeric("cleanliness", { precision: 3, scale: 2 }).notNull(),
    security: numeric("security", { precision: 3, scale: 2 }).notNull(),
    accuracy: numeric("accuracy", { precision: 3, scale: 2 }).notNull(),
    communication: numeric("communication", {
      precision: 3,
      scale: 2,
    }).notNull(),
    valueForMoney: numeric("value_for_money", {
      precision: 3,
      scale: 2,
    }).notNull(),
    comment: text("comment").notNull(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    status: text("status", { enum: reviewStatus }).notNull().default("pending"),
    isEdited: boolean("is_edited").notNull().default(false),
    helpfulCount: integer("helpful_count").notNull().default(0),
    replyCount: integer("reply_count").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    createdByIdIdx: index("reviews_created_by_id_idx").on(table.createdById),
    reviewedUserIdIdx: index("reviews_reviewed_user_id_idx").on(
      table.reviewedUserId,
    ),
    propertyIdIdx: index("reviews_property_id_idx").on(table.propertyId),
    bookingIdIdx: index("reviews_booking_id_idx").on(table.bookingId),
    typeIdx: index("reviews_type_idx").on(table.type),
    statusIdx: index("reviews_status_idx").on(table.status),
    propertyUserUnique: unique("reviews_property_user_unique").on(
      table.propertyId,
      table.createdById,
    ),
    ratingIdx: index("reviews_rating_idx").on(table.rating),
  }),
);

export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("favorites_user_id_idx").on(table.userId),
    propertyIdIdx: index("favorites_property_id_idx").on(table.propertyId),
    userPropertyUnique: unique("favorites_user_property_unique").on(
      table.userId,
      table.propertyId,
    ),
  }),
);

export const savedSearches = pgTable(
  "saved_searches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name"),
    filters: jsonb("filters")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    isActive: boolean("is_active").notNull().default(true),
    lastMatchedAt: timestamp("last_matched_at", { mode: "date" }),
    lastNotifiedAt: timestamp("last_notified_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("saved_searches_user_id_idx").on(table.userId),
    activeIdx: index("saved_searches_active_idx").on(table.isActive),
  }),
);

export const savedSearchesRelations = relations(savedSearches, ({ one }) => ({
  user: one(users, {
    fields: [savedSearches.userId],
    references: [users.id],
  }),
}));

export const wishlists = pgTable(
  "wishlists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("wishlists_user_id_idx").on(table.userId),
    propertyIdIdx: index("wishlists_property_id_idx").on(table.propertyId),
    userPropertyUnique: unique("wishlists_user_property_unique").on(
      table.userId,
      table.propertyId,
    ),
  }),
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    message: text("message").notNull(),
    type: text("type", { enum: notificationType }).notNull(),
    referenceId: uuid("reference_id"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
    isReadIdx: index("notifications_is_read_idx").on(table.isRead),
  }),
);

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("push_subscriptions_user_id_idx").on(table.userId),
    endpointIdx: uniqueIndex("push_subscriptions_endpoint_idx").on(
      table.endpoint,
    ),
  }),
);

export const userNotificationPreferences = pgTable(
  "user_notification_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    preferences: jsonb("preferences").notNull().default({}),
    emailDigest: text("email_digest", {
      enum: ["immediate", "daily", "weekly", "never"],
    })
      .notNull()
      .default("immediate"),
    quietHoursStart: text("quiet_hours_start"),
    quietHoursEnd: text("quiet_hours_end"),
    timezone: text("timezone").notNull().default("Asia/Jakarta"),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: uniqueIndex("user_notification_preferences_user_id_idx").on(
      table.userId,
    ),
  }),
);

export const maintenanceTickets = pgTable(
  "maintenance_tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    images: jsonb("images").$type<string[]>().default([]),
    priority: text("priority", { enum: maintenancePriority })
      .notNull()
      .default("medium"),
    status: text("status", { enum: maintenanceStatus })
      .notNull()
      .default("reported"),
    ownerNotes: text("owner_notes"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("maintenance_tickets_tenant_id_idx").on(table.tenantId),
    statusIdx: index("maintenance_tickets_status_idx").on(table.status),
    priorityIdx: index("maintenance_tickets_priority_idx").on(table.priority),
  }),
);

// Laporan masalah dari tenant, terpisah dari tiket maintenance lama.
export const maintenanceReports = pgTable(
  "maintenance_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    unitId: uuid("unit_id").references(() => units.id, {
      onDelete: "set null",
    }),
    category: text("category", { enum: maintenanceReportCategory }).notNull(),
    description: text("description").notNull(),
    images: jsonb("images").$type<string[]>().default([]),
    status: text("status", { enum: maintenanceReportStatus })
      .notNull()
      .default("pending"),
    resolutionNote: text("resolution_note"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("maintenance_reports_tenant_id_idx").on(table.tenantId),
    propertyIdIdx: index("maintenance_reports_property_id_idx").on(
      table.propertyId,
    ),
    statusIdx: index("maintenance_reports_status_idx").on(table.status),
  }),
);

export const balanceLogs = pgTable(
  "balance_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    type: text("type", { enum: ["refund", "withdrawal", "topup"] }).notNull(),
    description: text("description").notNull(),
    relatedId: text("related_id"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("balance_logs_user_id_idx").on(table.userId),
    typeIdx: index("balance_logs_type_idx").on(table.type),
    createdAtIdx: index("balance_logs_created_at_idx").on(table.createdAt),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;
export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type Unit = typeof units.$inferSelect;
export type NewUnit = typeof units.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type RefundRequest = typeof refundRequests.$inferSelect;
export type NewRefundRequest = typeof refundRequests.$inferInsert;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
export type Wishlist = typeof wishlists.$inferSelect;
export type NewWishlist = typeof wishlists.$inferInsert;
export type SavedSearch = typeof savedSearches.$inferSelect;
export type NewSavedSearch = typeof savedSearches.$inferInsert;
export type UserContract = typeof userContracts.$inferSelect;
export type NewUserContract = typeof userContracts.$inferInsert;
export type Feedback = typeof feedbacks.$inferSelect;
export type NewFeedback = typeof feedbacks.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
export type MaintenanceTicket = typeof maintenanceTickets.$inferSelect;
export type NewMaintenanceTicket = typeof maintenanceTickets.$inferInsert;
export type MaintenanceReport = typeof maintenanceReports.$inferSelect;
export type NewMaintenanceReport = typeof maintenanceReports.$inferInsert;
export type OwnerBankAccount = typeof ownerBankAccounts.$inferSelect;
export type NewOwnerBankAccount = typeof ownerBankAccounts.$inferInsert;
export type BalanceLog = typeof balanceLogs.$inferSelect;
export type NewBalanceLog = typeof balanceLogs.$inferInsert;
export type PlatformSetting = typeof platformSettings.$inferSelect;
export type NewPlatformSetting = typeof platformSettings.$inferInsert;
export type PaymentGatewayConfig = typeof paymentGatewayConfigs.$inferSelect;
export type NewPaymentGatewayConfig = typeof paymentGatewayConfigs.$inferInsert;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type NewPaymentTransaction = typeof paymentTransactions.$inferInsert;
export type ChartOfAccount = typeof chartOfAccounts.$inferSelect;
export type NewChartOfAccount = typeof chartOfAccounts.$inferInsert;
export type GeneralLedger = typeof generalLedger.$inferSelect;
export type NewGeneralLedger = typeof generalLedger.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type PropertyTag = typeof propertyTags.$inferSelect;
export type NewPropertyTag = typeof propertyTags.$inferInsert;
export type UnitPricingTier = typeof unitPricingTiers.$inferSelect;
export type NewUnitPricingTier = typeof unitPricingTiers.$inferInsert;
export type BookingRequest = typeof bookingRequests.$inferSelect;
export type NewBookingRequest = typeof bookingRequests.$inferInsert;
export type TwoFactor = typeof twoFactor.$inferSelect;
export type NewTwoFactor = typeof twoFactor.$inferInsert;
export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;
export type LoyaltyPoint = typeof loyaltyPoints.$inferSelect;
export type NewLoyaltyPoint = typeof loyaltyPoints.$inferInsert;
export type Reward = typeof rewards.$inferSelect;
export type NewReward = typeof rewards.$inferInsert;
export type RewardRedemption = typeof rewardRedemptions.$inferSelect;
export type NewRewardRedemption = typeof rewardRedemptions.$inferInsert;
export type GroupBooking = typeof groupBookings.$inferSelect;
export type NewGroupBooking = typeof groupBookings.$inferInsert;
export type GroupBookingMember = typeof groupBookingMembers.$inferSelect;
export type NewGroupBookingMember = typeof groupBookingMembers.$inferInsert;
export type RoommatePreference = typeof roommatePreferences.$inferSelect;
export type NewRoommatePreference = typeof roommatePreferences.$inferInsert;
export type SeasonalPricingRule = typeof seasonalPricingRules.$inferSelect;
export type NewSeasonalPricingRule = typeof seasonalPricingRules.$inferInsert;
export type PricingAnalytic = typeof pricingAnalytics.$inferSelect;
export type NewPricingAnalytic = typeof pricingAnalytics.$inferInsert;
export type PricingSuggestion = typeof pricingSuggestions.$inferSelect;
export type NewPricingSuggestion = typeof pricingSuggestions.$inferInsert;
export type Inspection = typeof inspections.$inferSelect;
export type NewInspection = typeof inspections.$inferInsert;
export type InspectionItem = typeof inspectionItems.$inferSelect;
export type NewInspectionItem = typeof inspectionItems.$inferInsert;
export type InspectionPhoto = typeof inspectionPhotos.$inferSelect;
export type NewInspectionPhoto = typeof inspectionPhotos.$inferInsert;
export type DamageReport = typeof damageReports.$inferSelect;
export type NewDamageReport = typeof damageReports.$inferInsert;
export type InspectionTemplate = typeof inspectionTemplates.$inferSelect;
export type NewInspectionTemplate = typeof inspectionTemplates.$inferInsert;
export type PropertyComparison = typeof propertyComparisons.$inferSelect;
export type NewPropertyComparison = typeof propertyComparisons.$inferInsert;
export type NeighborhoodInsight = typeof neighborhoodInsights.$inferSelect;
export type NewNeighborhoodInsight = typeof neighborhoodInsights.$inferInsert;
export type NeighborhoodPlace = typeof neighborhoodPlaces.$inferSelect;
export type NewNeighborhoodPlace = typeof neighborhoodPlaces.$inferInsert;

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  properties: many(properties),
  bookings: many(bookings),
  reviewsGiven: many(reviews, { relationName: "createdBy" }),
  reviewsReceived: many(reviews, { relationName: "reviewedUser" }),
  wishlists: many(wishlists),
  savedSearches: many(savedSearches),
  twoFactors: many(twoFactor),
  referrals: many(referrals, { relationName: "referrer" }),
  refereeReferrals: many(referrals, { relationName: "referee" }),
  loyaltyPoints: many(loyaltyPoints),
  rewardRedemptions: many(rewardRedemptions),
  leadGroupBookings: many(groupBookings),
  groupBookingMemberships: many(groupBookingMembers),
  roommatePreference: one(roommatePreferences),
  inspectionsPerformed: many(inspections, { relationName: "performedBy" }),
  witnessedInspections: many(inspections, { relationName: "witness" }),
  damageReports: many(damageReports, { relationName: "reportedBy" }),
  resolvedDamageReports: many(damageReports, { relationName: "resolvedBy" }),
  neighborhoodInsights: many(neighborhoodInsights),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
  user: one(users, {
    fields: [twoFactor.userId],
    references: [users.id],
  }),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, {
    fields: [properties.ownerId],
    references: [users.id],
  }),
  units: many(units),
  bookings: many(bookings),
  propertyTags: many(propertyTags),
  wishlists: many(wishlists),
  groupBookings: many(groupBookings),
  seasonalPricingRules: many(seasonalPricingRules),
  pricingAnalytics: many(pricingAnalytics),
  pricingSuggestions: many(pricingSuggestions),
  inspections: many(inspections),
  neighborhoodInsights: many(neighborhoodInsights),
  neighborhoodPlaces: many(neighborhoodPlaces),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  property: one(properties, {
    fields: [units.propertyId],
    references: [properties.id],
  }),
  bookings: many(bookings),
  pricingTiers: many(unitPricingTiers),
}));

export const unitPricingTiersRelations = relations(
  unitPricingTiers,
  ({ one }) => ({
    unit: one(units, {
      fields: [unitPricingTiers.unitId],
      references: [units.id],
    }),
  }),
);

export const bookingRequestsRelations = relations(
  bookingRequests,
  ({ one }) => ({
    tenant: one(users, {
      fields: [bookingRequests.tenantId],
      references: [users.id],
    }),
    unit: one(units, {
      fields: [bookingRequests.unitId],
      references: [units.id],
    }),
    property: one(properties, {
      fields: [bookingRequests.propertyId],
      references: [properties.id],
    }),
  }),
);

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [bookings.propertyId],
    references: [properties.id],
  }),
  unit: one(units, {
    fields: [bookings.unitId],
    references: [units.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  createdBy: one(users, {
    fields: [reviews.createdById],
    references: [users.id],
  }),
  reviewedUser: one(users, {
    fields: [reviews.reviewedUserId],
    references: [users.id],
    relationName: "reviewedUser",
  }),
  property: one(properties, {
    fields: [reviews.propertyId],
    references: [properties.id],
  }),
  booking: one(bookings, {
    fields: [reviews.bookingId],
    references: [bookings.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const pushSubscriptionsRelations = relations(
  pushSubscriptions,
  ({ one }) => ({
    user: one(users, {
      fields: [pushSubscriptions.userId],
      references: [users.id],
    }),
  }),
);

export const maintenanceTicketsRelations = relations(
  maintenanceTickets,
  ({ one }) => ({
    unit: one(units, {
      fields: [maintenanceTickets.unitId],
      references: [units.id],
    }),
    tenant: one(users, {
      fields: [maintenanceTickets.tenantId],
      references: [users.id],
    }),
  }),
);

export const maintenanceReportsRelations = relations(
  maintenanceReports,
  ({ one }) => ({
    tenant: one(users, {
      fields: [maintenanceReports.tenantId],
      references: [users.id],
    }),
    property: one(properties, {
      fields: [maintenanceReports.propertyId],
      references: [properties.id],
    }),
    unit: one(units, {
      fields: [maintenanceReports.unitId],
      references: [units.id],
    }),
  }),
);

export const paymentGatewayConfigs = pgTable("payment_gateway_configs", {
  id: text("id").primaryKey(),
  provider: text("provider", { enum: paymentProvider }).notNull(),
  isActive: boolean("is_active").default(false),
  config: jsonb("config")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
  environment: text("environment", { enum: gatewayEnvironment }).default(
    "sandbox",
  ),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paymentGatewayCredentials = pgTable(
  "payment_gateway_credentials",
  {
    id: text("id").primaryKey(),
    gatewayId: text("gateway_id")
      .notNull()
      .references(() => paymentGatewayConfigs.id, { onDelete: "cascade" })
      .unique(),
    encryptedConfig: jsonb("encrypted_config")
      .$type<Record<string, unknown>>()
      .notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
);

export const paymentTransactions = pgTable("payment_transactions", {
  id: text("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  bookingId: uuid("booking_id").references(() => bookings.id, {
    onDelete: "cascade",
  }),
  provider: text("provider", { enum: paymentProvider }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status", { enum: paymentTransactionStatus })
    .notNull()
    .default("pending"),
  gatewayResponse: jsonb("gateway_response").$type<Record<string, unknown>>(),
  webhookPayload: jsonb("webhook_payload").$type<Record<string, unknown>>(),
  paidAt: timestamp("paid_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const chartOfAccounts = pgTable("chart_of_accounts", {
  id: text("id").primaryKey(),
  accountCode: text("account_code").notNull().unique(),
  accountName: text("account_name").notNull(),
  accountType: text("account_type", { enum: accountType }).notNull(),
  parentAccountId: text("parent_account_id").references(
    () => chartOfAccounts.id,
    { onDelete: "set null" },
  ),
  isActive: boolean("is_active").default(true),
}) as unknown as ReturnType<typeof pgTable>;

export const generalLedger = pgTable("general_ledger", {
  id: text("id").primaryKey(),
  transactionDate: timestamp("transaction_date").notNull(),
  accountCode: text("account_code").notNull(),
  accountName: text("account_name").notNull(),
  description: text("description").notNull(),
  referenceType: text("reference_type", { enum: ledgerReferenceType }),
  referenceId: text("reference_id"),
  debit: numeric("debit", { precision: 12, scale: 2 }).default("0"),
  credit: numeric("credit", { precision: 12, scale: 2 }).default("0"),
  balance: numeric("balance", { precision: 12, scale: 2 }),
  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentGatewayConfigsRelations = relations(
  paymentGatewayConfigs,
  ({ one, many }) => ({
    credentials: one(paymentGatewayCredentials, {
      fields: [paymentGatewayConfigs.id],
      references: [paymentGatewayCredentials.gatewayId],
    }),
    transactions: many(paymentTransactions),
  }),
);

export const paymentGatewayCredentialsRelations = relations(
  paymentGatewayCredentials,
  ({ one }) => ({
    gateway: one(paymentGatewayConfigs, {
      fields: [paymentGatewayCredentials.gatewayId],
      references: [paymentGatewayConfigs.id],
    }),
  }),
);

export const paymentTransactionsRelations = relations(
  paymentTransactions,
  ({ one }) => ({
    gatewayConfig: one(paymentGatewayConfigs, {
      fields: [paymentTransactions.provider],
      references: [paymentGatewayConfigs.provider],
    }),
    booking: one(bookings, {
      fields: [paymentTransactions.bookingId],
      references: [bookings.id],
    }),
  }),
);

export const chartOfAccountsRelations = relations(
  chartOfAccounts,
  ({ one, many }) => ({
    parent: one(chartOfAccounts, {
      fields: [chartOfAccounts.parentAccountId],
      references: [chartOfAccounts.id],
      relationName: "children",
    }),
    children: many(chartOfAccounts, {
      relationName: "children",
    }),
    ledgerEntries: many(generalLedger),
  }),
);

export const generalLedgerRelations = relations(generalLedger, ({ one }) => ({
  account: one(chartOfAccounts, {
    fields: [generalLedger.accountCode],
    references: [chartOfAccounts.accountCode],
  }),
  creator: one(users, {
    fields: [generalLedger.createdBy],
    references: [users.id],
  }),
}));

export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category", { enum: ["facility", "rule"] }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const propertyTags = pgTable(
  "property_tags",
  {
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: index("property_tags_pk").on(table.propertyId, table.tagId),
  }),
);

export const propertyTagsRelations = relations(propertyTags, ({ one }) => ({
  property: one(properties, {
    fields: [propertyTags.propertyId],
    references: [properties.id],
  }),
  tag: one(tags, {
    fields: [propertyTags.tagId],
    references: [tags.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  propertyTags: many(propertyTags),
}));

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  adminId: uuid("admin_id")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  details: jsonb("details").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  admin: one(users, {
    fields: [auditLogs.adminId],
    references: [users.id],
  }),
}));

export const chatRooms = pgTable(
  "chat_rooms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lastMessageAt: timestamp("last_message_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("chat_rooms_tenant_id_idx").on(table.tenantId),
    ownerIdIdx: index("chat_rooms_owner_id_idx").on(table.ownerId),
    propertyIdIdx: index("chat_rooms_property_id_idx").on(table.propertyId),
    lastMessageAtIdx: index("chat_rooms_last_message_at_idx").on(
      table.lastMessageAt,
    ),
    tenantOwnerUnique: unique("chat_rooms_tenant_owner_unique").on(
      table.tenantId,
      table.ownerId,
    ),
  }),
);

export const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
  property: one(properties, {
    fields: [chatRooms.propertyId],
    references: [properties.id],
  }),
  tenant: one(users, {
    fields: [chatRooms.tenantId],
    references: [users.id],
  }),
  owner: one(users, {
    fields: [chatRooms.ownerId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => chatRooms.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    isRead: boolean("is_read").notNull().default(false),
  },
  (table) => ({
    roomIdIdx: index("messages_room_id_idx").on(table.roomId),
    senderIdIdx: index("messages_sender_id_idx").on(table.senderId),
    createdAtIdx: index("messages_created_at_idx").on(table.createdAt),
  }),
);

export const messagesRelations = relations(messages, ({ one }) => ({
  room: one(chatRooms, {
    fields: [messages.roomId],
    references: [chatRooms.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const kycVerifications = pgTable(
  "kyc_verifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    diditSessionId: text("didit_session_id").unique(),
    diditRedirectUrl: text("didit_redirect_url"),
    status: text("status", { enum: kycVerificationStatus })
      .notNull()
      .default("pending"),
    documentType: text("document_type", { enum: kycDocumentType }),
    ktpImageUrl: text("ktp_image_url"),
    selfieImageUrl: text("selfie_image_url"),
    faceMatchScore: numeric("face_match_score", { precision: 5, scale: 2 }),
    livenessPassed: boolean("liveness_passed"),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("kyc_verifications_user_id_idx").on(table.userId),
    diditSessionIdIdx: index("kyc_verifications_didit_session_id_idx").on(
      table.diditSessionId,
    ),
    statusIdx: index("kyc_verifications_status_idx").on(table.status),
  }),
);

export const kycVerificationsRelations = relations(
  kycVerifications,
  ({ one }) => ({
    user: one(users, {
      fields: [kycVerifications.userId],
      references: [users.id],
    }),
  }),
);

export const appSettings = pgTable(
  "app_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull().unique(),
    value: text("value").notNull(),
    isSecret: boolean("is_secret").notNull().default(false),
    description: text("description"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    keyIdx: index("app_settings_key_idx").on(table.key),
  }),
);

export const reviewReplies = pgTable(
  "review_replies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reviewId: uuid("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    reviewIdIdx: index("review_replies_review_id_idx").on(table.reviewId),
    userIdIdx: index("review_replies_user_id_idx").on(table.userId),
  }),
);

export const reviewRepliesRelations = relations(reviewReplies, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewReplies.reviewId],
    references: [reviews.id],
  }),
  user: one(users, {
    fields: [reviewReplies.userId],
    references: [users.id],
  }),
}));

export const propertyRatings = pgTable(
  "property_ratings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    averageRating: numeric("average_rating", { precision: 3, scale: 2 })
      .notNull()
      .default("0"),
    totalReviews: integer("total_reviews").notNull().default(0),
    cleanliness: numeric("cleanliness", { precision: 3, scale: 2 })
      .notNull()
      .default("0"),
    security: numeric("security", { precision: 3, scale: 2 })
      .notNull()
      .default("0"),
    accuracy: numeric("accuracy", { precision: 3, scale: 2 })
      .notNull()
      .default("0"),
    communication: numeric("communication", { precision: 3, scale: 2 })
      .notNull()
      .default("0"),
    valueForMoney: numeric("value_for_money", { precision: 3, scale: 2 })
      .notNull()
      .default("0"),
    ratingDistribution: jsonb("rating_distribution")
      .$type<Record<number, number>>()
      .default({}),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    propertyIdIdx: unique("property_ratings_property_id_unique").on(
      table.propertyId,
    ),
  }),
);

export const propertyRatingsRelations = relations(
  propertyRatings,
  ({ one }) => ({
    property: one(properties, {
      fields: [propertyRatings.propertyId],
      references: [properties.id],
    }),
  }),
);

export const userContracts = pgTable(
  "user_contracts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    contractUrl: text("contract_url").notNull(),
    status: text("contract_status", {
      enum: ["draft", "generated", "signed", "expired"],
    })
      .notNull()
      .default("generated"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("user_contracts_user_id_idx").on(table.userId),
    bookingIdIdx: index("user_contracts_booking_id_idx").on(table.bookingId),
    propertyIdIdx: index("user_contracts_property_id_idx").on(table.propertyId),
  }),
);

export const userContractsRelations = relations(userContracts, ({ one }) => ({
  user: one(users, {
    fields: [userContracts.userId],
    references: [users.id],
  }),
  booking: one(bookings, {
    fields: [userContracts.bookingId],
    references: [bookings.id],
  }),
  property: one(properties, {
    fields: [userContracts.propertyId],
    references: [properties.id],
  }),
}));

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  user: one(users, {
    fields: [wishlists.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [wishlists.propertyId],
    references: [properties.id],
  }),
}));

export const feedbacks = pgTable(
  "feedbacks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: text("category", {
      enum: ["bug", "feature", "improvement", "other"],
    }).notNull(),
    message: text("message").notNull(),
    rating: integer("rating"),
    status: text("status", { enum: ["pending", "reviewed", "resolved"] })
      .notNull()
      .default("pending"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("feedbacks_user_id_idx").on(table.userId),
    categoryIdx: index("feedbacks_category_idx").on(table.category),
    statusIdx: index("feedbacks_status_idx").on(table.status),
  }),
);

export const feedbacksRelations = relations(feedbacks, ({ one }) => ({
  user: one(users, {
    fields: [feedbacks.userId],
    references: [users.id],
  }),
}));

export const notificationSettings = pgTable(
  "notification_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    resendApiKey: text("resend_api_key"),
    resendFromEmail: text("resend_from_email"),
    metaAccessToken: text("meta_access_token"),
    metaPhoneNumberId: text("meta_phone_number_id"),
    metaMaintenanceCreatedTemplate: text("meta_maintenance_created_template"),
    metaMaintenanceUpdatedTemplate: text("meta_maintenance_updated_template"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    createdAtIdx: index("notification_settings_created_at_idx").on(
      table.createdAt,
    ),
  }),
);

export const notificationSettingsRelations = relations(
  notificationSettings,
  ({ one }) => ({
    user: one(users, {
      fields: [notificationSettings.id],
      references: [users.id],
    }),
  }),
);

export const loyaltyPointsRelations = relations(loyaltyPoints, ({ one }) => ({
  user: one(users, {
    fields: [loyaltyPoints.userId],
    references: [users.id],
  }),
}));

export const groupBookingsRelations = relations(
  groupBookings,
  ({ one, many }) => ({
    leadUser: one(users, {
      fields: [groupBookings.leadUserId],
      references: [users.id],
    }),
    property: one(properties, {
      fields: [groupBookings.propertyId],
      references: [properties.id],
    }),
    unit: one(units, {
      fields: [groupBookings.unitId],
      references: [units.id],
    }),
    members: many(groupBookingMembers),
  }),
);

export const groupBookingMembersRelations = relations(
  groupBookingMembers,
  ({ one }) => ({
    groupBooking: one(groupBookings, {
      fields: [groupBookingMembers.groupBookingId],
      references: [groupBookings.id],
    }),
    user: one(users, {
      fields: [groupBookingMembers.userId],
      references: [users.id],
    }),
  }),
);

export const roommatePreferencesRelations = relations(
  roommatePreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [roommatePreferences.userId],
      references: [users.id],
    }),
  }),
);

export const seasonalPricingRulesRelations = relations(
  seasonalPricingRules,
  ({ one, many }) => ({
    property: one(properties, {
      fields: [seasonalPricingRules.propertyId],
      references: [properties.id],
    }),
    unit: one(units, {
      fields: [seasonalPricingRules.unitId],
      references: [units.id],
    }),
    suggestions: many(pricingSuggestions),
  }),
);

export const pricingAnalyticsRelations = relations(
  pricingAnalytics,
  ({ one }) => ({
    property: one(properties, {
      fields: [pricingAnalytics.propertyId],
      references: [properties.id],
    }),
  }),
);

export const pricingSuggestionsRelations = relations(
  pricingSuggestions,
  ({ one }) => ({
    property: one(properties, {
      fields: [pricingSuggestions.propertyId],
      references: [properties.id],
    }),
    rule: one(seasonalPricingRules, {
      fields: [pricingSuggestions.ruleId],
      references: [seasonalPricingRules.id],
    }),
  }),
);

export const inspectionsRelations = relations(inspections, ({ one, many }) => ({
  booking: one(bookings, {
    fields: [inspections.bookingId],
    references: [bookings.id],
  }),
  property: one(properties, {
    fields: [inspections.propertyId],
    references: [properties.id],
  }),
  unit: one(units, {
    fields: [inspections.unitId],
    references: [units.id],
  }),
  performedByUser: one(users, {
    fields: [inspections.performedBy],
    references: [users.id],
    relationName: "performedBy",
  }),
  witness: one(users, {
    fields: [inspections.witnessId],
    references: [users.id],
  }),
  items: many(inspectionItems),
  photos: many(inspectionPhotos),
  damageReports: many(damageReports),
}));

export const inspectionItemsRelations = relations(
  inspectionItems,
  ({ one, many }) => ({
    inspection: one(inspections, {
      fields: [inspectionItems.inspectionId],
      references: [inspections.id],
    }),
    photos: many(inspectionPhotos),
    damageReports: many(damageReports),
  }),
);

export const inspectionPhotosRelations = relations(
  inspectionPhotos,
  ({ one }) => ({
    inspection: one(inspections, {
      fields: [inspectionPhotos.inspectionId],
      references: [inspections.id],
    }),
    item: one(inspectionItems, {
      fields: [inspectionPhotos.itemId],
      references: [inspectionItems.id],
    }),
  }),
);

export const damageReportsRelations = relations(damageReports, ({ one }) => ({
  inspection: one(inspections, {
    fields: [damageReports.inspectionId],
    references: [inspections.id],
  }),
  item: one(inspectionItems, {
    fields: [damageReports.itemId],
    references: [inspectionItems.id],
  }),
  reportedByUser: one(users, {
    fields: [damageReports.reportedBy],
    references: [users.id],
    relationName: "reportedBy",
  }),
  resolvedByUser: one(users, {
    fields: [damageReports.resolvedBy],
    references: [users.id],
    relationName: "resolvedBy",
  }),
}));

export const inspectionTemplatesRelations = relations(
  inspectionTemplates,
  () => ({}),
);

export const propertyComparisonsRelations = relations(
  propertyComparisons,
  ({ one }) => ({
    user: one(users, {
      fields: [propertyComparisons.userId],
      references: [users.id],
    }),
  }),
);

export const neighborhoodInsightsRelations = relations(
  neighborhoodInsights,
  ({ one }) => ({
    property: one(properties, {
      fields: [neighborhoodInsights.propertyId],
      references: [properties.id],
    }),
    submittedByUser: one(users, {
      fields: [neighborhoodInsights.submittedBy],
      references: [users.id],
      relationName: "submittedBy",
    }),
  }),
);

export const neighborhoodPlacesRelations = relations(
  neighborhoodPlaces,
  ({ one }) => ({
    property: one(properties, {
      fields: [neighborhoodPlaces.propertyId],
      references: [properties.id],
    }),
  }),
);

export const referrals = pgTable(
  "referrals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    referrerId: uuid("referrer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    refereeId: uuid("referee_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    code: text("code").notNull(),
    category: text("category", { enum: ["owner", "tenant"] })
      .notNull()
      .default("tenant"),
    status: text("status", {
      enum: [
        "pending",
        "verifying",
        "eligible",
        "failed",
        "completed",
        "cancelled",
      ],
    })
      .notNull()
      .default("pending"),
    propertyId: uuid("property_id").references(() => properties.id),
    baseAmount: numeric("base_amount", { precision: 12, scale: 2 }).default(
      "0",
    ),
    commissionRate: numeric("commission_rate", {
      precision: 5,
      scale: 2,
    }).default("0"),
    commissionAmount: numeric("commission_amount", {
      precision: 12,
      scale: 2,
    }).default("0"),
    refereeTransactionId: uuid("referee_transaction_id"),
    eligibleAt: timestamp("eligible_at", { mode: "date" }),
    payoutScheduledAt: timestamp("payout_scheduled_at", { mode: "date" }),
    voucherCode: text("voucher_code"),
    offsetApplied: boolean("offset_applied").default(false),
    tier: integer("tier").default(1),
    metadata: jsonb("metadata").default({}),
    completedAt: timestamp("completed_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    referrerIdx: index("referrals_referrer_id_idx").on(table.referrerId),
    refereeIdx: index("referrals_referee_id_idx").on(table.refereeId),
    codeIdx: uniqueIndex("referrals_code_idx").on(table.code),
  }),
);

export const loyaltyTransactions = pgTable(
  "loyalty_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    type: text("type", {
      enum: ["earn", "redeem", "expire", "bonus"],
    }).notNull(),
    description: text("description").notNull(),
    referenceId: uuid("reference_id"),
    referenceType: text("reference_type"),
    expiresAt: timestamp("expires_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("loyalty_transactions_user_id_idx").on(table.userId),
  }),
);

export const rewards = pgTable("rewards", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  pointsCost: integer("points_cost").notNull(),
  value: numeric("value", { precision: 12, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const rewardRedemptions = pgTable(
  "reward_redemptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rewardId: uuid("reward_id")
      .notNull()
      .references(() => rewards.id, { onDelete: "cascade" }),
    pointsUsed: integer("points_used").notNull(),
    status: text("status", { enum: ["pending", "completed", "cancelled"] })
      .notNull()
      .default("pending"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("reward_redemptions_user_id_idx").on(table.userId),
  }),
);

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: "referrer",
  }),
  referee: one(users, {
    fields: [referrals.refereeId],
    references: [users.id],
    relationName: "referee",
  }),
  property: one(properties, {
    fields: [referrals.propertyId],
    references: [properties.id],
  }),
}));

export const loyaltyTransactionsRelations = relations(
  loyaltyTransactions,
  ({ one }) => ({
    user: one(users, {
      fields: [loyaltyTransactions.userId],
      references: [users.id],
    }),
  }),
);

export const rewardsRelations = relations(rewards, () => ({}));

export const rewardRedemptionsRelations = relations(
  rewardRedemptions,
  ({ one }) => ({
    user: one(users, {
      fields: [rewardRedemptions.userId],
      references: [users.id],
    }),
    reward: one(rewards, {
      fields: [rewardRedemptions.rewardId],
      references: [rewards.id],
    }),
  }),
);

export const userNotificationPreferencesRelations = relations(
  userNotificationPreferences,
  ({ one }) => ({
  user: one(users, {
    fields: [userNotificationPreferences.userId],
    references: [users.id],
  }),
}),
);

export const adType = ["kos", "kontrakan", "apartemen", "rumah"] as const;
export const adTier = ["reguler", "utama", "premium"] as const;
export const adPaymentStatus = ["pending", "paid", "rejected", "expired", "cancelled"] as const;
export const positionType = ["rotation", "fixed_1", "fixed_2"] as const;

export const propertyAds = pgTable(
  "property_ads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyId: uuid("property_id").references(() => properties.id, {
      onDelete: "set null",
    }),
    packageId: uuid("package_id").references(() => adPackages.id, {
      onDelete: "set null",
    }),
    advertiserName: text("advertiser_name").notNull(),
    advertiserPhone: text("advertiser_phone").notNull(),
    advertiserWhatsApp: text("advertiser_whatsapp"),
    title: text("title").notNull(),
    description: text("description").notNull(),
    imageUrl: text("image_url").notNull(),
    targetUrl: text("target_url"),
    location: text("location").notNull(),
    price: text("price"),
    type: text("type", { enum: adType }).notNull(),
    position: integer("position").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    clicks: integer("clicks").notNull().default(0),
    impressions: integer("impressions").notNull().default(0),
    startDate: timestamp("start_date", { mode: "date" }).notNull().defaultNow(),
    endDate: timestamp("end_date", { mode: "date" }),
    paymentStatus: text("payment_status", { enum: adPaymentStatus }).notNull().default("pending"),
    paidAt: timestamp("paid_at", { mode: "date" }),
    adminNote: text("admin_note"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    activeIdx: index("idx_property_ads_active").on(table.isActive),
    datesIdx: index("idx_property_ads_dates").on(table.startDate, table.endDate),
    positionIdx: index("idx_property_ads_position").on(table.position),
    paymentStatusIdx: index("idx_property_ads_payment_status").on(table.paymentStatus),
    paidAtIdx: index("idx_property_ads_paid_at").on(table.paidAt),
    packageIdIdx: index("idx_property_ads_package_id").on(table.packageId),
  }),
);

export const propertyAdsRelations = relations(propertyAds, ({ one }) => ({
  property: one(properties, {
    fields: [propertyAds.propertyId],
    references: [properties.id],
  }),
  package: one(adPackages, {
    fields: [propertyAds.packageId],
    references: [adPackages.id],
  }),
}));

export const adPackages = pgTable(
  "ad_packages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    label: text("label").notNull(),
    tier: text("tier", { enum: adTier }).notNull(),
    duration: integer("duration").notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    positionType: text("position_type", { enum: positionType }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    tierIdx: index("idx_ad_packages_tier").on(table.tier),
    activeIdx: index("idx_ad_packages_active").on(table.isActive),
  }),
);

export const adPackagesRelations = relations(adPackages, ({ one }) => ({
  ads: one(propertyAds),
}));

export const featureFlags = pgTable(
  "feature_flags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    enabled: boolean("enabled").notNull().default(false),
    rolloutPercentage: integer("rollout_percentage").notNull().default(100),
    allowedRoles: text().array().notNull().default([]),
    allowedUsers: uuid().array().notNull().default([]),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    keyIdx: uniqueIndex("feature_flags_key_idx").on(table.key),
  }),
);

export const featureFlagsRelations = relations(featureFlags, () => ({
  // Placeholder for future relations if needed.
}));

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type NewFeatureFlag = typeof featureFlags.$inferInsert;
