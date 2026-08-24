"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";
import { captureException } from "@/lib/sentry";

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
  latitude?: number | null;
  longitude?: number | null;
}

const PLACEHOLDER_KOST =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80";
const PLACEHOLDER_KONTRAKAN =
  "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80";

export function ComparisonTable({ propertyIds }: { propertyIds: string[] }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/properties?${new URLSearchParams({
            ids: propertyIds.join(","),
          })}`,
        );
        if (!res.ok) throw new Error("Failed to fetch properties");
        const json = await res.json();
        if (json.data) {
          setProperties(json.data);
        }
      } catch (error) {
        captureException(error as Error, {
          context: "Failed to fetch comparison properties",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (propertyIds.length > 0) {
      fetchProperties();
    }
  }, [propertyIds]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {propertyIds.map((id) => (
          <Card key={id}>
            <CardContent className="p-4 space-y-4">
              <Skeleton className="aspect-video w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Tidak ada properti untuk dibandingkan.
        </CardContent>
      </Card>
    );
  }

  const allAmenities = Array.from(
    new Set(properties.flatMap((p) => p.amenities || [])),
  );

  const comparisonCategories = [
    { label: "Harga", key: "price" },
    { label: "Tipe", key: "type" },
    { label: "Lokasi", key: "location" },
    { label: "Fasilitas", key: "amenities" },
    { label: "Deskripsi", key: "description" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => {
          const displayImages =
            property.images?.length > 0
              ? property.images
              : property.metadata?.image
                ? [property.metadata.image as string]
                : [
                    property.type === "kost"
                      ? PLACEHOLDER_KOST
                      : PLACEHOLDER_KONTRAKAN,
                  ];

          const price = property.basePrice ? Number(property.basePrice) : null;

          return (
            <Card key={property.id} className="overflow-hidden">
              <div className="relative min-h-[200px]">
                <Image
                  src={displayImages[0]}
                  alt={property.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <Badge className="absolute top-3 left-3">
                  {property.type === "kost" ? "Kost" : "Kontrakan"}
                </Badge>
              </div>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-lg">{property.name}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  <span className="truncate">{property.address}</span>
                </div>
                {price && (
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(price)}
                  </p>
                )}
                {property.amenities && property.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {property.amenities.slice(0, 5).map((amenity) => (
                      <Badge
                        key={amenity}
                        variant="outline"
                        className="text-xs"
                      >
                        {amenity}
                      </Badge>
                    ))}
                    {property.amenities.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{property.amenities.length - 5}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Perbandingan Detail</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Kategori</th>
                  {properties.map((p) => (
                    <th
                      key={p.id}
                      className="text-left py-3 px-4 font-medium min-w-[200px]"
                    >
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonCategories.map((category) => (
                  <tr key={category.key} className="border-b">
                    <td className="py-3 px-4 font-medium text-muted-foreground">
                      {category.label}
                    </td>
                    {properties.map((p) => (
                      <td key={p.id} className="py-3 px-4">
                        {category.key === "price" &&
                          (p.basePrice
                            ? formatCurrency(Number(p.basePrice))
                            : "-")}
                        {category.key === "type" && (
                          <Badge variant="outline">
                            {p.type === "kost" ? "Kost" : "Kontrakan"}
                          </Badge>
                        )}
                        {category.key === "location" && (
                          <div className="flex items-center gap-1">
                            <MapPin className="size-4 shrink-0" />
                            <span className="truncate">{p.address}</span>
                          </div>
                        )}
                        {category.key === "amenities" && (
                          <div className="flex flex-wrap gap-1">
                            {p.amenities?.length > 0 ? (
                              p.amenities.slice(0, 4).map((a) => (
                                <Badge
                                  key={a}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {a}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        )}
                        {category.key === "description" && (
                          <p className="line-clamp-2 text-muted-foreground">
                            {p.description || "-"}
                          </p>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="py-3 px-4 font-medium text-muted-foreground">
                    Fasilitas Lengkap
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {allAmenities.map((amenity) => {
                          const hasIt = p.amenities?.includes(amenity);
                          return (
                            <Badge
                              key={amenity}
                              variant={hasIt ? "default" : "outline"}
                              className="text-xs"
                            >
                              {amenity}
                            </Badge>
                          );
                        })}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
