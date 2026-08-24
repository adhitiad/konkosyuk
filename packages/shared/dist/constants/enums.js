export const USER_ROLES = ["cust", "owner", "admin", "staff"];
export const PROPERTY_TYPES = ["kost", "kontrakan", "apartemen", "rumah", "ruko"];
export const UNIT_STATUSES = ["available", "booked", "maintenance"];
export const BOOKING_TYPES = ["instant", "request"];
export const BOOKING_REQUEST_STATUSES = [
    "pending",
    "approved",
    "rejected",
    "paid",
    "cancelled",
];
export const BOOKING_STATUSES = [
    "pending_dp",
    "awaiting_owner_approval",
    "awaiting_full_payment",
    "confirmed",
    "completed",
    "rejected",
    "cancelled",
];
export const REVIEW_TYPES = ["tenant", "property"];
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
];
export const NOTIFICATION_CATEGORIES = [
    "booking",
    "payment",
    "maintenance",
    "inspection",
    "chat",
    "review",
    "system",
];
export const NOTIFICATION_PRIORITIES = ["low", "normal", "high", "urgent"];
export const MAINTENANCE_PRIORITIES = ["low", "medium", "high", "urgent"];
export const MAINTENANCE_STATUSES = ["reported", "in_progress", "resolved", "cancelled"];
export const MAINTENANCE_REPORT_CATEGORIES = [
    "air",
    "listrik",
    "kunci_pintu",
    "ac",
    "furniture",
    "lainnya",
];
export const MAINTENANCE_REPORT_STATUSES = [
    "pending",
    "in_progress",
    "resolved",
    "rejected",
];
export const KYC_VERIFICATION_STATUSES = ["pending", "approved", "rejected", "expired"];
export const KYC_DOCUMENT_TYPES = ["ktp", "passport", "driving_license"];
export const PAYMENT_PROVIDERS = ["doku", "ipaymu", "nicepay", "mock"];
export const PAYMENT_PURPOSES = ["dp", "full_payment", "featured_listing"];
export const PAYMENT_STATUSES = ["pending", "success", "failed", "expired", "refunded"];
export const PAYMENT_TRANSACTION_STATUSES = ["pending", "success", "failed", "expired", "refunded"];
export const KYC_STATUSES = ["none", "pending", "verified", "rejected"];
export const BANK_ACCOUNT_TYPES = ["bank", "ewallet"];
export const WITHDRAWAL_STATUSES = ["pending", "processing", "success", "rejected"];
export const GATEWAY_ENVIRONMENTS = ["sandbox", "production"];
export const ACCOUNT_TYPES = ["asset", "liability", "equity", "revenue", "expense"];
export const LEDGER_REFERENCE_TYPES = ["payment", "withdrawal", "fee", "refund", "adjustment"];
export const LOYALTY_TIERS = ["bronze", "silver", "gold", "platinum"];
export const SEASONAL_RULE_TYPES = ["percentage", "fixed", "multiplier"];
export const INSPECTION_STATUSES = ["pending", "move_in_done", "move_out_done", "completed"];
export const INSPECTION_INSTANCE_STATUSES = ["pending", "in_progress", "completed", "disputed"];
export const PROPERTY_STATUSES = ["aktif", "nonaktif"];
export const REFERRAL_STATUSES = [
    "pending",
    "verifying",
    "eligible",
    "failed",
    "completed",
    "cancelled",
];
export const REFERRAL_CATEGORIES = ["owner", "tenant"];
export const LOYALTY_TRANSACTION_TYPES = ["earn", "redeem", "expire", "bonus"];
export const GROUP_BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "completed"];
