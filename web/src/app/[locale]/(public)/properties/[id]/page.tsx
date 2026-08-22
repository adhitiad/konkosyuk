import { notFound } from "next/navigation";
import Image from "next/image";
import {
  MapPin,
  Bed,
  Maximize,
  CheckCircle2,
  Wifi,
  Car,
  Wind,
  Droplets,
} from "lucide-react";
import { db } from "@/db";
import {
  properties,
  units,
  roomFacilities,
  propertyRules,
  nearbyPlaces,
  users,
  reviews,
  bookings,
} from "@/db/schema";
import { eq, and, sql, count, avg } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PropertyUnitsSection } from "@/components/property/property-units-section";
import { DetailSidebar } from "@/components/property/detail-sidebar";
import { MiniMap } from "@/components/property/mini-map";
import { NearbyPlacesList } from "@/components/property/nearby-places-list";

type AmenityIconMap = Record<
  string,
  React.ComponentType<{ className?: string }>
>;

const amenityIcons: AmenityIconMap = {
  wifi: Wifi,
  ac: Wind,
  parkir: Car,
  "kamar mandi dalam": Droplets,
};

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;

  const propertyResult = await db
    .select()
    .from(properties)
    .where(eq(properties.id, id))
    .limit(1);

  const property = propertyResult[0];

  if (!property || !property.isActive) {
    notFound();
  }

  const images =
    property.images && property.images.length > 0
      ? property.images
      : [
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
        ];

  const mainImage = images[0];
  const thumbnailImages = images.slice(1, 5);

  const propertyUnits = await db
    .select({
      id: units.id,
      name: units.name,
      description: units.description,
      price: units.price,
      capacity: units.capacity,
      size: units.size,
      status: units.status,
      roomSize: units.roomSize,
      electricityIncluded: units.electricityIncluded,
      furnitureIncluded: units.furnitureIncluded,
    })
    .from(units)
    .where(eq(units.propertyId, property.id))
    .orderBy(units.createdAt, units.name);

  const facilitiesRows = propertyUnits.length > 0
    ? await db
        .select({
          unitId: roomFacilities.unitId,
          category: roomFacilities.category,
          name: roomFacilities.name,
          icon: roomFacilities.icon,
        })
        .from(roomFacilities)
        .where(
          sql`${roomFacilities.unitId} IN (${propertyUnits.map((u) => u.id).join(",")})`,
        )
        .orderBy(roomFacilities.sortOrder, roomFacilities.name)
    : [];

  const facilitiesMap = new Map<string, {
    kamar: { name: string; icon: string }[];
    kamar_mandi: { name: string; icon: string }[];
    umum: { name: string; icon: string }[];
  }>();

  for (const unit of propertyUnits) {
    facilitiesMap.set(unit.id, {
      kamar: [],
      kamar_mandi: [],
      umum: [],
    });
  }

  for (const f of facilitiesRows) {
    const unitFacilities = facilitiesMap.get(f.unitId);
    if (!unitFacilities) continue;

    const category = f.category as keyof typeof unitFacilities;
    if (category in unitFacilities) {
      (unitFacilities as Record<string, { name: string; icon: string }[]>)[category].push({
        name: f.name,
        icon: f.icon,
      });
    }
  }

  const unitsWithFacilities = propertyUnits.map((unit) => ({
    ...unit,
    facilities: facilitiesMap.get(unit.id) ?? {
      kamar: [],
      kamar_mandi: [],
      umum: [],
    },
  }));

  const propertyRulesRows = await db
    .select({
      id: propertyRules.id,
      rule: propertyRules.rule,
      sortOrder: propertyRules.sortOrder,
    })
    .from(propertyRules)
    .where(eq(propertyRules.propertyId, property.id))
    .orderBy(propertyRules.sortOrder);

  const nearbyPlacesRows = await db
    .select({
      id: nearbyPlaces.id,
      name: nearbyPlaces.name,
      type: nearbyPlaces.type,
      distance: nearbyPlaces.distance,
      latitude: nearbyPlaces.latitude,
      longitude: nearbyPlaces.longitude,
    })
    .from(nearbyPlaces)
    .where(eq(nearbyPlaces.propertyId, property.id))
    .orderBy(nearbyPlaces.distance);

  const [ownerResult] = await db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
      activeSince: users.createdAt,
      transactionCount: sql<number>`COUNT(${bookings.id})`,
    })
    .from(users)
    .leftJoin(
      bookings,
      and(
        eq(bookings.propertyId, property.id),
        eq(bookings.status, "completed"),
      ),
    )
    .where(eq(users.id, property.ownerId))
    .groupBy(users.id);

  const owner = ownerResult
    ? {
        ...ownerResult,
        activeSince: ownerResult.activeSince,
        transactionCount: Number(ownerResult.transactionCount),
      }
    : null;

  const [ratingResult] = await db
    .select({
      averageRating: avg(reviews.rating),
      count: count(),
    })
    .from(reviews)
    .where(eq(reviews.propertyId, property.id));

  const reviewsSummary = ratingResult && Number(ratingResult.count) > 0
    ? {
        averageRating: Number(ratingResult.averageRating),
        count: Number(ratingResult.count),
      }
    : null;

  return (
    <main className="container py-8 max-w-7xl mx-auto px-4 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          {property.name}
        </h1>
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="h-5 w-5" />
          <span className="text-lg">
            {property.address}, {property.city}, {property.province}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-2xl overflow-hidden mb-8 h-[400px] md:h-[500px]">
        <div className="md:col-span-2 md:row-span-2 relative h-full">
          <Image
            src={mainImage}
            alt={property.name}
            fill
            className="object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
            priority
          />
        </div>
        <div className="hidden md:grid md:col-span-2 md:grid-cols-2 gap-2 h-full">
          {thumbnailImages.map((img, idx) => (
            <div key={idx} className="relative h-full">
              <Image
                src={img}
                alt={`${property.name} thumbnail ${idx + 1}`}
                fill
                className="object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
              />
            </div>
          ))}
          {images.length > 5 && (
            <div className="relative h-full group cursor-pointer">
              <Image
                src={thumbnailImages[thumbnailImages.length - 1]}
                alt="More"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                <span className="text-white font-semibold text-lg">
                  +{images.length - 5} Foto
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-6 min-w-0">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4 text-gray-700">
                <div className="flex items-center gap-2">
                  <Bed className="h-5 w-5 text-primary" />
                  <span>Tipe: {property.type}</span>
                </div>
                {property.packages?.custom?.enabled && (
                  <div className="flex items-center gap-2">
                    <Maximize className="h-5 w-5 text-primary" />
                    <span>
                      Min. {property.packages.custom.minDuration}{" "}
                      {property.packages.custom.unit}
                    </span>
                  </div>
                )}
              </div>
              <Separator className="my-4" />
              <h2 className="text-xl font-semibold mb-3">Deskripsi</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {property.description ||
                  "Belum ada deskripsi untuk properti ini."}
              </p>
            </CardContent>
          </Card>

          {property.amenities && property.amenities.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Fasilitas</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.amenities.map((amenity: string, idx: number) => {
                    const Icon =
                      amenityIcons[amenity.toLowerCase()] || CheckCircle2;
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 text-gray-700"
                      >
                        <Icon className="h-5 w-5 text-primary" />
                        <span className="capitalize">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <PropertyUnitsSection units={unitsWithFacilities} />

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Lokasi
                </h3>
                <p className="text-sm text-muted-foreground">
                  {property.address || property.city}
                </p>

                {property.latitude && property.longitude && (
                  <div className="h-48 rounded-xl overflow-hidden border border-border">
                    <MiniMap
                      latitude={Number(property.latitude)}
                      longitude={Number(property.longitude)}
                      nearbyPlaces={nearbyPlacesRows.map((p) => ({
                        id: p.id,
                        name: p.name,
                        latitude: Number(p.latitude),
                        longitude: Number(p.longitude),
                      }))}
                      onPlaceClick={(place) =>
                        window.open(
                          `https://www.google.com/maps/search?q=${encodeURIComponent(place.name)}@${place.latitude},${place.longitude}`,
                          "_blank",
                        )
                      }
                    />
                  </div>
                )}

                <NearbyPlacesList
                  places={nearbyPlacesRows.map((p) => ({
                    id: p.id,
                    name: p.name,
                    type: p.type,
                    distance: p.distance,
                    latitude: Number(p.latitude),
                    longitude: Number(p.longitude),
                  }))}
                  onPlaceClick={(place) =>
                    window.open(
                      `https://www.google.com/maps/search?q=${encodeURIComponent(place.name)}@${place.latitude},${place.longitude}`,
                      "_blank",
                    )
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DetailSidebar
          property={{
            id: property.id,
            title: property.name,
            price: Number(property.basePrice),
            priceUnit: "bulan",
            type: property.type,
            images,
          }}
          owner={owner}
          nearbyPlaces={nearbyPlacesRows.map((p) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            distance: p.distance,
            latitude: Number(p.latitude),
            longitude: Number(p.longitude),
          }))}
          rules={propertyRulesRows}
          reviews={reviewsSummary}
          propertyId={property.id}
        />
      </div>
    </main>
  );
}
