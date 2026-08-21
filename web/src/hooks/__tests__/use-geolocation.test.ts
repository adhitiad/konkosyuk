import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGeolocation } from "@/hooks/use-geolocation";

const mockGetUserLocation = vi.hoisted(() => vi.fn());

vi.mock("@/lib/geolocation", () => ({
  getUserLocation: mockGetUserLocation,
}));

describe("useGeolocation", () => {
  beforeEach(() => {
    mockGetUserLocation.mockReset();
    localStorage.clear();
  });

  it("returns default state with enabled=false", () => {
    const { result } = renderHook(() => useGeolocation());

    expect(result.current.enabled).toBe(false);
    expect(result.current.latitude).toBeNull();
    expect(result.current.longitude).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("restores location from localStorage when enabled=true on init", () => {
    localStorage.setItem("gps-search-enabled", "true");
    localStorage.setItem(
      "user-last-location",
      JSON.stringify({ latitude: -6.2088, longitude: 106.8456 }),
    );

    const { result } = renderHook(() => useGeolocation());

    expect(result.current.enabled).toBe(true);
    expect(result.current.latitude).toBeCloseTo(-6.2088);
    expect(result.current.longitude).toBeCloseTo(106.8456);
  });

  it("calls getUserLocation on requestLocation", async () => {
    mockGetUserLocation.mockResolvedValue({
      latitude: -6.1751,
      longitude: 106.8275,
    });

    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      result.current.requestLocation();
    });

    expect(mockGetUserLocation).toHaveBeenCalledTimes(1);
    expect(result.current.latitude).toBeCloseTo(-6.1751);
    expect(result.current.longitude).toBeCloseTo(106.8275);
    expect(result.current.loading).toBe(false);
  });

  it("handles permission denied error", async () => {
    mockGetUserLocation.mockRejectedValue(
      new Error("Akses lokasi ditolak. Aktifkan di pengaturan browser."),
    );

    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      result.current.requestLocation();
    });

    expect(result.current.error).toBe(
      "Akses lokasi ditolak. Aktifkan di pengaturan browser.",
    );
    expect(result.current.latitude).toBeNull();
    expect(result.current.longitude).toBeNull();
  });

  it("handles position unavailable error", async () => {
    mockGetUserLocation.mockRejectedValue(
      new Error("Tidak dapat menemukan lokasi Anda."),
    );

    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      result.current.requestLocation();
    });

    expect(result.current.error).toBe("Tidak dapat menemukan lokasi Anda.");
    expect(result.current.latitude).toBeNull();
    expect(result.current.longitude).toBeNull();
  });

  it("clears location and localStorage on clearLocation", async () => {
    localStorage.setItem(
      "user-last-location",
      JSON.stringify({ latitude: -6.2088, longitude: 106.8456 }),
    );

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.clearLocation();
    });

    expect(result.current.latitude).toBeNull();
    expect(result.current.longitude).toBeNull();
    expect(localStorage.getItem("user-last-location")).toBeNull();
  });

  it("persists enabled state to localStorage on setEnabled", () => {
    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.setEnabled(true);
    });

    expect(localStorage.getItem("gps-search-enabled")).toBe("true");
    expect(result.current.enabled).toBe(true);

    act(() => {
      result.current.setEnabled(false);
    });

    expect(localStorage.getItem("gps-search-enabled")).toBe("false");
    expect(result.current.enabled).toBe(false);
  });

  it("clears location when setEnabled(false is called", async () => {
    mockGetUserLocation.mockResolvedValue({
      latitude: -6.1751,
      longitude: 106.8275,
    });

    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      result.current.requestLocation();
    });

    expect(result.current.latitude).toBeCloseTo(-6.1751);

    act(() => {
      result.current.setEnabled(false);
    });

    expect(result.current.latitude).toBeNull();
    expect(result.current.longitude).toBeNull();
  });
});
