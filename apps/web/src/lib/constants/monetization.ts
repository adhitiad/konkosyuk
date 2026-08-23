export const DEFAULT_PLATFORM_FEE_PERCENT = 1.8; // 1.8%
export const MIN_PLATFORM_FEE_PERCENT = 0; // Freemium = 0%
export const MAX_PLATFORM_FEE_PERCENT = 10; // Maksimal 10%
export const DEFAULT_FEATURED_PRICE = 50000; // Rp 50.000 per properti
export const DEFAULT_FEATURED_DURATION_DAYS = 7; // 7 hari
export const DEFAULT_FEATURED_MAX_PER_DAY = 10; // Maksimal 10 featured listing per hari
export const CURRENCY = "IDR" as const;
export const PAYMENT_PROVIDERS = ["doku", "ipaymu", "nicepay"] as const;
export const PAYMENT_PURPOSES = [
  "dp",
  "full_payment",
  "featured_listing",
] as const;
export const PAYMENT_STATUSES = [
  "pending",
  "success",
  "failed",
  "expired",
  "refunded",
] as const;
export const BALANCE_LOG_TYPES = [
  "refund",
  "withdrawal",
  "topup",
  "fee",
] as const;
