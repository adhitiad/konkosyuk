import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  startReferralVerification,
  handleReferralFailureOnRefund,
  sweepEligibleReferrals,
} from "@/lib/referrals/verification";

const mockDispatch = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@/lib/notification-service", () => ({
  dispatchReferralStatusUpdate: mockDispatch,
}));

const selectRows: Record<string, unknown>[][] = [];

const mockDb = vi.hoisted(() => ({
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  and: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  for: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  returning: vi.fn().mockReturnThis(),
}));

vi.mock("@/db", () => ({
  db: mockDb,
  referrals: { id: "id", refereeId: "refereeId", status: "status", category: "category", tier: "tier", referrerId: "referrerId", code: "code", refereeTransactionId: "refereeTransactionId", eligibleAt: "eligibleAt" },
}));

describe("startReferralVerification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectRows.length = 0;
  });

  it("returns early when no verifying referral exists", async () => {
    selectRows.push([]);
    mockDb.limit.mockImplementation(async () => {
      const rows = selectRows.shift() ?? [];
      return rows;
    });
    mockDb.returning.mockResolvedValue([{ id: "ref-1" }]);

    await startReferralVerification(mockDb as never, {
      refereeUserId: "user-123",
      paymentId: "pay-123",
      paymentAmount: 100000,
    });

    expect(mockDb.select).toHaveBeenCalled();
  });

  it("calculates commission and updates referral", async () => {
    selectRows.push([
      {
        id: "ref-1",
        refereeId: "user-123",
        status: "verifying",
        category: "owner",
        tier: 2,
        referrerId: "owner-1",
        code: "ABC123",
        refereeTransactionId: null,
        eligibleAt: null,
      },
    ]);
    mockDb.limit.mockImplementation(async () => {
      const rows = selectRows.shift() ?? [];
      return rows;
    });
    mockDb.returning.mockResolvedValue([{ id: "ref-1" }]);

    await startReferralVerification(mockDb as never, {
      refereeUserId: "user-123",
      paymentId: "pay-123",
      paymentAmount: 1_000_000,
    });

    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith("owner-1", "ABC123", "verifying", {
      eligibleAt: expect.any(String),
    });
  });

  it("defaults category to tenant when undefined", async () => {
    selectRows.push([
      {
        id: "ref-1",
        refereeId: "user-123",
        status: "verifying",
        category: undefined,
        tier: 1,
        referrerId: "owner-1",
        code: "ABC123",
        refereeTransactionId: null,
        eligibleAt: null,
      },
    ]);
    mockDb.limit.mockImplementation(async () => {
      const rows = selectRows.shift() ?? [];
      return rows;
    });
    mockDb.returning.mockResolvedValue([{ id: "ref-1" }]);

    await startReferralVerification(mockDb as never, {
      refereeUserId: "user-123",
      paymentId: "pay-123",
      paymentAmount: 1_000_000,
    });

    expect(mockDispatch).toHaveBeenCalled();
  });
});

describe("handleReferralFailureOnRefund", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectRows.length = 0;
  });

  it("returns early when no referral found", async () => {
    selectRows.push([]);
    mockDb.limit.mockImplementation(async () => {
      const rows = selectRows.shift() ?? [];
      return rows;
    });

    await handleReferralFailureOnRefund(mockDb as never, "pay-123");

    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns early when referral already completed", async () => {
    selectRows.push([
      {
        id: "ref-1",
        status: "completed",
        refereeTransactionId: "pay-123",
      },
    ]);
    mockDb.limit.mockImplementation(async () => {
      const rows = selectRows.shift() ?? [];
      return rows;
    });

    await handleReferralFailureOnRefund(mockDb as never, "pay-123");

    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns early when referral already cancelled", async () => {
    selectRows.push([
      {
        id: "ref-1",
        status: "cancelled",
        refereeTransactionId: "pay-123",
      },
    ]);
    mockDb.limit.mockImplementation(async () => {
      const rows = selectRows.shift() ?? [];
      return rows;
    });

    await handleReferralFailureOnRefund(mockDb as never, "pay-123");

    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("marks verifying referral as failed", async () => {
    selectRows.push([
      {
        id: "ref-1",
        status: "verifying",
        refereeTransactionId: "pay-123",
        referrerId: "owner-1",
        code: "ABC123",
      },
    ]);
    mockDb.limit.mockImplementation(async () => {
      const rows = selectRows.shift() ?? [];
      return rows;
    });
    mockDb.returning.mockResolvedValue([{ id: "ref-1" }]);

    await handleReferralFailureOnRefund(mockDb as never, "pay-123");

    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith("owner-1", "ABC123", "failed", {
      reason: "Payment refunded",
    });
  });
});

describe("sweepEligibleReferrals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectRows.length = 0;
  });

  it("skips referrals that changed status during iteration", async () => {
    selectRows.push([
      { id: "ref-1", status: "eligible", referrerId: "owner-1", code: "A1" },
      { id: "ref-2", status: "verifying", referrerId: "owner-1", code: "A2" },
    ]);
    mockDb.limit.mockImplementation(async () => {
      const rows = selectRows.shift() ?? [];
      return rows;
    });

    const count = await sweepEligibleReferrals();

    expect(count).toBe(1);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it("processes up to 100 referrals per run", async () => {
    const candidates = Array.from({ length: 150 }, (_, i) => ({
      id: `ref-${i}`,
      status: "verifying",
      referrerId: "owner-1",
      code: `CODE${i}`,
    }));
    selectRows.push(candidates);
    mockDb.limit.mockImplementation(async () => {
      const rows = selectRows.shift() ?? [];
      return rows;
    });

    const count = await sweepEligibleReferrals();

    expect(count).toBe(150);
  });
});
