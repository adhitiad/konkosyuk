"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCloudinaryUrl } from "@/lib/cloudinary";

interface Area {
  id: string;
  slug: string;
  name: string;
  imageKey: string;
  propertyCount: number;
}

function AreaCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}

export function PopularAreasSection() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/popular-areas")
      .then((r) => r.json())
      .then((data) => {
        setAreas(data.areas || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <section className="py-12 px-4 md:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Area Kos Terpopuler
              </h2>
              <p className="text-muted-foreground mt-1">
                Temukan kosan di kota-kota besar Indonesia
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <AreaCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (areas.length === 0) {
    return null;
  }

  return (
    <section className="py-12 px-4 md:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Area Kos Terpopuler
            </h2>
            <p className="text-muted-foreground mt-1">
              Temukan kosan di kota-kota besar Indonesia
            </p>
          </div>
          <Link
            href="/properties"
            className="hidden md:block text-sm text-primary hover:underline"
          >
            Lihat Semua →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {areas.map((area) => (
            <Link
              key={area.id}
              href={`/properties?area=${area.slug}`}
              className="group relative overflow-hidden rounded-xl border border-border bg-card hover:shadow-md transition-all duration-200"
            >
              <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                <img
                  src={getCloudinaryUrl(area.imageKey, {
                    width: 400,
                    quality: 80,
                  })}
                  alt={area.name}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>

              <div className="p-3">
                <h3 className="font-semibold text-foreground text-sm truncate">
                  {area.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {area.propertyCount} properti
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-4 text-center md:hidden">
          <Link
            href="/properties"
            className="text-sm text-primary hover:underline"
          >
            Lihat Semua Area →
          </Link>
        </div>
      </div>
    </section>
  );
}
