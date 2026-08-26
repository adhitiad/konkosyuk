"use client";

import { useQuery } from "@tanstack/react-query";
import { PropertyCard } from "@/components/property/property-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Property } from "@/db/schema";

interface SimilarPropertiesProps {
  propertyId: string;
  limit?: number;
}

export function SimilarProperties({ propertyId, limit = 8 }: SimilarPropertiesProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["similar-properties", propertyId],
    queryFn: async () => {
      const res = await fetch(`/api/properties/${propertyId}/similar?limit=${limit}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch similar properties");
      }
      const json = await res.json();
      return json.data as Property[];
    },
    staleTime: 1000 * 60 * 60,
  });

  if (error) return null;

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Properti Serupa</h2>
        <Button variant="ghost" size="sm" render={<Link href={`/properties?similarTo=${propertyId}`} />} nativeButton={false}>
          Lihat Semua
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[200px] w-full rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[80%]" />
                <Skeleton className="h-4 w-[60%]" />
                <Skeleton className="h-4 w-[40%]" />
              </div>
            </div>
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.map((property) => (
            <PropertyCard key={property.id} property={property as Parameters<typeof PropertyCard>[0]["property"]} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">Tidak ada properti serupa saat ini.</p>
      )}
    </section>
  );
}
