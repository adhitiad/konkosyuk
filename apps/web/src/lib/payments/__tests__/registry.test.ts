import { describe, expect, it } from "vitest";
import { getPaymentProvider, isPaymentProviderName } from "@/lib/payments";

describe("payment provider registry", () => {
  it("accepts the mock provider for checkout flow", () => {
    expect(isPaymentProviderName("mock")).toBe(true);
    expect(getPaymentProvider("mock")).not.toBeNull();
  });
});
