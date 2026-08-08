import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  boolean,
  index,
  unique,
  numeric,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { PropertyPackages } from "@/lib/types/property-packages";

export const userRole = ["cust", "owner", "admin", "staff"] as const;
export const propertyType = ["kost", "kontrakan"] as const;
export const unitStatus = ["available", "booked", "maintenance"] as const;
export const bookingType = ["instant", "request"] as const;
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
export const notificationType = ["booking", "payment", "system"] as const;
export const maintenancePriority = ["low", "medium", "high", "urgent"] as const;
export const maintenanceStatus = ["reported", "in_progress", "resolved", "cancelled"] as const;
export const paymentProvider = ["doku", "ipaymu", "nicepay"] as const;
export const paymentPurpose = ["dp", "full_payment", "featured_listing"] as const;
export const paymentStatus = [
  "pending",
  "success",
  "failed",
  "expired",
  "refunded",
] as const;
export const kycStatus = ["none", "pending", "verified", "rejected"] as const;
export const bankAccountType = ["bank", "ewallet"] as const;
export const withdrawalStatus = ["pending", "processing", "success", "rejected"] as const;

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    name: text("name").notNull(),
    image: text("image"),
    phone: text("phone"),
    whatsapp: text("whatsapp"),
    telegram: text("telegram"),
    role: text("role", { enum: userRole }).notNull().default("cust"),
    isActive: boolean("is_active").notNull().default(true),
    kycStatus: text("kyc_status", { enum: kycStatus }).notNull().default("none"),
    ktpNumber: text("ktp_number"),
    ktpImageUrl: text("ktp_image_url"),
    reputationScore: numeric("reputation_score", { precision: 4, scale: 2 }).notNull().default("0.00"),
    balance: numeric("balance", { precision: 12, scale: 2 }).notNull().default("0.00"),
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
    accountTypeIdx: index("owner_bank_accounts_account_type_idx").on(table.accountType),
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
    status: text("status", { enum: withdrawalStatus }).notNull().default("pending"),
    adminNote: text("admin_note"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    ownerIdIdx: index("withdrawals_owner_id_idx").on(table.ownerId),
    statusIdx: index("withdrawals_status_idx").on(table.status),
    bankAccountIdIdx: index("withdrawals_bank_account_id_idx").on(table.bankAccountId),
  }),
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
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
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
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
    id: text("id").primaryKey(),
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

export const propertyStatus = ["aktif", "nonaktif"] as const;

export const platformSettings = pgTable("platform_settings", {
  id: text("id").primaryKey().default("default"),
  platformFeePercent: numeric("platform_fee_percent", { precision: 5, scale: 2 }).default("1.8"),
  featuredListingPrice: numeric("featured_listing_price", { precision: 12, scale: 2 }).default("50000"),
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
    type: text("type", { enum: propertyType }).notNull(),
    basePrice: text("base_price"),
    packages: jsonb("packages").$type<PropertyPackages>().notNull().default({
      predefined: [],
      custom: {
        enabled: false,
        label: 'Custom Duration',
        unit: 'days',
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
    featuredUntil: timestamp("featured_until"),
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
    amenitiesGinIdx: index("properties_amenities_gin_idx").using("gin", table.amenities),
    metadataGinIdx: index("properties_metadata_gin_idx").using("gin", table.metadata),
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
    price: text("price").notNull(),
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
    propertyNameUnique: unique("units_property_id_name_unique").on(table.propertyId, table.name),
  }),
);

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
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("bookings_user_id_idx").on(table.userId),
    propertyIdIdx: index("bookings_property_id_idx").on(table.propertyId),
    unitIdIdx: index("bookings_unit_id_idx").on(table.unitId),
    statusIdx: index("bookings_status_idx").on(table.status),
  }),
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .references(() => properties.id, { onDelete: "cascade" }),
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

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: text("provider").notNull(),
    eventId: text("event_id").notNull(),
    eventType: text("event_type"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    signatureValid: boolean("signature_valid").default(false),
    processedAt: timestamp("processed_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    providerEventIdIdx: unique("webhook_events_provider_event_id_unique").on(
      table.provider,
      table.eventId,
    ),
    providerIdx: index("webhook_events_provider_idx").on(table.provider),
  }),
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reviewedUserId: uuid("reviewed_user_id").references(() => users.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }),
    type: text("type", { enum: reviewType }).notNull(),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => ({
    reviewerIdIdx: index("reviews_reviewer_id_idx").on(table.reviewerId),
    reviewedUserIdIdx: index("reviews_reviewed_user_id_idx").on(table.reviewedUserId),
    propertyIdIdx: index("reviews_property_id_idx").on(table.propertyId),
    bookingIdIdx: index("reviews_booking_id_idx").on(table.bookingId),
    typeIdx: index("reviews_type_idx").on(table.type),
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
    userPropertyUnique: unique("favorites_user_property_unique").on(table.userId, table.propertyId),
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
    endpointIdx: index("push_subscriptions_endpoint_idx").on(table.endpoint),
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
    priority: text("priority", { enum: maintenancePriority }).notNull().default("medium"),
    status: text("status", { enum: maintenanceStatus }).notNull().default("reported"),
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
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type Favorite = typeof favorites.$inferSelect;
export type NewFavorite = typeof favorites.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
export type MaintenanceTicket = typeof maintenanceTickets.$inferSelect;
export type NewMaintenanceTicket = typeof maintenanceTickets.$inferInsert;
export type OwnerBankAccount = typeof ownerBankAccounts.$inferSelect;
export type NewOwnerBankAccount = typeof ownerBankAccounts.$inferInsert;
export type BalanceLog = typeof balanceLogs.$inferSelect;
export type NewBalanceLog = typeof balanceLogs.$inferInsert;
export type PlatformSetting = typeof platformSettings.$inferSelect;
export type NewPlatformSetting = typeof platformSettings.$inferInsert;

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  properties: many(properties),
  bookings: many(bookings),
  reviewsGiven: many(reviews, { relationName: "reviewer" }),
  reviewsReceived: many(reviews, { relationName: "reviewedUser" }),
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

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, {
    fields: [properties.ownerId],
    references: [users.id],
  }),
  units: many(units),
  bookings: many(bookings),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  property: one(properties, {
    fields: [units.propertyId],
    references: [properties.id],
  }),
  bookings: many(bookings),
}));

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
  reviewer: one(users, {
    fields: [reviews.reviewerId],
    references: [users.id],
    relationName: "reviewer",
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

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));

export const maintenanceTicketsRelations = relations(maintenanceTickets, ({ one }) => ({
  unit: one(units, {
    fields: [maintenanceTickets.unitId],
    references: [units.id],
  }),
  tenant: one(users, {
    fields: [maintenanceTickets.tenantId],
    references: [users.id],
  }),
}));
