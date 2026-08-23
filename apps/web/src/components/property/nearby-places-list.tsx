"use client";

import { MapPin, Utensils, Coffee, Flame, Church, ShoppingCart, HeartPulse, GraduationCap, Bus } from "lucide-react";

interface NearbyPlace {
  id: string;
  name: string;
  type: string;
  distance: number;
  latitude: number;
  longitude: number;
}

interface NearbyPlacesListProps {
  places: NearbyPlace[];
  onPlaceClick?: (place: NearbyPlace) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  makanan: Utensils,
  minuman: Coffee,
  atk: Flame,
  ibadah: Church,
  belanja: ShoppingCart,
  kesehatan: HeartPulse,
  pendidikan: GraduationCap,
  transportasi: Bus,
  lainnya: MapPin,
};

function getPlaceIcon(type: string) {
  const Icon = iconMap[type] || MapPin;
  return <Icon className="w-4 h-4 text-muted-foreground" />;
}

function formatDistance(meters: number): string {
  if (meters < 100) return `${meters}m`;
  if (meters < 1000) return `${Math.round(meters / 10) * 10}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export function NearbyPlacesList({ places, onPlaceClick }: NearbyPlacesListProps) {
  const sortedPlaces = [...places].sort((a, b) => a.distance - b.distance);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <MapPin className="w-4 h-4 text-muted-foreground" />
        Tempat Terdekat
      </h3>
      {sortedPlaces.length > 0 ? (
        <ul className="space-y-1.5">
          {sortedPlaces.map((place) => (
            <li
              key={place.id}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              onClick={() => onPlaceClick?.(place)}
            >
              {getPlaceIcon(place.type)}
              <span className="flex-1 truncate">{place.name}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistance(place.distance)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          Belum ada tempat terdekat yang didaftarkan
        </p>
      )}
    </div>
  );
}
