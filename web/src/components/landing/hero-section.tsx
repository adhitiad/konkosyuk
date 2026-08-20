"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";

export function HeroSection() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [type, setType] = useState("all");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (city.trim()) params.set("city", city.trim());
    if (type !== "all") params.set("type", type);
    router.push(`/properties?${params.toString()}`);
  };

  return (
    <section className="relative bg-gradient-to-b from-primary/10 to-background px-6 py-16 lg:py-24">
      <div className="mx-auto max-w-6xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Temukan Kost &amp; Kontrakan{" "}
          <span className="text-primary">Impianmu</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Ribuan hunian terverifikasi dengan harga terjangkau. Cari berdasarkan
          lokasi, tipe, dan budget.
        </p>

        <div className="mx-auto mt-10 max-w-4xl">
          <div className="grid grid-cols-1 gap-4 rounded-xl border bg-white p-4 shadow-lg sm:grid-cols-12">
            <div className="sm:col-span-5 relative">
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={2}
                className="absolute left-3 top-1/2 size-4 text-muted-foreground"
              />
              <Input
                placeholder="Kota atau lokasi..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="pl-9"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="sm:col-span-3">
              <Select<string>
                value={type}
                onValueChange={(v) => v && setType(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipe Hunian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="kost">Kost</SelectItem>
                  <SelectItem value="kontrakan">Kontrakan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-4">
              <Button onClick={handleSearch} className="w-full" size="lg">
                <HugeiconsIcon
                  icon={Search01Icon}
                  strokeWidth={2}
                  className="size-4 mr-2"
                />
                Cari Hunian
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
