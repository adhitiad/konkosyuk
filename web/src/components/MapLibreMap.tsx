"use client";

import { useMemo, useState, useCallback } from "react";
import Map, {
  Source,
  Layer,
  Popup,
  NavigationControl,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { Link } from "@/config";
import { KONKOSYUK_MAP_STYLE } from "@/lib/maplibre-style";

export interface MapProperty {
  id: string;
  name: string;
  price?: number | string | null;
  latitude?: number | null;
  longitude?: number | null;
  type?: "kost" | "kontrakan" | "ruko";
}

export interface MapLibreMapProps {
  properties: MapProperty[];
  height?: string;
  className?: string;
}

// --- WARNA ---
const CLUSTER_COLOR = "#4f46e5";
const CLUSTER_TEXT_COLOR = "#ffffff";
const MARKER_COLOR = "#10b981";
const MARKER_STROKE = "#ffffff";

// --- HELPER: Format harga ---
function getDisplayPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined) return "Hubungi owner";
  const numeric = typeof price === "string" ? Number(price) : price;
  if (Number.isNaN(numeric)) return "Hubungi owner";
  return formatCurrency(numeric);
}

export default function MapLibreMap({
  properties,
  height = "500px",
  className = "",
}: MapLibreMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [popupInfo, setPopupInfo] = useState<{
    longitude: number;
    latitude: number;
    property: MapProperty;
  } | null>(null);

  // Filter properti yang punya koordinat
  const validProperties = useMemo(
    () =>
      properties.filter(
        (p) =>
          typeof p.latitude === "number" &&
          typeof p.longitude === "number" &&
          !Number.isNaN(p.latitude) &&
          !Number.isNaN(p.longitude),
      ),
    [properties],
  );

  // Build GeoJSON untuk clustering
  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: validProperties.map((property) => ({
        type: "Feature" as const,
        properties: {
          id: property.id,
          name: property.name,
          price: property.price,
          type: property.type,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [property.longitude!, property.latitude!],
        },
      })),
    }),
    [validProperties],
  );

  const handleMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature) return;

      const props = feature.properties as Record<string, unknown>;
      const property = validProperties.find((p) => p.id === props.id);
      if (!property) return;

      setPopupInfo({
        longitude: event.lngLat.lng,
        latitude: event.lngLat.lat,
        property,
      });
    },
    [validProperties],
  );

  const handleClosePopup = useCallback(() => {
    setPopupInfo(null);
  }, []);

  const defaultCenter: [number, number] = [-6.2, 106.816666];

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border bg-gray-100 ${className}`}
      style={{ height }}
    >
      {/* Loading state */}
      {!mapLoaded && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Memuat peta...</p>
        </div>
      )}

      <Map
        initialViewState={{
          longitude: defaultCenter[1],
          latitude: defaultCenter[0],
          zoom: 11,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={KONKOSYUK_MAP_STYLE}
        interactiveLayerIds={["unclustered-point"]}
        onClick={handleMapClick}
        onLoad={() => setMapLoaded(true)}
        onError={(e) => console.error("[MapLibreMap] Map error:", e.error)}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {/* Sumber data dengan clustering bawaan MapLibre */}
        <Source
          id="properties"
          type="geojson"
          data={geojson}
          cluster={true}
          clusterRadius={50}
          clusterMaxZoom={14}
        >
          {/* Layer cluster: lingkaran indigo */}
          <Layer
            id="clusters"
            type="circle"
            filter={["has", "point_count"]}
            paint={{
              "circle-color": CLUSTER_COLOR,
              "circle-radius": [
                "step",
                ["get", "point_count"],
                20,
                10,
                30,
                50,
                40,
              ],
              "circle-stroke-width": 3,
              "circle-stroke-color": "#ffffff",
            }}
          />

          {/* Layer cluster: jumlah properti */}
          <Layer
            id="cluster-count"
            type="symbol"
            filter={["has", "point_count"]}
            layout={{
              "text-field": "{point_count_abbreviated}",
              "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
              "text-size": 12,
            }}
            paint={{
              "text-color": CLUSTER_TEXT_COLOR,
            }}
          />

          {/* Layer individual: lingkaran emerald */}
          <Layer
            id="unclustered-point"
            type="circle"
            filter={["!", ["has", "point_count"]]}
            paint={{
              "circle-color": MARKER_COLOR,
              "circle-radius": 8,
              "circle-stroke-width": 2,
              "circle-stroke-color": MARKER_STROKE,
            }}
          />
        </Source>

        {/* Popup untuk titik individual */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            onClose={handleClosePopup}
            anchor="bottom"
            closeButton={true}
            closeOnClick={false}
          >
            <div className="space-y-2 p-1">
              <p className="font-semibold text-sm text-gray-900">
                {popupInfo.property.name}
              </p>
              {popupInfo.property.type && (
                <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 capitalize">
                  {popupInfo.property.type}
                </span>
              )}
              <p className="text-sm font-medium text-primary">
                {getDisplayPrice(popupInfo.property.price)}
              </p>
              <Link
                href={`/properties/${popupInfo.property.id}`}
                className="inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                Lihat Detail
              </Link>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
