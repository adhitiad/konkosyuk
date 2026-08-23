"use client";

import { useQuery } from "@tanstack/react-query";
import { PropertyCard } from "@/components/property/property-card";
import { Button } from "@/components/ui/button";
import { Link } from "@/config";
import { Skeleton } from "@/components/ui/skeleton";

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
}

interface PropertyResponse {
  data: PropertyItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function FeaturedListingsSection() {
  const { data, isLoading } = useQuery<PropertyResponse>({
    queryKey: ["featured-properties"],
    queryFn: async () => {
      const res = await fetch("/api/properties?isFeatured=true&limit=8");
      if (!res.ok) throw new Error("Failed to fetch featured properties");
      const json = await res.json();
      return json.data as PropertyResponse;
    },
    staleTime: 60000,
  });

  return (
    <section className="bg-muted/30 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Rekomendasi <span className="text-primary">Unggulan</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Pilihan hunian terbaik yang sudah terverifikasi dan siap huni.
            </p>
          </div>
          <Link href="/properties">
            <Button variant="outline">Lihat Semua</Button>
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <Skeleton className="aspect-video w-full rounded-lg" />
                  <Skeleton className="h-5 w-3/4 rounded" />
                  <Skeleton className="h-4 w-1/2 rounded" />
                </div>
              ))
            : Array.isArray(data?.data)
              ? data.data.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))
              : null}
        </div>
      </div>
    </section>
  );
}
