"use client";

import { useState, useCallback, useRef } from "react";
import Map, {
  MapRef,
  Marker,
  Popup,
  NavigationControl,
  GeolocateControl,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { MapPinIcon, LoaderPinwheelIcon } from "@hugeicons/core-free-icons";
import { getStructuredAddressFromCoords } from "@/lib/geolocation";
import type { StyleSpecification } from "maplibre-gl";

const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "carto-tiles": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://carto.com/">CARTO</a> © <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "carto-layer",
      type: "raster",
      source: "carto-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
} as const;

interface PropertyMapPickerProps {
  lat?: number | null;
  lng?: number | null;
  onLocationSelected: (data: {
    lat: number;
    lng: number;
    address: string;
    province: string;
    city: string;
    district: string;
  }) => void;
}

export default function PropertyMapPicker({
  lat,
  lng,
  onLocationSelected,
}: PropertyMapPickerProps) {
  const mapRef = useRef<MapRef>(null);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const position: [number, number] | undefined =
    lat && lng ? [lat, lng] : undefined;

  const handleMapClick = useCallback(
    async (e: { lngLat: { lat: number; lng: number } }) => {
      const { lat, lng } = e.lngLat;
      try {
        const address = await getStructuredAddressFromCoords(lat, lng);
        onLocationSelected({
          lat,
          lng,
          address: address.displayName,
          province: address.province,
          city: address.city,
          district: address.district,
        });
      } catch {
        onLocationSelected({
          lat,
          lng,
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          province: "",
          city: "",
          district: "",
        });
      }
    },
    [onLocationSelected],
  );

  const handleUseCurrentLocation = async () => {
    if (!lat || !lng) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: { "User-Agent": "Konkosyuk/1.0" },
        },
      );
      const data = await response.json();
      const address = data.address || {};
      onLocationSelected({
        lat: lat ?? -6.2088,
        lng: lng ?? 106.8456,
        address: data.display_name || `${lat}, ${lng}`,
        province: address.state || "",
        city: address.city || address.town || address.municipality || "",
        district: address.suburb || address.district || "",
      });
    } catch {
      onLocationSelected({
        lat: lat ?? -6.2088,
        lng: lng ?? 106.8456,
        address: `${lat ?? -6.2088}, ${lng ?? 106.8456}`,
        province: "",
        city: "",
        district: "",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className="relative rounded-lg overflow-hidden border"
        style={{ height: "320px" }}
      >
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: position ? position[1] : 106.8456,
            latitude: position ? position[0] : -6.2088,
            zoom: position ? 15 : 13,
          }}
          mapStyle={OSM_STYLE}
          onClick={handleMapClick}
          interactive={true}
        >
          <NavigationControl position="top-right" />
          <GeolocateControl position="top-right" />
          {position && (
            <Marker longitude={position[1]} latitude={position[0]}>
              <div
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPopup(!showPopup);
                }}
              >
                <HugeiconsIcon
                  icon={MapPinIcon}
                  strokeWidth={2}
                  className="size-8 text-red-500"
                />
              </div>
              {showPopup && (
                <Popup
                  longitude={position[1]}
                  latitude={position[0]}
                  anchor="bottom"
                  onClose={() => setShowPopup(false)}
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">Lokasi Properti</p>
                    <p className="text-xs text-muted-foreground">
                      {lat!.toFixed(5)}, {lng!.toFixed(5)}
                    </p>
                  </div>
                </Popup>
              )}
            </Marker>
          )}
        </Map>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Klik peta untuk menandai lokasi properti.</span>
        {position && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUseCurrentLocation}
            disabled={loading}
          >
            {loading ? (
              <>
                <HugeiconsIcon
                  icon={LoaderPinwheelIcon}
                  strokeWidth={2}
                  className="size-3 animate-spin"
                />
                Memuat...
              </>
            ) : (
              <>
                <HugeiconsIcon
                  icon={MapPinIcon}
                  strokeWidth={2}
                  className="size-3"
                />
                Gunakan Lokasi Ini
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
