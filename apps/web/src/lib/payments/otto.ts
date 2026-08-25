import axios from "axios";
import { generateOttoSignature, verifySignature } from "./signature";
import { normalizeGatewayStatus } from "./status";
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  WebhookContext,
  NormalizedWebhook,
  PaymentProviderAdapter,
} from "./types";
import type { WebhookPaymentStatus } from "./types";
import { getOttoConfig } from "./config";

function toIntegerAmount(amount: number): number {
  return Math.round(amount);
}

function signReplaceAll(jsonStr: string): string {
  return jsonStr.replace(/\s+/g, "");
}

async function getConfig() {
  const config = await getOttoConfig();
  return {
    baseUrl: String(config.baseUrl ?? ""),
    clientId: String(config.clientId ?? ""),
    secretKey: String(config.secretKey ?? ""),
    webhookSecret: config.webhookSecret ? String(config.webhookSecret) : "",
  };
}

export const ottoAdapter: PaymentProviderAdapter = {
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const { baseUrl, clientId, secretKey } = await getConfig();
    if (!baseUrl || !secretKey) {
      throw new Error("Otto credentials not configured");
    }

    const invoiceNumber = input.bookingId;
    const integerAmount = toIntegerAmount(input.amount);
    const timestamp = String(Math.floor(Date.now() / 1000));

    const payload = {
      order_id: invoiceNumber,
      amount: integerAmount,
      payment_method: "0",
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL_SECONDARY || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/otto`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL_SECONDARY || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/payment/result?provider=otto&bookingId=${invoiceNumber}`,
      customer_name: input.metadata?.customerName ?? "Customer",
      customer_email: input.metadata?.email ?? "",
      timestamp,
    };

    const minifiedBody = signReplaceAll(JSON.stringify(payload));
    const signature = generateOttoSignature(minifiedBody, timestamp, secretKey);

    const response = await axios.post(
      `${baseUrl}/payment-services/v2.1.0/api/token`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Otto-Timestamp": timestamp,
          "X-Otto-Signature": signature,
          ...(clientId ? { "X-Otto-Client-Id": clientId } : {}),
        },
      },
    );

    if (response.status >= 400) {
      throw new Error(
        `Otto payment failed: ${response.status} ${response.data}`,
      );
    }

    const raw = response.data as Record<string, unknown>;

    return {
      paymentId: String(
        raw.payment_id ?? raw.id ?? raw.order_id ?? crypto.randomUUID(),
      ),
      transactionId: raw.transaction_id
        ? String(raw.transaction_id)
        : undefined,
      redirectUrl: raw.endpoint_url ? String(raw.endpoint_url) : undefined,
      qrCode: raw.qr_code ? String(raw.qr_code) : undefined,
      vaNumber: raw.va_number ? String(raw.va_number) : undefined,
      expiresAt: raw.expired_time
        ? new Date(raw.expired_time as string)
        : undefined,
      rawResponse: raw,
    };
  },

  async getPaymentStatus(transactionId: string): Promise<WebhookPaymentStatus> {
    const { baseUrl, clientId, secretKey } = await getConfig();
    if (!baseUrl || !secretKey) {
      throw new Error("Otto credentials not configured");
    }

    const timestamp = String(Math.floor(Date.now() / 1000));
    const payload = {
      transaction_id: transactionId,
      timestamp,
    };

    const minifiedBody = signReplaceAll(JSON.stringify(payload));
    const signature = generateOttoSignature(minifiedBody, timestamp, secretKey);

    const response = await axios.post(
      `${baseUrl}/sp/service/v3.0.0/api/checkstatus`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Otto-Timestamp": timestamp,
          "X-Otto-Signature": signature,
          ...(clientId ? { "X-Otto-Client-Id": clientId } : {}),
        },
      },
    );

    if (response.status >= 400) {
      throw new Error(`Otto status check failed: ${response.status}`);
    }

    const raw = response.data as Record<string, unknown>;
    const status = String(raw.status ?? raw.payment_status ?? "pending");

    return normalizeGatewayStatus(status);
  },

  async verifyWebhookSignature(context: WebhookContext): Promise<boolean> {
    const { webhookSecret, secretKey } = await getConfig();
    const signatureSecret = webhookSecret || secretKey;
    if (!signatureSecret) return false;

    const signature =
      context.headers.get("x-otto-signature") ??
      context.headers.get("signature");
    if (!signature) return false;

    const minifiedBody = signReplaceAll(context.rawBody);
    const expectedSignature = generateOttoSignature(
      minifiedBody,
      "",
      signatureSecret,
    );

    return verifySignature(context.rawBody, signature, expectedSignature);
  },

  async normalizeWebhook(context: WebhookContext): Promise<NormalizedWebhook> {
    const raw = JSON.parse(context.rawBody) as Record<string, unknown>;
    const status = normalizeGatewayStatus(
      String(raw.status ?? raw.payment_status ?? "pending"),
    );

    return {
      provider: "otto",
      eventId: context.eventId ?? crypto.randomUUID(),
      transactionId: String(raw.transaction_id ?? raw.order_id ?? ""),
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