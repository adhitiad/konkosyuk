"use client";

import { type ReactNode } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const DEFAULT_UNIT_IMAGE =
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(value);

interface Unit {
  id: string;
  name: string;
  price: number | string;
  status: "available" | "booked" | "maintenance";
  description?: string | null;
  images?: string[] | null;
}

interface UnitCardProps {
  unit: Unit;
  onSelect?: (unit: Unit) => void;
  action?: ReactNode;
}

export default function UnitCard({ unit, onSelect, action }: UnitCardProps) {
  const price =
    typeof unit.price === "string" ? parseFloat(unit.price) : unit.price;
  const imageUrl =
    unit.images && unit.images.length > 0 ? unit.images[0] : DEFAULT_UNIT_IMAGE;
  const isAvailable = unit.status === "available";

  const statusConfig = {
    available: { variant: "default" as const, label: "Tersedia" },
    booked: { variant: "destructive" as const, label: "Terisi" },
    maintenance: { variant: "secondary" as const, label: "Maintenance" },
  }[unit.status] || { variant: "secondary" as const, label: unit.status };

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <Image
          src={imageUrl}
          alt={unit.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">{unit.name}</CardTitle>
          <Badge variant={statusConfig.variant} className="shrink-0">
            {statusConfig.label}
          </Badge>
        </div>
        <p className="text-sm font-semibold text-primary">
          {formatCurrency(price)}
          <span className="text-xs text-muted-foreground">/bulan</span>
        </p>
      </CardHeader>
      {unit.description && (
        <CardContent>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {unit.description}
          </p>
        </CardContent>
      )}
      <div className="px-(--card-spacing) pb-(--card-spacing)">
        {action ? (
          action
        ) : (
          <Button
            className="w-full"
            disabled={!isAvailable || !onSelect}
            onClick={() => isAvailable && onSelect?.(unit)}
          >
            {isAvailable ? "Pilih Kamar" : "Tidak Tersedia"}
          </Button>
        )}
      </div>
    </Card>
  );
}
