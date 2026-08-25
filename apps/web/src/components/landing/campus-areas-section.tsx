"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCloudinaryUrl } from "@/lib/cloudinary";

interface Area {
  id: string;
  slug: string;
  name: string;
  imageKey: string;
  propertyCount: number;
}

function CampusCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card animate-pulse">
      <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0" />
      <div className="space-y-2 flex-1">
        <div className="h-4 bg-muted rounded w-2/3" />
        <div className="h-3 bg-muted rounded w-1/3" />
      </div>
    </div>
  );
}

export function CampusAreasSection() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/campus-areas")
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
      <section className="py-12 px-4 md:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Kos Sekitar Kampus
              </h2>
              <p className="text-muted-foreground mt-1">
                Cari kos dekat kampus impianmu
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CampusCardSkeleton key={i} />
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
    <section className="py-12 px-4 md:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Kos Sekitar Kampus
            </h2>
            <p className="text-muted-foreground mt-1">
              Cari kos dekat kampus impianmu
            </p>
          </div>
          <Link
            href="/properties?type=kampus"
            className="hidden md:block text-sm text-primary hover:underline"
          >
            Lihat Semua →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {areas.map((area) => (
            <Link
              key={area.id}
              href={`/properties?campus=${area.slug}`}
              className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/20 transition-all duration-200"
            >
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <Image
                  src={getCloudinaryUrl(area.imageKey, {
                    width: 96,
                    height: 96,
                    quality: 80,
                  })}
                  alt={area.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>

              <div className="min-w-0">
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
            href="/properties?type=kampus"
            className="text-sm text-primary hover:underline"
          >
            Lihat Semua Kampus →
          </Link>
        </div>
      </div>
    </section>
  );
}
