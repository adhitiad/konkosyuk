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
import { getIpaymuConfig } from "./config";

function toIntegerAmount(amount: number): number {
  return Math.round(amount);
}

function buildIpaymuStringToSign(
  userAgent: string,
  va: string,
  requestBody: string,
  apiKey: string,
): string {
  return `${userAgent}${va}${requestBody}${apiKey}`;
}

async function getConfig() {
  const config = await getIpaymuConfig();
  return {
    baseUrl: String(config.baseUrl ?? ""),
    va: String(config.clientId ?? ""),
    apiKey: String(config.secretKey ?? ""),
    webhookSecret: config.webhookSecret ? String(config.webhookSecret) : "",
  };
}

export const ipaymuAdapter: PaymentProviderAdapter = {
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const { baseUrl, va, apiKey } = await getConfig();
    if (!baseUrl || !va || !apiKey) {
      throw new Error("iPaymu credentials not configured");
    }

    const referenceId = input.bookingId;
    const integerAmount = toIntegerAmount(input.amount);

    const payload = {
      va,
      amount: integerAmount,
      notifyUrl: `${process.env.NEXT_PUBLIC_APP_URL_SECONDARY || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/ipaymu`,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL_SECONDARY || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/payment/result?provider=ipaymu&bookingId=${referenceId}`,
      referenceId,
      name: input.metadata?.customerName ?? "Customer",
      phone: input.metadata?.phone ?? "",
      email: input.metadata?.email ?? "",
      expiredIn: input.expiresIn ? String(input.expiresIn) : undefined,
    };

    const requestBody = JSON.stringify(payload);
    const userAgent = "KonkosYuk";
    const stringToSign = buildIpaymuStringToSign(
      userAgent,
      va,
      requestBody,
      apiKey,
    );
    const signature = generateSha256Signature(stringToSign, apiKey);

    const response = await axios.post(
      `${baseUrl}/api/v2/transaction`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          va,
          signature,
          timestamp: new Date().toISOString(),
        },
      },
    );

    if (response.status >= 400) {
      throw new Error(
        `iPaymu payment failed: ${response.status} ${response.data}`,
      );
    }

    const raw = response.data as Record<string, unknown>;

    return {
      paymentId: String(
        raw.payment_id ?? raw.id ?? raw.reference_id ?? crypto.randomUUID(),
      ),
      transactionId: raw.transaction_id
        ? String(raw.transaction_id)
        : undefined,
      redirectUrl: raw.redirect_url ? String(raw.redirect_url) : undefined,
      qrCode: raw.qr_code ? String(raw.qr_code) : undefined,
      vaNumber: raw.va ? String(raw.va) : undefined,
      expiresAt: raw.expired_time
        ? new Date(raw.expired_time as string)
        : undefined,
      rawResponse: raw,
    };
  },

  async getPaymentStatus(transactionId: string): Promise<WebhookPaymentStatus> {
    const { baseUrl, va, apiKey } = await getConfig();
    if (!baseUrl || !va || !apiKey) {
      throw new Error("iPaymu credentials not configured");
    }

    const payload = {
      va,
      transactionId,
    };

    const requestBody = JSON.stringify(payload);
    const userAgent = "KonkosYuk";
    const stringToSign = buildIpaymuStringToSign(
      userAgent,
      va,
      requestBody,
      apiKey,
    );
    const signature = generateSha256Signature(stringToSign, apiKey);

    const response = await axios.get(
      `${baseUrl}/api/v2/transaction/${encodeURIComponent(transactionId)}`,
      {
        headers: {
          "Content-Type": "application/json",
          va,
          signature,
          timestamp: new Date().toISOString(),
        },
      },
    );

    if (response.status >= 400) {
      throw new Error(`iPaymu status check failed: ${response.status}`);
    }

    const raw = response.data as Record<string, unknown>;
    const status = String(raw.status ?? raw.transaction_status ?? "pending");

    return normalizeGatewayStatus(status);
  },

  async verifyWebhookSignature(context: WebhookContext): Promise<boolean> {
    const { webhookSecret, va } = await getConfig();
    if (!webhookSecret) return false;

    const signature =
      context.headers.get("x-ipaymu-signature") ??
      context.headers.get("signature");
    if (!signature) return false;

    const userAgent = context.headers.get("user-agent") ?? "KonkosYuk";
    const requestBody = context.rawBody;
    const stringToSign = buildIpaymuStringToSign(
      userAgent,
      va,
      requestBody,
      webhookSecret,
    );
    const expectedSignature = generateSha256Signature(
      stringToSign,
      webhookSecret,
    );

    return verifySignature(context.rawBody, signature, expectedSignature);
  },

  async normalizeWebhook(context: WebhookContext): Promise<NormalizedWebhook> {
    const raw = JSON.parse(context.rawBody) as Record<string, unknown>;
    const rawStatus = String(raw.status ?? raw.transaction_status ?? "pending");
    const status = normalizeGatewayStatus(rawStatus);

    const isSuccessStatus = rawStatus === "Success" || rawStatus === "Berhasil";
    const normalizedStatus: WebhookPaymentStatus = isSuccessStatus
      ? "success"
      : status;

    return {
      provider: "ipaymu",
      eventId: context.eventId ?? crypto.randomUUID(),
      transactionId: String(raw.transaction_id ?? raw.reference_id ?? ""),
      status: normalizedStatus,
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
