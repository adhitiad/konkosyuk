import { describe, expect, it } from "vitest";
import { localeHref } from "@/lib/i18n";
import { getPaymentProvider, isPaymentProviderName } from "@/lib/payments";

describe("payment provider registry", () => {
  it("accepts the mock provider for checkout flow", () => {
    expect(isPaymentProviderName("mock")).toBe(true);
    expect(getPaymentProvider("mock")).not.toBeNull();
  });

  it("keeps absolute redirect URLs untouched while localizing relative paths", () => {
    expect(localeHref("id", "/dashboard/bookings")).toBe("/id/dashboard/bookings");
    expect(localeHref("id", "dashboard/bookings")).toBe("/id/dashboard/bookings");
    expect(localeHref("id", "http://localhost:3000/dashboard/bookings")).toBe(
      "http://localhost:3000/dashboard/bookings",
    );
    expect(localeHref("id", "https://example.com/checkout?purpose=dp")).toBe(
      "https://example.com/checkout?purpose=dp",
    );
  });
});
