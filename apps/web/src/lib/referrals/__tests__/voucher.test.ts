import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateAndApplyVoucher,
  redeemVoucherAtomically,
} from "@/lib/referrals/voucher";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  },
  referrals: {},
}));

describe("validateAndApplyVoucher", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns error for zero or negative amount", async () => {
    const result = await validateAndApplyVoucher("VOUCHER123", "owner-1", 0);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Jumlah tidak valid");
  });

  it("returns error for non-existent voucher", async () => {
    const { validateAndApplyVoucher: validate } =
      await import("@/lib/referrals/voucher");
    const result = await validate("NONEXISTENT", "owner-1", 100000);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Kode voucher tidak ditemukan");
  });
});

describe("redeemVoucherAtomically", () => {
  it("returns true when update succeeds", async () => {
    const mockTx = {
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: "ref-1" }]),
          }),
        }),
      }),
    };

    const result = await redeemVoucherAtomically(mockTx as never, "ref-1");
    expect(result).toBe(true);
  });

  it("returns false when no rows updated (already redeemed)", async () => {
    const mockTx = {
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };

    const result = await redeemVoucherAtomically(mockTx as never, "ref-1");
    expect(result).toBe(false);
  });
});
