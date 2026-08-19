"use client";

import { useState, useCallback, useRef } from "react";
import Map, {
  MapRef,
  Marker,
  Popup,
  NavigationControl,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { HugeiconsIcon } from "@hugeicons/react";
import { MapPinIcon } from "@hugeicons/core-free-icons";
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

interface MarkerData {
  id: string;
  lat: number;
  lng: number;
  title: string;
  popup?: string;
  isJittered?: boolean;
}

interface MapViewProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers: MarkerData[];
  height?: string;
}

export default function MapView({
  center,
  zoom = 13,
  markers,
  height = "400px",
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const defaultCenter = center ?? { lat: -6.2088, lng: 106.8456 };
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);

  const handleMarkerClick = useCallback((marker: MarkerData) => {
    setSelectedMarker(marker);
  }, []);

  return (
    <div
      style={{
        height,
        width: "100%",
        borderRadius: "0.75rem",
        overflow: "hidden",
      }}
    >
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: defaultCenter.lng,
          latitude: defaultCenter.lat,
          zoom,
        }}
        mapStyle={OSM_STYLE}
      >
        <NavigationControl position="top-right" />
        {markers.map((marker) =>
          marker.isJittered ? (
            <Marker
              key={marker.id}
              longitude={marker.lng}
              latitude={marker.lat}
            >
              <div
                className="cursor-pointer"
                onClick={() => handleMarkerClick(marker)}
              >
                <div className="relative">
                  <div
                    className="absolute rounded-full bg-cyan-500/20"
                    style={{ width: 40, height: 40, top: -8, left: -8 }}
                  />
                  <HugeiconsIcon
                    icon={MapPinIcon}
                    strokeWidth={2}
                    className="size-6 text-cyan-500"
                  />
                </div>
              </div>
              {selectedMarker?.id === marker.id && (
                <Popup
                  longitude={marker.lng}
                  latitude={marker.lat}
                  anchor="bottom"
                  onClose={() => setSelectedMarker(null)}
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">{marker.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Lokasi Perkiraan Properti
                    </p>
                  </div>
                </Popup>
              )}
            </Marker>
          ) : (
            <Marker
              key={marker.id}
              longitude={marker.lng}
              latitude={marker.lat}
              onClick={() => handleMarkerClick(marker)}
            >
              <HugeiconsIcon
                icon={MapPinIcon}
                strokeWidth={2}
                className="size-6 text-red-500"
              />
              {selectedMarker?.id === marker.id && (
                <Popup
                  longitude={marker.lng}
                  latitude={marker.lat}
                  anchor="bottom"
                  onClose={() => setSelectedMarker(null)}
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">{marker.title}</p>
                    {marker.popup && (
                      <p className="text-xs text-muted-foreground">
                        {marker.popup}
                      </p>
                    )}
                  </div>
                </Popup>
              )}
            </Marker>
          ),
        )}
      </Map>
    </div>
  );
}
