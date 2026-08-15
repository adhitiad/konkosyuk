"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyMapPoint } from "@/components/StadiaMap";
import { Location } from "@/components/RoutePlanner";
import { PropertyMapPoint as SearchPropertyMapPoint } from "@/components/MapWithSearch";

const MapWithSearch = dynamic(
  () => import("@/components/MapWithSearch"),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="w-full h-[600px] rounded-xl" />
    ),
  }
);

const MapWithRoute = dynamic(
  () => import("@/components/MapWithRoute"),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="w-full h-[600px] rounded-xl" />
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

export default function MapFeaturesPage({ properties }: { properties: Property[] }) {
  const mapProperties: SearchPropertyMapPoint[] = properties.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.basePrice ? Number(p.basePrice) : null,
    latitude: p.latitude ?? undefined,
    longitude: p.longitude ?? undefined,
    type: p.type,
  }));

  const jakarta: Location = {
    latitude: -6.200000,
    longitude: 106.816666,
    name: "Jakarta",
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-10 space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Fitur Peta KonkosYuk
        </h1>
        <p className="mt-2 text-muted-foreground">
          Pencarian alamat autocomplete dan routing menggunakan Stadia Maps.
        </p>
      </div>

      {/* Section 1: Map with Search */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Pencarian Alamat</h2>
          <p className="text-sm text-muted-foreground">
            Ketik lokasi di kolom pencarian untuk menemukan alamat. Klik hasil
            pencarian untuk memindahkan peta ke lokasi tersebut.
          </p>
        </div>
        <MapWithSearch
          properties={mapProperties}
          height="600px"
          className="shadow-lg"
          defaultStyle="light"
          onLocationSelect={(location) => {
            console.log("Location selected:", location);
          }}
        />
      </section>

      {/* Section 2: Map with Route */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Petunjuk Arah</h2>
          <p className="text-sm text-muted-foreground">
            Klik marker properti di peta untuk melihat rute dari Jakarta ke
            properti tersebut. Pilih mode transportasi: mobil, jalan kaki,
            sepeda, atau transportasi umum.
          </p>
        </div>
        <MapWithRoute
          properties={mapProperties}
          height="600px"
          className="shadow-lg"
          defaultStyle="light"
          onDestinationChange={(destination) => {
            console.log("Destination changed:", destination);
          }}
        />
      </section>
    </div>
  );
}
