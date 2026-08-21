import { describe, it, expect } from "vitest";
import { act } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReceiptTemplate, type ReceiptData } from "@/lib/payments/receipt-template";

const baseData: ReceiptData = {
  paymentId: "payment-123",
  paidAt: "2025-01-15T10:00:00.000Z",
  amount: "2500000",
  currency: "IDR",
  status: "success",
  provider: "doku",
  purpose: "full_payment",
  transactionId: "txn-abc-123",
  tenantName: "Budi Santoso",
  propertyName: "Kost Melati",
  propertyAddress: "Jl. Sudirman No. 123, Jakarta Selatan",
  unitName: "Unit 1A",
  startDate: "2025-01-20T00:00:00.000Z",
  endDate: "2025-07-20T00:00:00.000Z",
};

describe("ReceiptTemplate", () => {
  it("renders without throwing for valid data", async () => {
    const buffer = await act(async () =>
      renderToBuffer(<ReceiptTemplate data={baseData} />),
    );
    expect(buffer).toBeDefined();
    expect(Buffer.byteLength(buffer)).toBeGreaterThan(0);
  });

  it("generates non-empty PDF buffer", async () => {
    const buffer = await act(async () =>
      renderToBuffer(<ReceiptTemplate data={baseData} />),
    );
    const bytes = Buffer.from(buffer);
    expect(bytes.length).toBeGreaterThan(0);
  });

  it("handles refunded status", async () => {
    const refundedData: ReceiptData = {
      ...baseData,
      status: "refunded",
    };
    const buffer = await act(async () =>
      renderToBuffer(<ReceiptTemplate data={refundedData} />),
    );
    expect(Buffer.byteLength(buffer)).toBeGreaterThan(0);
  });

  it("handles missing optional fields", async () => {
    const minimalData: ReceiptData = {
      paymentId: "payment-456",
      paidAt: null,
      amount: "500000",
      currency: "IDR",
      status: "pending",
      provider: "mock",
      purpose: "dp",
      transactionId: null,
      tenantName: "Ani",
      propertyName: "Kost Bougenville",
      propertyAddress: null,
      unitName: null,
      startDate: null,
      endDate: null,
    };
    const buffer = await act(async () =>
      renderToBuffer(<ReceiptTemplate data={minimalData} />),
    );
    expect(Buffer.byteLength(buffer)).toBeGreaterThan(0);
  });
});
