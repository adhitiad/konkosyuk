"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/config";
import { Skeleton } from "@/components/ui/skeleton";
import { getCloudinaryUrl } from "@/lib/cloudinary";
import { apiClient } from "@/lib/axios";

interface Area {
  id: string;
  slug: string;
  name: string;
  imageKey: string;
  propertyCount: number;
}

interface PopularAreasResponse {
  areas: Area[];
}

function AreaCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

export function PopularAreasSection() {
  const t = useTranslations("popularAreas");

  const { data, isLoading } = useQuery<PopularAreasResponse>({
    queryKey: ["popular-areas"],
    queryFn: async () => {
      const response = await apiClient.get("/api/popular-areas");
      if (!response.data.success) {
        throw new Error("Failed to fetch popular areas");
      }
      return response.data.data as PopularAreasResponse;
    },
    staleTime: 5 * 60 * 1000,
  });

  const areas = data?.areas ?? [];

  if (isLoading) {
    return (
      <section className="py-12 px-4 md:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                {t("title")}
              </h2>
              <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
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
              {t("title")}
            </h2>
            <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
          </div>
          <Link
            href="/properties"
            className="hidden md:block text-sm text-primary hover:underline"
          >
            {t("viewAll")} →
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
                <Image
                  src={getCloudinaryUrl(area.imageKey, {
                    width: 400,
                    quality: 80,
                  })}
                  alt={area.name}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>

              <div className="p-3">
                <h3 className="font-semibold text-foreground text-sm truncate">
                  {area.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("propertyCount", { count: area.propertyCount })}
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
            {t("viewAllMobile")} →
          </Link>
        </div>
      </div>
    </section>
  );
}
