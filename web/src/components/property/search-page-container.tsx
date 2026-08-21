"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FilterChipsBar } from "@/components/property/filter-chips-bar";
import { SearchBar } from "@/components/property/search-bar";
import { PropertyListPanel } from "@/components/property/property-list-panel";
import { SearchPageSplitView } from "@/components/property/search-page-split";
import MapView from "@/components/map-view";
import { useGeolocation } from "@/hooks/use-geolocation";
import { FilterChipsBarProps } from "@/components/property/filter-chips-bar";

interface PropertyItem {
  id: string;
  name: string;
  description: string | null;
  address: string;
  type: "kost" | "kontrakan";
  metadata: Record<string, unknown>;
  images: string[];
  basePrice: string | null;
  amenities: string[];
  latitude?: number | null;
  longitude?: number | null;
  distance?: number | null;
  createdAt: string;
  updatedAt: string;
  hasSeasonalPricing?: boolean;
  seasonalPricingCount?: number;
}

interface PropertyMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PropertyResponse {
  data: PropertyItem[];
  meta: PropertyMeta;
}

export function SearchPageContainer() {
  const router = useRouter();
  const gps = useGeolocation();

  const [filters, setFilters] = useState<FilterChipsBarProps["filters"]>({
    type: undefined,
    duration: undefined,
    gender: undefined,
    amenities: [],
  });
  const [mapBounds, setMapBounds] = useState<{
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
  } | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [searchQuery, setSearchQuery] = useState("");

  const params = useMemo(() => {
    const p: Record<string, string | number | undefined> = {
      page,
      limit: pageSize,
    };

    if (filters.type) p.type = filters.type;
    if (filters.duration) p.duration = filters.duration;
    if (filters.gender) p.gender = filters.gender;
    if (filters.amenities.length > 0) p.amenities = filters.amenities.join(",");
    if (searchQuery) p.search = searchQuery;
    if (gps.latitude && gps.longitude) {
      p.userLat = gps.latitude;
      p.userLng = gps.longitude;
    }
    if (mapBounds) {
      p.swLat = mapBounds.swLat;
      p.swLng = mapBounds.swLng;
      p.neLat = mapBounds.neLat;
      p.neLng = mapBounds.neLng;
    }

    return p;
  }, [filters, searchQuery, gps.latitude, gps.longitude, mapBounds, page, pageSize]);

  const { data, isLoading } = useQuery<PropertyResponse>({
    queryKey: ["properties", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          searchParams.set(key, String(value));
        }
      });

      const res = await fetch(`/api/properties?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch properties");
      const json = await res.json();
      return json.data as PropertyResponse;
    },
    staleTime: 30000,
  });

  const handleFilterChange = useCallback(
    (newFilters: FilterChipsBarProps["filters"]) => {
      setFilters(newFilters);
      setPage(1);
    },
    [],
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
  }, []);

  const handleMapBoundsChange = useCallback(
    (bounds: { swLat: number; swLng: number; neLat: number; neLng: number }) => {
      setMapBounds(bounds);
      setPage(1);
    },
    [],
  );

  const handleMarkerClick = useCallback(
    (id: string) => {
      router.push(`/properties/${id}`);
    },
    [router],
  );

  const properties = data?.data ?? [];
  const totalCount = data?.meta?.total ?? 0;

  const mapMarkers = properties
    .filter((item) => item.latitude && item.longitude)
    .map((item) => ({
      id: item.id,
      lat: Number(item.latitude),
      lng: Number(item.longitude),
      title: item.name,
      popup: item.address,
    }));

  const mapProperties = properties
    .filter((item) => item.latitude && item.longitude)
    .map((item) => ({
      id: item.id,
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      title: item.name,
      price: item.basePrice ? Number(item.basePrice) : undefined,
    }));

  return (
    <div className="h-full flex flex-col">
      <div className="space-y-4 border-b border-border pb-4">
        <SearchBar onSearch={handleSearch} />
        <FilterChipsBar filters={filters} onFilterChange={handleFilterChange} />
      </div>

      <SearchPageSplitView
        mapContent={
          <MapView
            properties={mapProperties}
            onBoundsChange={handleMapBoundsChange}
            onMarkerClick={handleMarkerClick}
            markers={mapMarkers}
            height="100%"
          />
        }
      >
        <PropertyListPanel
          properties={properties}
          loading={isLoading}
          totalCount={totalCount}
          currentPage={page}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </SearchPageSplitView>
    </div>
  );
}
