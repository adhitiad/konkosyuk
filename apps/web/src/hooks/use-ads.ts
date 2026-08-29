"use client";

import { useState, useEffect } from "react";
import type { Ad } from "@/types/ui";

export type { Ad };

export function useAds(type?: string): {
  ads: Ad[];
  loading: boolean;
} {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAds() {
      try {
        const url = new URL("/api/ads", window.location.origin);
        url.searchParams.set("limit", "3");
        if (type) url.searchParams.set("type", type);

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("Failed to fetch ads");
        const json = await res.json();

        if (!cancelled) {
          setAds(json.ads || []);
        }
      } catch {
        if (!cancelled) {
          setAds([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchAds();

    return () => {
      cancelled = true;
    };
  }, [type]);

  return { ads, loading };
}
