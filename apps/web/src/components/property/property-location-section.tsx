"use client";

import { MiniMap } from "@/components/property/mini-map";
import { NearbyPlacesList } from "@/components/property/nearby-places-list";

interface PropertyLocationSectionProps {
  latitude: number;
  longitude: number;
  nearbyPlaces: {
    id: string;
    name: string;
    type: string;
    distance: number;
    latitude: number;
    longitude: number;
  }[];
}

export function PropertyLocationSection({
  latitude,
  longitude,
  nearbyPlaces,
}: PropertyLocationSectionProps) {
  const handlePlaceClick = (place: {
    name: string;
    latitude: number;
    longitude: number;
  }) => {
    window.open(
      `https://www.google.com/maps/search?q=${encodeURIComponent(place.name)}@${place.latitude},${place.longitude}`,
      "_blank",
    );
  };

  const mapPlaces = nearbyPlaces?.map((p) => ({
    id: p.id,
    name: p.name,
    latitude: p.latitude,
    longitude: p.longitude,
  }));

  return (
    <div className="space-y-4">
      <div className="h-48 rounded-xl overflow-hidden border border-border">
        <MiniMap
          latitude={latitude}
          longitude={longitude}
          nearbyPlaces={mapPlaces}
          onPlaceClick={handlePlaceClick}
        />
      </div>
      <NearbyPlacesList places={nearbyPlaces} onPlaceClick={handlePlaceClick} />
    </div>
  );
}
