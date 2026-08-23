import { describe, it, expect } from "vitest";
import { ACCOUNTS } from "@/lib/accounting/auto-ledger";

describe("ACCOUNTS", () => {
  it("should have unique account codes", () => {
    const codes = ACCOUNTS;
    const uniqueCodes = new Set(Object.values(codes));
    expect(uniqueCodes.size).toBe(Object.keys(codes).length);
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
