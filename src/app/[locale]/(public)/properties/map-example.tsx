import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { MapProperty } from "@/components/MapLibreMap";

// Dynamic import untuk menghindari SSR issues
const MapLibreMap = dynamic(
  () => import("@/components/MapLibreMap"),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="w-full h-[500px] rounded-xl" />
    ),
  }
);

interface Property {
  id: string;
  name: string;
  basePrice: string | null;
  latitude: number | null;
  longitude: number | null;
  type: "kost" | "kontrakan" | "ruko";
}

export default function PropertyMapPage({ properties }: { properties: Property[] }) {
  const mapProperties: MapProperty[] = properties.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.basePrice ? Number(p.basePrice) : null,
    latitude: p.latitude ?? undefined,
    longitude: p.longitude ?? undefined,
    type: p.type,
  }));

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Peta Properti</h2>
      <MapLibreMap
        properties={mapProperties}
        height="600px"
        className="shadow-lg"
      />
    </div>
  );
}
