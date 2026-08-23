export const USER_ROLES = ["cust", "owner", "admin", "staff"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PROPERTY_TYPES = ["kost", "kontrakan", "apartemen", "rumah", "ruko"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const UNIT_STATUSES = ["available", "booked", "maintenance"] as const;
export type UnitStatus = (typeof UNIT_STATUSES)[number];

export const BOOKING_TYPES = ["instant", "request"] as const;
export type BookingType = (typeof BOOKING_TYPES)[number];

export const BOOKING_REQUEST_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "paid",
  "cancelled",
] as const;
export type BookingRequestStatus = (typeof BOOKING_REQUEST_STATUSES)[number];

export const BOOKING_STATUSES = [
  "pending_dp",
  "awaiting_owner_approval",
  "awaiting_full_payment",
  "confirmed",
  "completed",
  "rejected",
  "cancelled",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const REVIEW_TYPES = ["tenant", "property"] as const;
export type ReviewType = (typeof REVIEW_TYPES)[number];

export const NOTIFICATION_TYPES = [
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
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_CATEGORIES = [
  "booking",
  "payment",
  "maintenance",
  "inspection",
  "chat",
  "review",
  "system",
] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const NOTIFICATION_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

export const MAINTENANCE_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type MaintenancePriority = (typeof MAINTENANCE_PRIORITIES)[number];

export const MAINTENANCE_STATUSES = ["reported", "in_progress", "resolved", "cancelled"] as const;
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

export const MAINTENANCE_REPORT_CATEGORIES = [
  "air",
  "listrik",
  "kunci_pintu",
  "ac",
  "furniture",
  "lainnya",
] as const;
export type MaintenanceReportCategory = (typeof MAINTENANCE_REPORT_CATEGORIES)[number];

export const MAINTENANCE_REPORT_STATUSES = [
  "pending",
  "in_progress",
  "resolved",
  "rejected",
] as const;
export type MaintenanceReportStatus = (typeof MAINTENANCE_REPORT_STATUSES)[number];

export const KYC_VERIFICATION_STATUSES = ["pending", "approved", "rejected", "expired"] as const;
export type KycVerificationStatus = (typeof KYC_VERIFICATION_STATUSES)[number];

export const KYC_DOCUMENT_TYPES = ["ktp", "passport", "driving_license"] as const;
export type KycDocumentType = (typeof KYC_DOCUMENT_TYPES)[number];

export const PAYMENT_PROVIDERS = ["doku", "ipaymu", "nicepay", "mock"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PAYMENT_PURPOSES = ["dp", "full_payment", "featured_listing"] as const;
export type PaymentPurpose = (typeof PAYMENT_PURPOSES)[number];

export const PAYMENT_STATUSES = ["pending", "success", "failed", "expired", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_TRANSACTION_STATUSES = ["pending", "success", "failed", "expired", "refunded"] as const;
export type PaymentTransactionStatus = (typeof PAYMENT_TRANSACTION_STATUSES)[number];

export const KYC_STATUSES = ["none", "pending", "verified", "rejected"] as const;
export type KycStatus = (typeof KYC_STATUSES)[number];

export const BANK_ACCOUNT_TYPES = ["bank", "ewallet"] as const;
export type BankAccountType = (typeof BANK_ACCOUNT_TYPES)[number];

export const WITHDRAWAL_STATUSES = ["pending", "processing", "success", "rejected"] as const;
export type WithdrawalStatus = (typeof WITHDRAWAL_STATUSES)[number];

export const GATEWAY_ENVIRONMENTS = ["sandbox", "production"] as const;
export type GatewayEnvironment = (typeof GATEWAY_ENVIRONMENTS)[number];

export const ACCOUNT_TYPES = ["asset", "liability", "equity", "revenue", "expense"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const LEDGER_REFERENCE_TYPES = ["payment", "withdrawal", "fee", "refund", "adjustment"] as const;
export type LedgerReferenceType = (typeof LEDGER_REFERENCE_TYPES)[number];

export const LOYALTY_TIERS = ["bronze", "silver", "gold", "platinum"] as const;
export type LoyaltyTier = (typeof LOYALTY_TIERS)[number];

export const SEASONAL_RULE_TYPES = ["percentage", "fixed", "multiplier"] as const;
export type SeasonalRuleType = (typeof SEASONAL_RULE_TYPES)[number];

export const INSPECTION_STATUSES = ["pending", "move_in_done", "move_out_done", "completed"] as const;
export type InspectionStatus = (typeof INSPECTION_STATUSES)[number];

export const INSPECTION_INSTANCE_STATUSES = ["pending", "in_progress", "completed", "disputed"] as const;
export type InspectionInstanceStatus = (typeof INSPECTION_INSTANCE_STATUSES)[number];

export const PROPERTY_STATUSES = ["aktif", "nonaktif"] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const REFERRAL_STATUSES = [
  "pending",
  "verifying",
  "eligible",
  "failed",
  "completed",
  "cancelled",
] as const;
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number];

export const REFERRAL_CATEGORIES = ["owner", "tenant"] as const;
export type ReferralCategory = (typeof REFERRAL_CATEGORIES)[number];

export const LOYALTY_TRANSACTION_TYPES = ["earn", "redeem", "expire", "bonus"] as const;
export type LoyaltyTransactionType = (typeof LOYALTY_TRANSACTION_TYPES)[number];

export const GROUP_BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "completed"] as const;
export type GroupBookingStatus = (typeof GROUP_BOOKING_STATUSES)[number];
