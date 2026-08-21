"use client";

import { useState } from "react";
import { UnitTabs } from "@/components/property/unit-tabs";
import { RoomSpecsCard } from "@/components/property/room-specs-card";
import { RoomFacilitiesGrid } from "@/components/property/room-facilities-grid";

interface Unit {
  id: string;
  name: string;
  price: number | string;
  roomSize: string | null;
  electricityIncluded: boolean;
  furnitureIncluded: boolean;
  facilities: {
    kamar?: { name: string; icon: string }[];
    kamar_mandi?: { name: string; icon: string }[];
    umum?: { name: string; icon: string }[];
  };
}

interface PropertyUnitsSectionProps {
  units: Unit[];
}

export function PropertyUnitsSection({ units }: PropertyUnitsSectionProps) {
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(
    units.length > 0 ? units[0].id : null,
  );

  const selectedUnit = units.find((u) => u.id === selectedUnitId) ?? units[0];

  if (units.length === 0) return null;

  return (
    <div className="space-y-6">
      {units.length > 1 && (
        <UnitTabs
          units={units}
          selectedUnitId={selectedUnitId}
          onSelect={setSelectedUnitId}
        />
      )}

      {selectedUnit && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RoomSpecsCard
            roomSize={selectedUnit.roomSize}
            electricityIncluded={selectedUnit.electricityIncluded}
            furnitureIncluded={selectedUnit.furnitureIncluded}
          />
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold text-sm text-foreground mb-2">Harga Unit</h3>
            <p className="text-2xl font-bold text-primary">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0,
              }).format(Number(selectedUnit.price))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">per bulan</p>
          </div>
        </div>
      )}

      {selectedUnit && (
        <RoomFacilitiesGrid facilities={selectedUnit.facilities} />
      )}
    </div>
  );
}
