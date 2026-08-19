import { describe, it, expect } from "vitest";
import { calculateDistance } from "@/lib/geolocation";

describe("calculateDistance", () => {
  it("calculates distance between two points correctly", () => {
    const distance = calculateDistance(-6.2088, 106.8456, -6.1751, 106.8275);
    expect(distance).toBeCloseTo(4.2, 0);
  });

  it("returns 0 for same coordinates", () => {
    const distance = calculateDistance(0, 0, 0, 0);
    expect(distance).toBe(0);
  });

  it("calculates larger distances correctly", () => {
    const distance = calculateDistance(-6.2088, 106.8456, -8.65, 115.2167);
    expect(distance).toBeCloseTo(962, 0);
  });

  it("handles negative coordinates", () => {
    const distance = calculateDistance(-33.8688, 151.2093, -33.8688, 151.2093);
    expect(distance).toBe(0);
  });
});
