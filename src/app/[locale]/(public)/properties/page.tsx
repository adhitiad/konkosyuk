"use client"

import { useQuery } from "@tanstack/react-query"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useMemo, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"
import { SearchX } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/ui/pagination"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, MapsIcon, ViewAgendaIcon } from "@hugeicons/core-free-icons"
import LocationFinder from "@/components/location-finder"
import { PropertyCard } from "@/components/property-card"

const MapView = dynamic(() => import("@/components/map-view"), { ssr: false })

interface PropertyItem {
  id: string
  name: string
  description: string | null
  address: string
  type: "kost" | "kontrakan"
  metadata: Record<string, unknown>
  images: string[]
  basePrice: string | null
  amenities: string[]
  latitude?: number | null
  longitude?: number | null
  distance?: number | null
  createdAt: string
  updatedAt: string
}

interface PropertyMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface PropertyResponse {
  data: PropertyItem[]
  meta: PropertyMeta
}

const COMMON_AMENITIES = [
  "WiFi",
  "AC",
  "Laundry",
  "Parkir Motor",
  "Parkir Mobil",
  "Dapur",
  "Kamar Mandi Dalam",
  "Balcony",
]

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export default function PropertiesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [radius, setRadius] = useState(5)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000000])
  const limit = 12

  const search = searchParams.get("search") || ""
  const city = searchParams.get("city") || ""
  const type = searchParams.get("type") || "all"
  const maxPriceParam = searchParams.get("maxPrice") || ""
  const minPriceParam = searchParams.get("minPrice") || ""
  const amenitiesParam = searchParams.get("amenities") || ""

  const debouncedSearch = useDebounce(search, 500)

  useEffect(() => {
    const amenitiesArray = amenitiesParam ? amenitiesParam.split(",").filter(Boolean) : []
    setSelectedAmenities(amenitiesArray)
  }, [amenitiesParam])

  useEffect(() => {
    if (minPriceParam || maxPriceParam) {
      setPriceRange([
        Number(minPriceParam) || 0,
        Number(maxPriceParam) || 10000000,
      ])
    }
  }, [minPriceParam, maxPriceParam])

  const params = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch,
      type: type === "all" ? undefined : type,
      city: city || undefined,
      minPrice: minPriceParam || undefined,
      maxPrice: maxPriceParam || undefined,
      lat: userLocation?.lat,
      lng: userLocation?.lng,
      radius: userLocation ? radius : undefined,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
    }),
    [page, limit, debouncedSearch, type, city, minPriceParam, maxPriceParam, userLocation, radius, selectedAmenities]
  )

  const { data, isLoading, isError, error, refetch } = useQuery<PropertyResponse>({
    queryKey: ["properties", { search: debouncedSearch, city, type, minPrice: minPriceParam, maxPrice: maxPriceParam, page, userLocation, radius, amenities: selectedAmenities }],
    queryFn: async () => {
      const res = await fetch(
        `/api/properties?${new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== "")
            .reduce(
              (acc, [k, v]) => {
                if (Array.isArray(v)) {
                  acc[k] = v.join(",")
                } else {
                  acc[k] = String(v)
                }
                return acc
              },
              {} as Record<string, string>
            )
        )}`
      )
      if (!res.ok) throw new Error("Failed to fetch properties")
      const json = await res.json()
      return json.data as PropertyResponse
    },
    staleTime: 30000,
  })

  const updateFilter = useCallback((key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams.toString())
    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }
    setPage(1)
    router.push(`/properties?${newParams.toString()}`)
  }, [router, searchParams])

  const toggleAmenity = useCallback((amenity: string) => {
    const newAmenities = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter((a) => a !== amenity)
      : [...selectedAmenities, amenity]
    
    const newParams = new URLSearchParams(searchParams.toString())
    if (newAmenities.length > 0) {
      newParams.set("amenities", newAmenities.join(","))
    } else {
      newParams.delete("amenities")
    }
    setPage(1)
    router.push(`/properties?${newParams.toString()}`)
  }, [router, searchParams, selectedAmenities])

  const resetFilters = useCallback(() => {
    setPage(1)
    setUserLocation(null)
    setRadius(5)
    setSelectedAmenities([])
    setPriceRange([0, 10000000])
    router.push("/properties")
  }, [router])

  const handleLocationFound = useCallback((lat: number, lng: number, radiusKm: number) => {
    setUserLocation({ lat, lng })
    setRadius(radiusKm)
  }, [])

  const items = data?.data ?? []
  const total = data?.meta?.total ?? 0
  const totalPages = data?.meta?.totalPages ?? 1

  const mapMarkers = useMemo(
    () =>
      items
        .filter((item) => item.latitude && item.longitude)
        .map((item) => ({
          id: item.id,
          lat: Number(item.latitude),
          lng: Number(item.longitude),
          title: item.name,
          popup: item.address,
        })),
    [items]
  )

  const sortedItems = useMemo(() => {
    if (!userLocation) return items
    return [...items].sort((a, b) => {
      const distA = a.distance ?? Infinity
      const distB = b.distance ?? Infinity
      return distA - distB
    })
  }, [items, userLocation])

  const formatPrice = (value: number) => {
    if (value >= 1000000) {
      return `${value / 1000000}jt`
    }
    if (value >= 1000) {
      return `${value / 1000}k`
    }
    return value.toString()
  }

  return (
    <main className="max-w-screen-xl mx-auto px-4 lg:px-0 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Cari Kost & Kontrakan</h1>
        <p className="mt-2 text-muted-foreground">
          Temukan tempat tinggal yang sesuai dengan kebutuhanmu
        </p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2 relative">
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari lokasi, nama, atau deskripsi..."
                value={search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={type}
              onValueChange={(value) => updateFilter("type", value as string)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="kost">Kost</SelectItem>
                <SelectItem value="kontrakan">Kontrakan</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Kota"
              value={city}
              onChange={(e) => updateFilter("city", e.target.value)}
            />
            <Input
              type="number"
              placeholder="Harga Maksimal"
              value={maxPriceParam}
              onChange={(e) => updateFilter("maxPrice", e.target.value)}
              min={0}
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Fasilitas</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_AMENITIES.map((amenity) => (
                <Button
                  key={amenity}
                  type="button"
                  variant={selectedAmenities.includes(amenity) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleAmenity(amenity)}
                >
                  {amenity}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Rentang Harga</p>
              <span className="text-sm text-muted-foreground">
                {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                placeholder="Min"
                value={priceRange[0] || ""}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setPriceRange([val, priceRange[1]])
                  updateFilter("minPrice", val > 0 ? String(val) : "")
                }}
                min={0}
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="number"
                placeholder="Max"
                value={priceRange[1] || ""}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setPriceRange([priceRange[0], val])
                  updateFilter("maxPrice", val > 0 ? String(val) : "")
                }}
                min={0}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <LocationFinder onLocationFound={handleLocationFound} />
              {userLocation && (
                <select
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="h-9 rounded-4xl border border-input bg-input/30 px-3 py-1 text-sm"
                >
                  <option value="1">1 km</option>
                  <option value="5">5 km</option>
                  <option value="10">10 km</option>
                  <option value="25">25 km</option>
                </select>
              )}
              {userLocation && (
                <Button variant="ghost" size="sm" onClick={() => { setUserLocation(null); setRadius(5) }}>
                  Reset Lokasi
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-4xl border p-1">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon-sm"
                  onClick={() => setViewMode('list')}
                >
                  <HugeiconsIcon icon={ViewAgendaIcon} strokeWidth={2} className="size-4" />
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="icon-sm"
                  onClick={() => setViewMode('map')}
                >
                  <HugeiconsIcon icon={MapsIcon} strokeWidth={2} className="size-4" />
                </Button>
              </div>
              <Button variant="outline" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
          {Array.from({ length: limit }).map((_, i) => (
            <Card key={i} className="flex flex-col overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="mt-auto flex items-center justify-between">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <ErrorState
          title="Gagal Memuat Properti"
          description={error instanceof Error ? error.message : "Gagal memuat data properti. Silakan coba lagi."}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          icon={SearchX}
          title="Tidak Ditemukan"
          description="Coba ubah filter lokasi, harga, atau fasilitas Anda."
          actionLabel="Reset Filter"
          onAction={() => router.push('/properties')}
        />
      )}

      {!isLoading && !isError && items.length > 0 && viewMode === 'map' ? (
        <Card className="mt-8">
          <CardContent className="p-4">
            <MapView
              center={userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined}
              markers={mapMarkers}
              height="500px"
            />
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isError && items.length > 0 && viewMode === 'list' && (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
            {sortedItems.map((item) => (
              <PropertyCard key={item.id} property={item} />
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </main>
  )
}