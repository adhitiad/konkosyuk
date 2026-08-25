export type PaymentProviderName = "doku" | "ipaymu" | "nicepay" | "otto" | "mock";
export type PaymentPurpose = "dp" | "full_payment" | "featured_listing";
export type WebhookPaymentStatus = "success" | "failed" | "expired" | "pending";

export interface CreatePaymentInput {
  bookingId: string;
  provider: PaymentProviderName;
  purpose: PaymentPurpose;
  amount: number;
  currency?: string;
  expiresIn?: number;
  metadata?: Record<string, unknown>;
}

export interface CreatePaymentResult {
  paymentId: string;
  transactionId?: string;
  redirectUrl?: string;
  qrCode?: string;
  vaNumber?: string;
  expiresAt?: Date;
  rawResponse: Record<string, unknown>;
}

export interface WebhookContext {
  provider: PaymentProviderName;
  headers: Headers;
  rawBody: string;
  eventId?: string;
}

export interface NormalizedWebhook {
  provider: PaymentProviderName;
  eventId: string;
  transactionId: string;
  status: WebhookPaymentStatus;
  amount: number;
  currency: string;
  paidAt?: Date;
  metadata: Record<string, unknown>;
}

export interface PaymentProviderAdapter {
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  getPaymentStatus(transactionId: string): Promise<WebhookPaymentStatus>;
  verifyWebhookSignature(context: WebhookContext): Promise<boolean>;
  normalizeWebhook(context: WebhookContext): Promise<NormalizedWebhook>;
}
