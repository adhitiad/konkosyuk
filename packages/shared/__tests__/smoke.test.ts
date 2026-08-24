import { describe, it, expect } from "vitest";
import { USER_ROLES, BOOKING_STATUSES, PROPERTY_TYPES, UNIT_STATUSES } from "../src/constants/enums";
import { DEFAULT_PLATFORM_FEE_PERCENT, BOOKING_RULES } from "../src/constants/business-rules";

describe("@konkosyuk/shared smoke tests", () => {
  it("exports USER_ROLES", () => {
    expect(USER_ROLES).toEqual(["cust", "owner", "admin", "staff"]);
  });

  it("exports BOOKING_STATUSES", () => {
    expect(BOOKING_STATUSES).toContain("confirmed");
    expect(BOOKING_STATUSES).toContain("cancelled");
  });

  it("exports DEFAULT_PLATFORM_FEE_PERCENT", () => {
    expect(DEFAULT_PLATFORM_FEE_PERCENT).toBe(1.8);
  });

  it("exports PROPERTY_TYPES", () => {
    expect(PROPERTY_TYPES).toContain("kost");
    expect(PROPERTY_TYPES).toContain("apartemen");
  });

  it("exports UNIT_STATUSES", () => {
    expect(UNIT_STATUSES).toEqual(["available", "booked", "maintenance"]);
  });

  it("exports BOOKING_RULES", () => {
    expect(BOOKING_RULES.platformFeePercent).toBe(1.8);
    expect(BOOKING_RULES.currency).toBe("IDR");
  });
});
