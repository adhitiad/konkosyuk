"use client";

import { Star } from "lucide-react";
import { PropertyRulesList } from "@/components/property/property-rules-list";
import { NearbyPlacesList } from "@/components/property/nearby-places-list";
import { OwnerProfileCard } from "@/components/property/owner-profile-card";
import { Button } from "@/components/ui/button";

interface Property {
  id: string;
  title: string;
  price: number;
  priceUnit: string;
  type: string;
  images: string[];
}

interface Owner {
  name: string;
  image: string | null;
  activeSince: Date | string;
  transactionCount: number;
}

interface NearbyPlace {
  id: string;
  name: string;
  type: string;
  distance: number;
  latitude: number;
  longitude: number;
}

interface ReviewSummary {
  averageRating: number;
  count: number;
}

interface DetailSidebarProps {
  property: Property;
  owner: Owner | null;
  nearbyPlaces: NearbyPlace[];
  rules: Array<{ id: string; rule: string; sortOrder: number }>;
  reviews: ReviewSummary | null;
  propertyId: string;
}

function StarRating({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

export function DetailSidebar({
  property,
  owner,
  nearbyPlaces,
  rules,
  reviews,
  propertyId,
}: DetailSidebarProps) {
  return (
    <div className="w-full lg:w-[340px] lg:sticky lg:top-20 lg:self-start space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Harga</p>
          <p className="text-2xl font-bold text-foreground">
            Rp {property.price.toLocaleString("id-ID")}
            <span className="text-sm font-normal text-muted-foreground">/{property.priceUnit}</span>
          </p>
        </div>

        <Button className="w-full h-12 text-lg font-semibold" size="lg">
          Ajukan Sewa
        </Button>

        <div className="flex flex-wrap gap-2 mt-2">
          <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            {property.type}
          </span>
          {property.images.length > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs">
              {property.images.length} foto
            </span>
          )}
        </div>
      </div>

      {reviews && reviews.count > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <StarRating rating={Math.round(reviews.averageRating)} className="w-5 h-5" />
            <span className="text-sm font-medium">{reviews.averageRating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">
              ({reviews.count} review)
            </span>
          </div>
        </div>
      )}

      {owner && (
        <OwnerProfileCard owner={owner} propertyId={propertyId} />
      )}

      {rules.length > 0 && (
        <PropertyRulesList rules={rules} />
      )}

      {nearbyPlaces.length > 0 && (
        <NearbyPlacesList places={nearbyPlaces} />
      )}
    </div>
  );
}
