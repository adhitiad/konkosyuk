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
  Tag,
} from "lucide-react";
import { db } from "@/db";
import { properties, units, seasonalPricingRules } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChatTriggerButton } from "@/components/chat/chat-trigger-button";
import BookingDialogClient from "./booking-dialog";

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
  params: { id: string; locale: string };
}) {
  const property = await db.query.properties.findFirst({
    where: eq(properties.id, params.id),
  });

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

  const formatPrice = (price: string | null) => {
    if (!price) return "Hubungi Pemilik";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(price));
  };

  const seasonalRules = await db
    .select()
    .from(seasonalPricingRules)
    .where(
      and(
        eq(seasonalPricingRules.propertyId, property.id),
        eq(seasonalPricingRules.isActive, true),
      ),
    )
    .orderBy(desc(seasonalPricingRules.priority), desc(seasonalPricingRules.createdAt))
    .limit(5);

  const hasSeasonalPricing = seasonalRules.length > 0;

  const propertyUnits = await db
    .select({ id: units.id, name: units.name })
    .from(units)
    .where(eq(units.propertyId, property.id))
    .limit(20);

  const bookingUnits = propertyUnits.length > 0
    ? propertyUnits.map((u) => ({ id: u.id, name: u.name }))
    : [{ id: "unknown", name: "Unit" }];

  const seasonalRulePayload = seasonalRules.map((r) => ({
    id: r.id,
    ruleType: r.ruleType,
    adjustmentValue: r.adjustmentValue.toString(),
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    minNights: r.minNights,
    maxNights: r.maxNights,
    priority: r.priority ?? 0,
  }));

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
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
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24 border shadow-lg">
            <CardContent className="p-6 space-y-4">
              <div>
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(property.basePrice)}
                </span>
                <span className="text-gray-500"> / bulan</span>
              </div>
              {hasSeasonalPricing && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Tag className="h-3 w-3" />
                    Harga Musiman Aktif
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {seasonalRules.length} aturan aktif
                  </span>
                </div>
              )}
              <Separator />
              <div className="space-y-3">
                <BookingDialogClient
                  propertyId={property.id}
                  units={bookingUnits}
                  packages={property.packages}
                  seasonalRules={seasonalRulePayload}
                >
                  <Button className="w-full h-12 text-lg font-semibold" size="lg">
                    Ajukan Booking Sekarang
                  </Button>
                </BookingDialogClient>
                <ChatTriggerButton
                  propertyId={property.id}
                  propertyName={property.name}
                  variant="outline"
                  className="w-full h-12"
                />
                <Button variant="outline" className="w-full h-12" size="lg">
                  Hubungi Pemilik via WhatsApp
                </Button>
              </div>
              <p className="text-xs text-center text-gray-500 mt-4">
                Anda tidak akan dikenakan biaya sampai booking disetujui.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
