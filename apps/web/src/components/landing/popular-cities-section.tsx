"use client";

import { Link } from "@/config";
import { Button } from "@/components/ui/button";

const POPULAR_CITIES = [
  "Jakarta",
  "Bandung",
  "Surabaya",
  "Depok",
  "Bekasi",
  "Tangerang",
  "Bogor",
  "Semarang",
  "Yogyakarta",
  "Medan",
];

export function PopularCitiesSection() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">
          Cari Berdasarkan <span className="text-primary">Kota</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Temukan hunian di kota favoritmu.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {POPULAR_CITIES.map((city) => (
            <Link
              key={city}
              href={`/properties?city=${encodeURIComponent(city)}`}
            >
              <Button variant="outline" className="rounded-full">
                {city}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
