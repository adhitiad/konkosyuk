"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import Map, {
  Source,
  Layer,
  Popup,
  NavigationControl,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Loader2, MapPin, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { Link } from "@/config";

// --- TIPE DATA ---
export interface PropertyMapPoint {
  id: string;
  name: string;
  price?: number | string | null;
  latitude?: number | null;
  longitude?: number | null;
  type?: "kost" | "kontrakan" | "ruko";
}

export interface MapWithSearchProps {
  properties: PropertyMapPoint[];
  height?: string;
  className?: string;
  defaultStyle?: "light" | "dark" | "satellite";
  onLocationSelect?: (location: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
}

// --- WARNA ---
const MARKER_COLOR = "#4f46e5";
const MARKER_STROKE = "#ffffff";
const USER_MARKER_COLOR = "#ef4444";

// --- STYLE: Stadia Maps ---
const STADIA_STYLES = {
  light: "alidade_smooth",
  dark: "alidade_smooth_dark",
  satellite: "stadia_satellite",
} as const;

function buildStadiaStyle(
  styleKey: "light" | "dark" | "satellite",
  apiKey: string,
): string {
  const styleName = STADIA_STYLES[styleKey];
  return `https://tiles.stadiamaps.com/styles/${styleName}.json?api_key=${apiKey}`;
}

// --- HELPER: Format harga ---
function getDisplayPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined) return "Hubungi owner";
  const numeric = typeof price === "string" ? Number(price) : price;
  if (Number.isNaN(numeric)) return "Hubungi owner";
  return formatCurrency(numeric);
}

// --- TIPE DATA: Geocoding result ---
interface GeocodingFeature {
  geometry: {
    coordinates: [number, number];
    type: "Point";
  };
  properties: {
    name?: string;
    address?: string;
    country?: string;
    city?: string;
    country_code?: string;
  };
}

export default function MapWithSearch({
  properties,
  height = "500px",
  className = "",
  defaultStyle = "light",
  onLocationSelect,
}: MapWithSearchProps) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [popupInfo, setPopupInfo] = useState<{
    longitude: number;
    latitude: number;
    property: PropertyMapPoint;
  } | null>(null);
  const [activeStyle, setActiveStyle] = useState<"light" | "dark" | "satellite">(
    defaultStyle,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodingFeature[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [showResults, setShowResults] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  const apiKey = process.env.NEXT_PUBLIC_STADIA_MAPS_API_KEY;
  const mapStyle = useMemo(() => {
    if (!apiKey) return null;
    return buildStadiaStyle(activeStyle, apiKey);
  }, [activeStyle, apiKey]);

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

  // Build GeoJSON untuk marker properti
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

  // Build GeoJSON untuk marker user location
  const userMarkerGeoJSON = useMemo(() => {
    if (!selectedLocation) return null;
    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "Point" as const,
            coordinates: [selectedLocation.longitude, selectedLocation.latitude],
          },
        },
      ],
    };
  }, [selectedLocation]);

  const defaultCenter: [number, number] = [-6.200000, 106.816666];

  const missingApiKey = !apiKey;

  // --- GEOCODING SEARCH ---
  useEffect(() => {
    if (!searchQuery.trim() || !apiKey) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const url = `https://api.stadiamaps.com/geocoding/v1/search?api_key=${apiKey}&text=${encodeURIComponent(searchQuery)}&language=id&country=ID&limit=5`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Geocoding failed");
        const data = await res.json();
        setSearchResults(data.features || []);
      } catch (err) {
        console.error("[MapWithSearch] Geocoding error:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, apiKey]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchFocus = () => {
    setShowResults(true);
  };

  const handleResultClick = (feature: GeocodingFeature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const name = feature.properties.name || "Lokasi";
    const address =
      feature.properties.address ||
      [feature.properties.city, feature.properties.country]
        .filter(Boolean)
        .join(", ") ||
      name;

    const location = { name, address, latitude: lat, longitude: lng };
    setSelectedLocation(location);
    setSearchQuery(address);
    setShowResults(false);
    setSearchResults([]);

    // Fly to location
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 14,
        duration: 1500,
      });
    }

    onLocationSelect?.(location);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedLocation(null);
  };

  const handleMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature) return;

      const props = feature.properties as Record<string, any>;
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

      {/* Search box */}
      {!missingApiKey && (
        <div ref={searchRef} className="absolute top-4 left-4 z-10 w-full max-w-md">
          <div className="relative">
            <div className="flex items-center rounded-lg bg-white/90 backdrop-blur shadow-sm border">
              <MapPin className="ml-3 size-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
                placeholder="Cari lokasi..."
                className="w-full bg-transparent px-3 py-2 text-sm outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="mr-2 rounded-full p-1 hover:bg-gray-100"
                >
                  <X className="size-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Search results dropdown */}
            {showResults && (searchResults.length > 0 || isSearching) && (
              <div className="mt-1 max-h-80 overflow-y-auto rounded-lg bg-white shadow-lg border">
                {isSearching ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">
                      Mencari...
                    </span>
                  </div>
                ) : (
                  searchResults.map((feature, index) => {
                    const [lng, lat] = feature.geometry.coordinates;
                    const name = feature.properties.name || "Lokasi";
                    const address =
                      feature.properties.address ||
                      [feature.properties.city, feature.properties.country]
                        .filter(Boolean)
                        .join(", ") ||
                      name;

                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleResultClick(feature)}
                        className="flex w-full flex-col items-start px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <span className="text-sm font-medium text-gray-900">
                          {name}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {address}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Style switcher */}
      {!missingApiKey && (
        <div className="absolute top-4 right-14 z-10 flex rounded-lg bg-white/90 backdrop-blur shadow-sm border">
          {(
            [
              { key: "light", label: "Light" },
              { key: "dark", label: "Dark" },
              { key: "satellite", label: "Satellite" },
            ] as const
          ).map((style) => (
            <button
              key={style.key}
              type="button"
              onClick={() => setActiveStyle(style.key)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                activeStyle === style.key
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-600 hover:text-gray-900"
              } ${style.key === "light" ? "rounded-l-lg" : ""} ${
                style.key === "satellite" ? "rounded-r-lg" : ""
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      )}

      {missingApiKey ? (
        <div className="flex h-full items-center justify-center text-sm text-red-600">
          <p>
            NEXT_PUBLIC_STADIA_MAPS_API_KEY belum diatur. Tambahkan di
            .env.local.
          </p>
        </div>
      ) : (
        <Map
          ref={mapRef}
          key={mapStyle}
          initialViewState={{
            longitude: defaultCenter[1],
            latitude: defaultCenter[0],
            zoom: 11,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={mapStyle!}
          interactiveLayerIds={["unclustered-point"]}
          onClick={handleMapClick}
          onLoad={() => setMapLoaded(true)}
          onError={(e) =>
            console.error("[MapWithSearch] Map error:", e.error)
          }
        >
          <NavigationControl position="top-right" showCompass={false} />

          {/* Marker properti */}
          <Source
            id="properties"
            type="geojson"
            data={geojson}
            cluster={true}
            clusterRadius={50}
            clusterMaxZoom={14}
          >
            <Layer
              id="clusters"
              type="circle"
              filter={["has", "point_count"]}
              paint={{
                "circle-color": "#4f46e5",
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
                "text-color": "#ffffff",
              }}
            />

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

          {/* Marker lokasi user/search */}
          {userMarkerGeoJSON && (
            <Source id="user-location" type="geojson" data={userMarkerGeoJSON}>
              <Layer
                id="user-marker"
                type="circle"
                paint={{
                  "circle-color": USER_MARKER_COLOR,
                  "circle-radius": 10,
                  "circle-stroke-width": 3,
                  "circle-stroke-color": "#ffffff",
                }}
              />
            </Source>
          )}

          {/* Popup properti */}
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
      )}
    </div>
  );
}
