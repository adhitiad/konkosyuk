"use client";

import { useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MapPinIcon,
  LoaderPinwheelIcon,
  CheckmarkCircle01Icon,
  CancelCircleIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "@/components/ui/toast";
import { useGeolocation } from "@/hooks/use-geolocation";

interface GpsSearchButtonProps {
  radius?: number;
  onLocationChange?: (lat: number, lng: number) => void;
  onClear?: () => void;
}

export function GpsSearchButton({
  radius = 30,
  onLocationChange,
  onClear,
}: GpsSearchButtonProps) {
  const {
    enabled,
    loading,
    error,
    latitude,
    longitude,
    setEnabled,
    requestLocation,
    clearLocation,
  } = useGeolocation();

  const handleClick = useCallback(() => {
    if (enabled) {
      clearLocation();
      onClear?.();
      return;
    }

    setEnabled(true);
    requestLocation();
  }, [enabled, setEnabled, requestLocation, clearLocation, onClear]);

  useEffect(() => {
    if (enabled && latitude !== null && longitude !== null) {
      onLocationChange?.(latitude, longitude);
    }
  }, [enabled, latitude, longitude, onLocationChange]);

  if (error) {
    toast({
      title: "Lokasi tidak ditemukan",
      description: error,
      type: "error",
    });
  }

  if (enabled && latitude !== null && longitude !== null) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="default" size="sm" className="gap-2" disabled>
          <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} />
          Lokasi Aktif • {radius}km
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            clearLocation();
            onClear?.();
          }}
          title="Nonaktifkan GPS"
        >
          <HugeiconsIcon icon={CancelCircleIcon} strokeWidth={2} />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <HugeiconsIcon
          icon={LoaderPinwheelIcon}
          strokeWidth={2}
          className="size-4 animate-spin"
        />
      ) : (
        <HugeiconsIcon icon={MapPinIcon} strokeWidth={2} className="size-4" />
      )}
      {loading ? "Mencari lokasi..." : "Gunakan Lokasi Saya"}
    </Button>
  );
}
