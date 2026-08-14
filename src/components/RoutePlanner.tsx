"use client";

import { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";

// --- TIPE DATA ---
export type TravelMode = "auto" | "pedestrian" | "bicycle" | "multimodal";

export interface Location {
  latitude: number;
  longitude: number;
  name?: string;
}

export interface RouteSummary {
  distance: number;
  distanceText: string;
  duration: number;
  durationText: string;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
}

export interface RouteLeg {
  summary: RouteSummary;
  steps: RouteStep[];
  shape: [number, number][];
}

export interface RouteResult {
  distance: number;
  distanceText: string;
  duration: number;
  durationText: string;
  legs: RouteLeg[];
  geometry: [number, number][];
}

export interface RoutePlannerProps {
  origin: Location;
  destination: Location;
  travelMode?: TravelMode;
  className?: string;
  onRouteCalculated?: (route: RouteResult) => void;
  onError?: (error: string) => void;
}

// --- HELPER: Format waktu dan jarak ---
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} jam ${minutes} menit`;
  }
  return `${minutes} menit`;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

// --- HELPER: Decode polyline (Google/Valhalla encoded polyline) ---
function decodePolyline(encoded: string, precision = 6): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push([lat / Math.pow(10, precision), lng / Math.pow(10, precision)]);
  }

  return points;
}

// --- HELPER: Build Valhalla request ---
function buildValhallaRequest(
  origin: Location,
  destination: Location,
  travelMode: TravelMode,
) {
  const costingMap: Record<TravelMode, string> = {
    auto: "auto",
    pedestrian: "pedestrian",
    bicycle: "bicycle",
    multimodal: "multimodal",
  };

  return {
    locations: [
      { lat: origin.latitude, lon: origin.longitude },
      { lat: destination.latitude, lon: destination.longitude },
    ],
    costing: costingMap[travelMode],
    directions_options: {
      language: "id",
      units: "kilometers",
    },
  };
}

// --- HELPER: Parse Valhalla response ---
function parseValhallaResponse(data: any): RouteResult {
  const trip = data.trip;
  if (!trip || !trip.legs || trip.legs.length === 0) {
    throw new Error("Rute tidak ditemukan");
  }

  const legs: RouteLeg[] = trip.legs.map((leg: any) => {
    const summary: RouteSummary = {
      distance: leg.summary.length,
      distanceText: formatDistance(leg.summary.length),
      duration: leg.summary.time,
      durationText: formatDuration(leg.summary.time),
    };

    const steps: RouteStep[] = leg.maneuvers.map((maneuver: any) => ({
      instruction: maneuver.instruction || "Lanjutkan",
      distance: maneuver.length,
      duration: maneuver.time,
    }));

    // Decode shape (polyline)
    const shape = leg.shape
      ? decodePolyline(leg.shape)
      : [];

    return { summary, steps, shape };
  });

  // Combine all shapes
  const geometry: [number, number][] = [];
  legs.forEach((leg) => {
    geometry.push(...leg.shape);
  });

  const totalDistance = legs.reduce((sum, leg) => sum + leg.summary.distance, 0);
  const totalDuration = legs.reduce((sum, leg) => sum + leg.summary.duration, 0);

  return {
    distance: totalDistance,
    distanceText: formatDistance(totalDistance),
    duration: totalDuration,
    durationText: formatDuration(totalDuration),
    legs,
    geometry,
  };
}

// --- MAIN COMPONENT ---
export default function RoutePlanner({
  origin,
  destination,
  travelMode = "auto",
  className = "",
  onRouteCalculated,
  onError,
}: RoutePlannerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_STADIA_MAPS_API_KEY;

  const calculateRoute = useCallback(async () => {
    if (!apiKey) {
      const err = "NEXT_PUBLIC_STADIA_MAPS_API_KEY belum diatur";
      setError(err);
      onError?.(err);
      return;
    }

    setLoading(true);
    setError(null);
    setRoute(null);

    try {
      const requestBody = buildValhallaRequest(origin, destination, travelMode);

      const response = await fetch(
        `https://api.stadiamaps.com/routing/v1/route?api_key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `HTTP ${response.status}: Gagal menghitung rute`,
        );
      }

      const data = await response.json();
      const parsedRoute = parseValhallaResponse(data);
      setRoute(parsedRoute);
      onRouteCalculated?.(parsedRoute);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  }, [origin, destination, travelMode, apiKey, onRouteCalculated, onError]);

  // Auto-calculate when origin/destination changes
  useEffect(() => {
    if (origin && destination) {
      calculateRoute();
    }
  }, [origin, destination, travelMode, calculateRoute]);

  if (!apiKey) {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}>
        <p className="text-sm text-red-600">
          NEXT_PUBLIC_STADIA_MAPS_API_KEY belum diatur. Tambahkan di .env.local.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}>
        <p className="text-sm font-medium text-red-800">Gagal menghitung rute</p>
        <p className="mt-1 text-xs text-red-600">{error}</p>
        <button
          type="button"
          onClick={calculateRoute}
          className="mt-2 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-200"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center rounded-lg border bg-gray-50 p-4 ${className}`}>
        <Loader2 className="size-4 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">
          Menghitung rute...
        </span>
      </div>
    );
  }

  if (!route) {
    return (
      <div className={`rounded-lg border bg-gray-50 p-4 ${className}`}>
        <p className="text-sm text-muted-foreground">
          Masukkan lokasi asal dan tujuan untuk melihat rute.
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border bg-white ${className}`}>
      {/* Ringkasan rute */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-primary">{route.distanceText}</p>
            <p className="text-sm text-muted-foreground">{route.durationText}</p>
          </div>
          <div className="text-right">
            <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 capitalize">
              {travelMode === "auto" && "Mobil"}
              {travelMode === "pedestrian" && "Jalan Kaki"}
              {travelMode === "bicycle" && "Sepeda"}
              {travelMode === "multimodal" && "Transportasi Umum"}
            </span>
          </div>
        </div>
      </div>

      {/* Petunjuk arah */}
      <div className="max-h-80 overflow-y-auto">
        {route.legs.map((leg, legIndex) => (
          <div key={legIndex} className={legIndex > 0 ? "border-t" : ""}>
            {leg.steps.map((step, stepIndex) => (
              <div
                key={stepIndex}
                className="flex items-start gap-3 border-b p-3 last:border-b-0"
              >
                <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-xs font-bold">{stepIndex + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{step.instruction}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDistance(step.distance)} • {formatDuration(step.duration)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
