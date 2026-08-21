"use client";

import * as LucideIcons from "lucide-react";

interface FacilityItem {
  name: string;
  icon: string;
}

interface RoomFacilitiesGridProps {
  facilities: {
    kamar?: FacilityItem[];
    kamar_mandi?: FacilityItem[];
    umum?: FacilityItem[];
  };
}

const categoryLabels: Record<string, string> = {
  kamar: "Fasilitas Kamar",
  kamar_mandi: "Fasilitas Kamar Mandi",
  umum: "Fasilitas Umum",
};

function getIcon(iconName: string): React.ComponentType<{ className?: string }> | null {
  const icons = LucideIcons as Record<string, unknown>;
  const Icon = icons[iconName];
  if (typeof Icon === "function") return Icon as React.ComponentType<{ className?: string }>;
  return null;
}

export function RoomFacilitiesGrid({ facilities }: RoomFacilitiesGridProps) {
  const entries = Object.entries(facilities).filter(([, items]) => items && items.length > 0);

  if (entries.length === 0) return null;

  return (
    <div className="space-y-6">
      {entries.map(([category, items]) => {
        if (!items || items.length === 0) return null;

        return (
          <div key={category} className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">
              {categoryLabels[category] ?? category}
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {items.map((item) => {
                const Icon = getIcon(item.icon);
                return (
                  <div
                    key={item.name}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-muted/50 text-center text-xs text-muted-foreground"
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span className="truncate w-full text-center">{item.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
