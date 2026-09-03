import type {
  CreatePaymentInput,
  CreatePaymentResult,
  WebhookContext,
  NormalizedWebhook,
  PaymentProviderAdapter,
} from "./types";
import { generateInvoiceNumber } from "@/lib/utils";

export const mockAdapter: PaymentProviderAdapter = {
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "PAYMENT_MODE tidak boleh 'sandbox' di production. Set PAYMENT_MODE=live.",
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    const invoiceNumber =
      typeof input.metadata?.invoiceNumber === "string"
        ? input.metadata.invoiceNumber
        : generateInvoiceNumber(input.purpose === "dp" ? "DP" : "FULL");
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL_SECONDARY ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    return {
      paymentId: `sandbox-${Date.now()}`,
      transactionId: invoiceNumber,
      redirectUrl: `${appUrl}/checkout/${invoiceNumber}`,
      rawResponse: {
        sandbox: true,
        invoiceNumber,
        amount: input.amount,
      },
    };
  },

  async getPaymentStatus() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return "success";
  },

  async verifyWebhookSignature(): Promise<boolean> {
    return true;
  },

  async normalizeWebhook(context: WebhookContext): Promise<NormalizedWebhook> {
    const body = JSON.parse(context.rawBody) as Record<string, unknown>;

    return {
      provider: "mock",
      eventId: context.eventId ?? `sandbox-event-${Date.now()}`,
      transactionId: String(body.transactionId ?? body.invoiceNumber ?? ""),
      status: (body.status as "success" | "failed" | "expired") ?? "pending",
      amount:
        typeof body.amount === "number"
          ? body.amount
          : parseFloat(String(body.amount ?? 0)),
      currency: String(body.currency ?? "IDR"),
      paidAt: body.paidAt ? new Date(body.paidAt as string) : undefined,
      metadata: body,
    };
  },
};
