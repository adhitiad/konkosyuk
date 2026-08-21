"use client";

import { PropertyCard } from "@/components/property/property-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useRouter } from "next/navigation";

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

interface PropertyListPanelProps {
  properties: PropertyItem[];
  loading: boolean;
  totalCount: number;
  onPageChange: (page: number) => void;
  currentPage: number;
  pageSize: number;
}

export function PropertyListPanel({
  properties,
  loading,
  totalCount,
  onPageChange,
  currentPage,
  pageSize,
}: PropertyListPanelProps) {
  const router = useRouter();
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-4 space-y-3">
      <p className="text-sm text-muted-foreground px-1">
        Menampilkan {properties.length} dari {totalCount} properti
      </p>

      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          distanceKm={property.distance ?? null}
        />
      ))}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
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

      {!loading && properties.length === 0 && (
        <EmptyState
          icon={SearchX}
          title="Tidak Ditemukan"
          description="Coba ubah filter lokasi, harga, atau fasilitas Anda."
          actionLabel="Reset Filter"
          onAction={() => {
            router.push("/properties");
          }}
        />
      )}

      {totalCount > pageSize && (
        <div className="flex justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Sebelumnya
          </Button>
          <span className="px-3 py-1.5 text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Selanjutnya
          </Button>
        </div>
      )}
    </div>
  );
}
