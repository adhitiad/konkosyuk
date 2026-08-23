"use client";

import { cn } from "@/lib/utils";

interface Unit {
  id: string;
  name: string;
  price: number | string;
  roomSize: string | null;
}

interface UnitTabsProps {
  units: Unit[];
  selectedUnitId: string | null;
  onSelect: (unitId: string) => void;
}

function formatShortPrice(price: number | string): string {
  const numericPrice = typeof price === "string" ? Number(price) : price;
  if (numericPrice >= 1_000_000) {
    const jt = Math.floor(numericPrice / 1_000_000);
    const remainder = Math.round((numericPrice % 1_000_000) / 100_000);
    return remainder > 0 ? `${jt}.${remainder}jt` : `${jt}jt`;
  }
  if (numericPrice >= 1_000) {
    const rb = Math.floor(numericPrice / 1_000);
    return `${rb}rb`;
  }
  return `${numericPrice}`;
}

export function UnitTabs({ units, selectedUnitId, onSelect }: UnitTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {units.map((unit) => {
        const isSelected = unit.id === selectedUnitId;
        return (
          <button
            key={unit.id}
            onClick={() => onSelect(unit.id)}
            className={cn(
              "flex-shrink-0 rounded-xl px-4 py-2 text-sm whitespace-nowrap transition-all",
              isSelected
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            <span className="font-medium">{unit.name}</span>
            <span className="text-xs opacity-70">
              {" · "}
              {formatShortPrice(unit.price)}
              {unit.roomSize && ` · ${unit.roomSize}`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
