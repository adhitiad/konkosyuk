import { describe, it, expect } from "vitest";
import { ACCOUNTS } from "@/scripts/seed";

describe("seed chart of accounts", () => {
  it("should have valid account codes and names", () => {
    expect(ACCOUNTS.length).toBeGreaterThan(0);
    for (const account of ACCOUNTS) {
      expect(account.code).toMatch(/^\d+$/);
      expect(account.name.length).toBeGreaterThan(0);
      expect(["asset", "liability", "equity", "revenue", "expense"]).toContain(
        account.type,
      );
    }
  });

  it("should include the new operating expense accounts", () => {
    const codes = ACCOUNTS.map((a) => a.code);
    expect(codes).toContain("2222");
    expect(codes).toContain("4001");
    expect(codes).toContain("4002");
    expect(codes).toContain("4003");
    expect(codes).toContain("4004");
    expect(codes).toContain("4055");
  });
});
