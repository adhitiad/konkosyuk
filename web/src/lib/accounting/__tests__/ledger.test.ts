import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PaymentTransaction } from "@/db/schema";

interface LedgerEntry {
  accountCode: string;
  debit: string;
  credit: string;
}

interface Refund {
  id: string;
  invoiceNumber: string;
  amount: number;
  paidAt: string;
}

const mockDb = vi.hoisted(() => ({
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([{ platformFeePercent: "1.8" }]),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
}));

vi.mock("@/db", () => ({
  db: mockDb,
}));

import { ACCOUNTS, createPaymentLedgerEntry, createRefundLedgerEntry, createWithdrawalLedgerEntry } from "@/lib/accounting/auto-ledger";

describe("ACCOUNTS", () => {
  it("should have unique account codes", () => {
    const codes = Object.values(ACCOUNTS);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  it("should include new operating expense accounts", () => {
    expect(ACCOUNTS.SERVER_HOSTING_COST).toBe("4001");
    expect(ACCOUNTS.DB_COST).toBe("4002");
    expect(ACCOUNTS.TRANSACTION_PG_COST).toBe("4003");
    expect(ACCOUNTS.REDIS_COST).toBe("4004");
    expect(ACCOUNTS.DOMAIN_COST).toBe("4055");
  });

  it("should include new accounting codes", () => {
    expect(ACCOUNTS.OTHER).toBe("2222");
    expect(ACCOUNTS.DOWN_PAYMENT).toBe("7011");
    expect(ACCOUNTS.CREDIT).toBe("7001");
    expect(ACCOUNTS.DEBIT).toBe("8001");
    expect(ACCOUNTS.REFUND_EXPENSE).toBe("8010");
    expect(ACCOUNTS.PLATFORM_ADMIN_FEE).toBe("8021");
  });
});

describe("createPaymentLedgerEntry", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.limit.mockResolvedValue([{ platformFeePercent: "1.8" }]);
    mockDb.insert.mockReturnThis();
    mockDb.values.mockReturnThis();
  });

  it("should create 3 ledger entries for a payment", async () => {
    const payment: PaymentTransaction = {
      id: "payment-123",
      invoiceNumber: "INV-001",
      bookingId: null,
      provider: "mock",
      amount: "100000",
      status: "success",
      gatewayResponse: null,
      webhookPayload: null,
      paidAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await createPaymentLedgerEntry(payment);

    expect(mockDb.insert).toHaveBeenCalledTimes(1);
    const insertedValues = mockDb.values.mock.calls[0][0];
    expect(insertedValues).toHaveLength(3);

    const bankEntry = insertedValues.find((e: LedgerEntry) => e.accountCode === ACCOUNTS.BANK);
    const feeEntry = insertedValues.find((e: LedgerEntry) => e.accountCode === ACCOUNTS.PLATFORM_FEE_REVENUE);
    const payoutEntry = insertedValues.find((e: LedgerEntry) => e.accountCode === ACCOUNTS.OWNER_PAYOUTS);

    expect(bankEntry).toBeDefined();
    expect(bankEntry.debit).toBe("100000");
    expect(bankEntry.credit).toBe("0");

    expect(feeEntry).toBeDefined();
    expect(feeEntry.debit).toBe("0");
    expect(Number(feeEntry.credit)).toBeGreaterThan(0);

    expect(payoutEntry).toBeDefined();
    expect(payoutEntry.debit).toBe("0");
    expect(Number(payoutEntry.credit)).toBeGreaterThan(0);
  });
});

describe("createRefundLedgerEntry", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockDb.insert.mockReturnThis();
    mockDb.values.mockReturnThis();
  });

  it("should create 2 ledger entries for a refund", async () => {
    const refund: Refund = {
      id: "refund-123",
      invoiceNumber: "INV-001",
      amount: 50000,
      paidAt: new Date().toISOString(),
    };

    await createRefundLedgerEntry(refund);

    expect(mockDb.insert).toHaveBeenCalledTimes(1);
    const insertedValues = mockDb.values.mock.calls[0][0];
    expect(insertedValues).toHaveLength(2);

    const refundEntry = insertedValues.find((e: LedgerEntry) => e.accountCode === ACCOUNTS.REFUNDS);
    const bankEntry = insertedValues.find((e: LedgerEntry) => e.accountCode === ACCOUNTS.BANK);

    expect(refundEntry).toBeDefined();
    expect(refundEntry.debit).toBe("50000");
    expect(refundEntry.credit).toBe("0");

    expect(bankEntry).toBeDefined();
    expect(bankEntry.debit).toBe("0");
    expect(bankEntry.credit).toBe("50000");
  });
});

describe("createWithdrawalLedgerEntry", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockDb.insert.mockReturnThis();
    mockDb.values.mockReturnThis();
  });

  it("should create 1 ledger entry for a withdrawal", async () => {
    const withdrawal = {
      id: "withdrawal-123",
      amount: 200000,
      createdAt: new Date().toISOString(),
      userId: "user-123",
    };

    await createWithdrawalLedgerEntry(withdrawal);

    expect(mockDb.insert).toHaveBeenCalledTimes(1);
    const insertedValues = mockDb.values.mock.calls[0][0];
    expect(insertedValues.accountCode).toBe(ACCOUNTS.OWNER_PAYOUTS);
    expect(insertedValues.debit).toBe("200000");
    expect(insertedValues.credit).toBe("0");
  });
});
