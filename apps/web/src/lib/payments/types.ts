/**
 * Tipe-tipe pembayaran. Di-export dari sini untuk backward compatibility.
 * Definisi asli sekarang ada di @/types/payment.
 */

export type {
  PaymentProviderName,
  PaymentPurpose,
  WebhookPaymentStatus,
  CreatePaymentInput,
  CreatePaymentResult,
  WebhookContext,
  NormalizedWebhook,
  PaymentProviderAdapter,
} from "@/types/payment";
