"use client";

import { useEffect, useState, useCallback } from "react";
import Map, {
  Source,
  Layer,
  Popup,
  NavigationControl,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Loader2, AlertCircle } from "lucide-react";

// --- TIPE DATA ---
interface GeoJSONFeature {
  type: "Feature";
  properties: { name: string; [key: string]: any };
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] };
}
interface GeoJSONData {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}
interface RegionData {
  province?: string;
  city?: string;
  district?: string;
  count: number;
}
interface IndonesiaMapProps {
  data: RegionData[];
  filterType: "user" | "owner";
}

// --- CARTO BASEMAP STYLE ---
// Style mirip Google Maps, ringan dan bersih
const OSM_STYLE = {
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

export default function IndonesiaMap({ data, filterType }: IndonesiaMapProps) {
  const [geoJsonData, setGeoJsonData] = useState<GeoJSONData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [popupInfo, setPopupInfo] = useState<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // 1. Load GeoJSON Lokal
  useEffect(() => {
    const loadGeoJSON = async () => {
      try {
        setLoading(true);
        const response = await fetch("/geojson/indonesia.geojson");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const jsonData = await response.json();
        setGeoJsonData(jsonData);
      } catch (err) {
        console.error("[Map] ❌ GeoJSON error:", err);
        setError("Gagal memuat data wilayah.");
      } finally {
        setLoading(false);
      }
    };
    loadGeoJSON();
  }, []);

  // 2. Merge Data Statistik ke GeoJSON
  const mergedGeoJSON = useCallback((): GeoJSONData | null => {
    if (!geoJsonData) return null;
    const regionMap: Record<string, number> = {};
    data.forEach((region) => {
      const key = (
        region.province ||
        region.city ||
        region.district ||
        ""
      ).toLowerCase();
      regionMap[key] = region.count;
    });

    return {
      ...geoJsonData,
      features: geoJsonData.features.map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          count: regionMap[(feature.properties.name || "").toLowerCase()] || 0,
        },
      })),
    };
  }, [geoJsonData, data]);

  // 3. Handle Interaksi
  const handleFeatureClick = useCallback((event: any) => {
    const feature = event.features?.[0];
    if (feature) {
      setPopupInfo({
        longitude: event.lngLat.lng,
        latitude: event.lngLat.lat,
        feature,
      });
    }
  }, []);

  if (error) {
    return (
      <div className="h-[600px] w-full flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
        <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  const finalGeoJSON = mergedGeoJSON();

  return (
    <div className="relative h-[600px] w-full bg-gray-200 rounded-lg overflow-hidden shadow-lg border border-gray-300">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-600">Memuat peta...</span>
        </div>
      )}

      {finalGeoJSON && !loading && (
        <Map
          initialViewState={{ longitude: 118, latitude: -2, zoom: 4 }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={OSM_STYLE as any}
          onLoad={(e) => {
            setMapLoaded(true);
          }}
          onError={(e) => {
            console.error("[Map] ❌ Map error:", e.error);
          }}
          interactiveLayerIds={["region-fill"]}
          onClick={handleFeatureClick}
        >
          <NavigationControl position="top-right" showCompass={false} />

          <Source
            id="indonesia-regions"
            type="geojson"
            data={finalGeoJSON as any}
          >
            <Layer
              id="region-fill"
              type="fill"
              paint={{
                "fill-color": [
                  "interpolate",
                  ["linear"],
                  ["get", "count"],
                  0,
                  "#e5e7eb",
                  10,
                  "#93c5fd",
                  50,
                  "#3b82f6",
                  100,
                  "#1d4ed8",
                  500,
                  "#1e3a8a",
                ],
                "fill-opacity": 0.6,
                "fill-outline-color": "#ffffff",
              }}
            />
          </Source>

          {popupInfo && (
            <Popup
              longitude={popupInfo.longitude}
              latitude={popupInfo.latitude}
              onClose={() => setPopupInfo(null)}
              anchor="bottom-left"
              className="z-30"
            >
              <div className="p-2">
                <h3 className="font-bold text-sm">
                  {popupInfo.feature.properties.name}
                </h3>
                <p className="text-xs text-gray-600">
                  Total:{" "}
                  <span className="font-bold text-primary">
                    {popupInfo.feature.properties.count || 0}
                  </span>
                </p>
              </div>
            </Popup>
          )}
        </Map>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-lg border border-gray-200 z-10">
        <h4 className="text-xs font-bold text-gray-700 mb-2">
          Jumlah {filterType === "user" ? "User" : "Owner"}
        </h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 rounded border border-gray-400"></div>
            <span className="text-xs text-gray-600">0</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-300 rounded border border-blue-400"></div>
            <span className="text-xs text-gray-600">10-49</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-700 rounded border border-blue-800"></div>
            <span className="text-xs text-gray-600">100+</span>
          </div>
        </div>
      </div>
    </div>
  );
}
