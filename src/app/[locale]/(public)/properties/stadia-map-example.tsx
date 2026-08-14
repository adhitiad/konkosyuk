import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { PropertyMapPoint } from "@/components/StadiaMap";

const StadiaMap = dynamic(
  () => import("@/components/StadiaMap"),
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

export default function StadiaMapPage({ properties }: { properties: Property[] }) {
  const mapProperties: PropertyMapPoint[] = properties.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.basePrice ? Number(p.basePrice) : null,
    latitude: p.latitude ?? undefined,
    longitude: p.longitude ?? undefined,
    type: p.type,
  }));

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Peta Properti (Stadia Maps)</h2>
      <StadiaMap
        properties={mapProperties}
        height="600px"
        className="shadow-lg"
        defaultStyle="light"
      />
    </div>
  );
}
