/**
 * Tipe-tipe pembayaran dan pembayaran gerbang.
 */

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

export type GatewayProvider = "doku" | "ipaymu" | "nicepay" | "otto";

export interface GatewayConfig {
  clientId?: string;
  secretKey?: string;
  webhookSecret?: string;
  merchantCode?: string;
  baseUrl?: string;
}

export interface PaymentItemDetail {
  name: string;
  quantity: number;
  price: number;
}

export interface PaymentRequest {
  invoiceNumber: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  itemDetails: PaymentItemDetail[];
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  message?: string;
  rawResponse?: Record<string, unknown>;
}

export type PaymentGatewayConfigData = Record<string, unknown>;

export interface EncryptedConfig {
  __encrypted: true;
  version: 1;
  iv: string;
  tag: string;
  data: string;
}

export type ReceiptData = {
  paymentId: string;
  provider: PaymentProviderName;
  amount: number;
  currency: string;
  status: WebhookPaymentStatus;
  paymentPurpose: PaymentPurpose;
  createdAt: string;
  unitInfo: {
    unitName: string;
    propertyName: string;
  };
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
};
