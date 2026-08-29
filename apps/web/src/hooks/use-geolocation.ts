"use client";

import { useState, useCallback } from "react";
import { getUserLocation } from "@/lib/geolocation";
import type { GeolocationState } from "@/types/ui";

const ENABLED_KEY = "gps-search-enabled";
const LAST_LOCATION_KEY = "user-last-location";

function readEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(ENABLED_KEY);
  return raw === "true";
}

function readLastLocation(): { latitude: number; longitude: number } | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LAST_LOCATION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { latitude: number; longitude: number };
    if (
      typeof parsed.latitude === "number" &&
      typeof parsed.longitude === "number"
    ) {
      return parsed;
    }
  } catch {
    // ignore malformed JSON
  }
  return null;
}

export function useGeolocation(): GeolocationState & {
  requestLocation: () => void;
  clearLocation: () => void;
  setEnabled: (enabled: boolean) => void;
} {
  const initialEnabled = readEnabled();
  const initialLocation = initialEnabled ? readLastLocation() : null;

  const [enabled, setEnabledState] = useState<boolean>(initialEnabled);
  const [latitude, setLatitude] = useState<number | null>(
    initialLocation?.latitude ?? null,
  );
  const [longitude, setLongitude] = useState<number | null>(
    initialLocation?.longitude ?? null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    setLoading(true);
    setError(null);

    getUserLocation()
      .then((coords) => {
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            LAST_LOCATION_KEY,
            JSON.stringify({
              latitude: coords.latitude,
              longitude: coords.longitude,
            }),
          );
        }
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "Gagal mendapatkan lokasi.";
        setError(message);
        setLatitude(null);
        setLongitude(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const clearLocation = useCallback(() => {
    setLatitude(null);
    setLongitude(null);
    setError(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LAST_LOCATION_KEY);
    }
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ENABLED_KEY, String(value));
    }
    if (!value) {
      setLatitude(null);
      setLongitude(null);
      setError(null);
    }
  }, []);

  return {
    latitude,
    longitude,
    loading,
    error,
    enabled,
    requestLocation,
    clearLocation,
    setEnabled,
  };
}
