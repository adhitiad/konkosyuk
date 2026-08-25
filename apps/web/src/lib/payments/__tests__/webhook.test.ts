import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleWebhookRequest } from "@/lib/payments/webhook";
import type { PaymentProviderName } from "@/lib/payments/types";

const mockGetPaymentProvider = vi.hoisted(() =>
  vi.fn<(name: string) => null>((() => null) as (name: string) => null),
);

vi.mock("@/lib/payments", () => ({
  getPaymentProvider: mockGetPaymentProvider,
}));

vi.mock("@/db", () => ({
  db: {
    transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn({})),
  },
  payments: { id: "id", transactionId: "transactionId", status: "status", amount: "amount", purpose: "purpose", propertyId: "propertyId" },
  webhookEvents: { id: "id", provider: "provider", eventId: "eventId", payloadHash: "payloadHash", processedAt: "processedAt", details: "details" },
  properties: { id: "id", isFeatured: "isFeatured", featuredUntil: "featuredUntil" },
  bookings: { id: "id", userId: "userId", propertyId: "propertyId", bookingType: "bookingType", unitId: "unitId", status: "status" },
  users: { id: "id", role: "role" },
  units: { id: "id", propertyId: "propertyId" },
}));

const mockAdapter = {
  verifyWebhookSignature: vi.fn().mockResolvedValue(true),
  normalizeWebhook: vi.fn(),
};

describe("handleWebhookRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPaymentProvider.mockReturnValue(mockAdapter as never);
  });

  it("returns 400 for unknown provider", async () => {
    mockGetPaymentProvider.mockReturnValue(null as never);

    const response = await handleWebhookRequest("invalid" as PaymentProviderName, {
      provider: "invalid" as PaymentProviderName,
      headers: new Headers(),
      rawBody: "",
    });

    expect(response.status).toBe(400);
  });

  it("returns 401 for invalid signature", async () => {
    mockAdapter.verifyWebhookSignature.mockResolvedValue(false);

    const response = await handleWebhookRequest("ipaymu", {
      provider: "ipaymu",
      headers: new Headers(),
      rawBody: "",
    });

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid webhook payload", async () => {
    mockAdapter.verifyWebhookSignature.mockResolvedValue(true);
    mockAdapter.normalizeWebhook.mockRejectedValue(new Error("Invalid"));

    const response = await handleWebhookRequest("ipaymu", {
      provider: "ipaymu",
      headers: new Headers(),
      rawBody: "",
    });

    expect(response.status).toBe(400);
  });
});
