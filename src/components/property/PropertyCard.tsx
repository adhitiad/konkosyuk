"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/currency";

export interface PropertyCardData {
  id: string;
  name: string;
  type: "kost" | "kontrakan" | "ruko";
  city: string;
  province: string;
  basePrice: string | null;
  images: string[];
  amenities?: string[];
  rating?: number;
  reviewCount?: number;
}

interface PropertyCardProps {
  property: PropertyCardData;
  priority?: boolean;
}

export default function PropertyCard({ property, priority = false }: PropertyCardProps) {
  const firstImage = property.images?.[0] || "/placeholder-property.jpg";

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <Image
          src={firstImage}
          alt={property.name}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 hover:scale-105"
          placeholder="blur"
          blurDataURL="/placeholder-blur.jpg"
        />
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="capitalize">
            {property.type}
          </Badge>
        </div>
        {property.rating && (
          <div className="absolute top-2 right-2">
            <Badge variant="default" className="gap-1">
              <span>⭐</span>
              <span>{property.rating.toFixed(1)}</span>
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="line-clamp-1 text-base font-semibold">
          {property.name}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {property.city}, {property.province}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-primary">
              {property.basePrice ? formatCurrency(Number(property.basePrice)) : "Hubungi owner"}
            </p>
            <p className="text-xs text-muted-foreground">per bulan</p>
          </div>
          {property.reviewCount !== undefined && (
            <p className="text-xs text-muted-foreground">
              {property.reviewCount} review
            </p>
          )}
        </div>

        {property.amenities && property.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {property.amenities.slice(0, 3).map((amenity) => (
              <span
                key={amenity}
                className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
              >
                {amenity}
              </span>
            ))}
            {property.amenities.length > 3 && (
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                +{property.amenities.length - 3}
              </span>
            )}
          </div>
        )}

        <Link
          href={`/properties/${property.id}`}
          className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Lihat Detail
        </Link>
      </CardContent>
    </Card>
  );
}
