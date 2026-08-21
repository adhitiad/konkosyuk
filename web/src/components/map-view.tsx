"use client";

import { useState, useCallback, useRef } from "react";
import Map, {
  MapRef,
  Marker,
  Popup,
  NavigationControl,
  Source,
  Layer,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { HugeiconsIcon } from "@hugeicons/react";
import { MapPinIcon, Location01Icon } from "@hugeicons/core-free-icons";
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
  userLocation?: { latitude: number; longitude: number } | null;
  radiusKm?: number;
}

export default function MapView({
  center,
  zoom = 13,
  markers,
  height = "400px",
  userLocation,
  radiusKm = 30,
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const defaultCenter = center ?? { lat: -6.2088, lng: 106.8456 };
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);

  const handleMarkerClick = useCallback((marker: MarkerData) => {
    setSelectedMarker(marker);
  }, []);

  const userLocationMarker = userLocation
    ? {
        id: "user-location",
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        title: "Lokasi Anda",
      }
    : null;

  const radiusCircle = userLocation
    ? (() => {
        const center = [userLocation.longitude, userLocation.latitude];
        const points: [number, number][] = [];
        const kmToDegLat = 1 / 111.32;
        const kmToDegLng = 1 / (111.32 * Math.cos((userLocation.latitude * Math.PI) / 180));
        const numPoints = 64;

        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * 2 * Math.PI;
          const dx = radiusKm * kmToDegLng * Math.cos(angle);
          const dy = radiusKm * kmToDegLat * Math.sin(angle);
          points.push([center[0] + dx, center[1] + dy]);
        }
        points.push(points[0]);

        return {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "Polygon" as const,
            coordinates: [points],
          },
        };
      })()
    : null;

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
        {userLocationMarker && (
          <Marker
            longitude={userLocationMarker.lng}
            latitude={userLocationMarker.lat}
            anchor="center"
          >
            <div className="relative">
              <div
                className="absolute rounded-full bg-blue-500/20"
                style={{ width: 40, height: 40, top: -12, left: -12 }}
              />
              <HugeiconsIcon
                icon={Location01Icon}
                strokeWidth={2}
                className="size-6 text-blue-500"
              />
            </div>
            <Popup
              longitude={userLocationMarker.lng}
              latitude={userLocationMarker.lat}
              anchor="bottom"
              closeButton={false}
            >
              <div className="space-y-1">
                <p className="font-semibold text-sm">Lokasi Anda</p>
              </div>
            </Popup>
          </Marker>
        )}
        {radiusCircle && (
          <Source
            id="radius-circle"
            type="geojson"
            data={radiusCircle}
          >
            <Layer
              id="radius-fill"
              type="fill"
              paint={{
                "fill-color": "#3b82f6",
                "fill-opacity": 0.1,
              }}
            />
            <Layer
              id="radius-border"
              type="line"
              paint={{
                "line-color": "#3b82f6",
                "line-opacity": 0.4,
                "line-width": 2,
                "line-dasharray": [2, 2],
              }}
            />
          </Source>
        )}
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
