import axios from "axios";
import { generateSha256Signature, verifySignature } from "./signature";
import { normalizeGatewayStatus } from "./status";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  WebhookContext,
  NormalizedWebhook,
  PaymentProviderAdapter,
} from "./types";
import type { WebhookPaymentStatus } from "./types";
import { getNicepayConfig } from "./config";

function toIntegerAmount(amount: number): number {
  return Math.round(amount);
}

async function getConfig() {
  const config = await getNicepayConfig();
  return {
    baseUrl: String(config.baseUrl ?? ""),
    merchantId: String(config.clientId ?? ""),
    merchantKey: String(config.secretKey ?? ""),
    webhookSecret: config.webhookSecret ? String(config.webhookSecret) : "",
  };
}

export const nicepayAdapter: PaymentProviderAdapter = {
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const { baseUrl, merchantId, merchantKey } = await getConfig();
    if (!baseUrl || !merchantId || !merchantKey) {
      throw new Error("Nicepay credentials not configured");
    }

    const orderId = input.bookingId;
    const integerAmount = toIntegerAmount(input.amount);
    const signature = generateSha256Signature(
      `${merchantId}${orderId}${integerAmount}${merchantKey}`,
      merchantKey,
    );

    const response = await axios.post(
      `${baseUrl}/api/v1/payment`,
      {
        merchantId,
        orderId,
        amount: integerAmount,
        paymentMethod: input.metadata?.paymentMethod as string | undefined,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL_SECONDARY || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/nicepay`,
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL_SECONDARY || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/payment/result?provider=nicepay&bookingId=${orderId}`,
        expiredIn: input.expiresIn ? String(input.expiresIn) : undefined,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Nicepay-Merchant-Id": merchantId,
          "X-Nicepay-Signature": signature,
        },
      },
    );

    if (response.status >= 400) {
      throw new Error(
        `Nicepay payment failed: ${response.status} ${response.data}`,
      );
    }

    const raw = response.data as Record<string, unknown>;

    return {
      paymentId: String(raw.payment_id ?? raw.id ?? crypto.randomUUID()),
      transactionId: raw.transaction_id
        ? String(raw.transaction_id)
        : undefined,
      redirectUrl: raw.redirect_url ? String(raw.redirect_url) : undefined,
      qrCode: raw.qr_code ? String(raw.qr_code) : undefined,
      vaNumber: raw.va_number ? String(raw.va_number) : undefined,
      expiresAt: raw.expires_at
        ? new Date(raw.expires_at as string)
        : undefined,
      rawResponse: raw,
    };
  },

  async getPaymentStatus(transactionId: string): Promise<WebhookPaymentStatus> {
    const { baseUrl, merchantId, merchantKey } = await getConfig();
    if (!baseUrl || !merchantId || !merchantKey) {
      throw new Error("Nicepay credentials not configured");
    }

    const signature = generateSha256Signature(
      `${merchantId}${transactionId}${merchantKey}`,
      merchantKey,
    );

    const response = await axios.get(
      `${baseUrl}/api/v1/payment/${encodeURIComponent(transactionId)}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Nicepay-Merchant-Id": merchantId,
          "X-Nicepay-Signature": signature,
        },
      },
    );

    if (response.status >= 400) {
      throw new Error(`Nicepay status check failed: ${response.status}`);
    }

    const raw = response.data as Record<string, unknown>;
    const status = String(raw.status ?? raw.transaction_status ?? "pending");

    return normalizeGatewayStatus(status);
  },

  async verifyWebhookSignature(context: WebhookContext): Promise<boolean> {
    const { webhookSecret } = await getConfig();
    if (!webhookSecret) return false;

    const signature = context.headers.get("x-nicepay-signature");
    return verifySignature(context.rawBody, signature, webhookSecret);
  },

  async normalizeWebhook(context: WebhookContext): Promise<NormalizedWebhook> {
    const raw = JSON.parse(context.rawBody) as Record<string, unknown>;
    const status = normalizeGatewayStatus(
      String(raw.status ?? raw.transaction_status ?? "pending"),
    );

    return {
      provider: "nicepay",
      eventId: context.eventId ?? crypto.randomUUID(),
      transactionId: String(raw.transaction_id ?? raw.orderId ?? ""),
      status,
      amount:
        typeof raw.amount === "number"
          ? raw.amount
          : parseFloat(String(raw.amount ?? 0)),
      currency: String(raw.currency ?? "IDR"),
      paidAt: raw.payment_time
        ? new Date(raw.payment_time as string)
        : undefined,
      metadata: raw,
    };
  },
};
