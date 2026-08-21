"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tag01Icon } from "@hugeicons/core-free-icons";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

interface Property {
  id: string;
  name: string;
  description: string | null;
  address: string;
  type: "kost" | "kontrakan";
  basePrice: string | null;
  amenities: string[];
  images: string[];
  metadata: Record<string, unknown>;
  hasSeasonalPricing?: boolean;
  seasonalPricingCount?: number;
}

const PLACEHOLDER_KOST =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80";
const PLACEHOLDER_KONTRAKAN =
  "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const displayImages =
    property.images?.length > 0
      ? property.images
      : property.metadata?.image
        ? [property.metadata.image as string]
        : [property.type === "kost" ? PLACEHOLDER_KOST : PLACEHOLDER_KONTRAKAN];

  const price = property.basePrice ? Number(property.basePrice) : null;
  const topAmenities = property.amenities?.slice(0, 3) ?? [];

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border bg-background shadow-sm transition-all hover:shadow-md h-full">
      {/* Image Carousel Section */}
      <div className="relative aspect-video w-full bg-muted">
        <Carousel className="w-full h-full">
          <CarouselContent className="h-full">
            {displayImages.map((imgSrc, index) => (
              <CarouselItem
                key={`${property.id}-img-${index}`}
                className="h-full"
              >
                <div className="relative w-full h-full">
                  <Image
                    src={imgSrc}
                    alt={`${property.name} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={index === 0}
                  />

                  {/* Badge Tipe Properti di atas gambar */}
                  {index === 0 && (
                    <Badge className="absolute top-3 left-3 bg-background/90 text-foreground backdrop-blur-sm border-0">
                      {property.type === "kost" ? "Kost" : "Kontrakan"}
                    </Badge>
                  )}

                  {/* Seasonal Pricing Badge */}
                  {index === 0 && property.hasSeasonalPricing && (
                    <Badge
                      variant="secondary"
                      className="absolute top-3 left-3 mt-8 bg-orange-100 text-orange-700 border-orange-200"
                    >
                      <HugeiconsIcon
                        icon={Tag01Icon}
                        strokeWidth={2}
                        className="size-3 mr-1"
                      />
                      Harga Musiman
                    </Badge>
                  )}

                  {/* Image Counter */}
                  {displayImages.length > 1 && (
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 text-white text-xs rounded-md backdrop-blur-sm">
                      {index + 1} / {displayImages.length}
                    </div>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation Buttons - visible on hover */}
          {displayImages.length > 1 && (
            <>
              <CarouselPrevious
                className={cn(
                  "left-2 h-8 w-8 bg-background/80 hover:bg-background border-0 opacity-0 group-hover:opacity-100 transition-opacity",
                )}
              />
              <CarouselNext
                className={cn(
                  "right-2 h-8 w-8 bg-background/80 hover:bg-background border-0 opacity-0 group-hover:opacity-100 transition-opacity",
                )}
              />
            </>
          )}
        </Carousel>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate font-semibold">{property.name}</h3>
        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-4 shrink-0" />
          <span className="truncate">{property.address}</span>
        </div>

        {topAmenities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {topAmenities.map((amenity) => (
              <Badge key={amenity} variant="outline" className="text-xs">
                {amenity}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between border-t p-4">
        {price ? (
          <div>
            <p className="text-xs text-muted-foreground">Harga per bulan</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(price)}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xs text-muted-foreground">Harga</p>
            <p className="text-lg font-bold text-primary">Hubungi Kami</p>
          </div>
        )}
        <Button
          render={<Link href={`/properties/${property.id}`} />}
          nativeButton={false}
          size="sm"
        >
          Lihat Detail
        </Button>
      </div>
    </div>
  );
}
