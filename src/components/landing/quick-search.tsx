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
import { Card, CardContent } from "@/components/ui/card";

export default function QuickSearch() {
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
    <Card className="mx-auto max-w-4xl">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="md:col-span-2 relative">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
            />
            <Input
              placeholder="Lokasi atau nama properti..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="pl-9"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Select<string> value={type} onValueChange={(v) => v && setType(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Tipe Hunian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="kost">Kost</SelectItem>
              <SelectItem value="kontrakan">Kontrakan</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} className="w-full">
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              className="size-4 mr-2"
            />
            Cari Sekarang
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
