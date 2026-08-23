"use client";

import { Ruler, Zap, Sofa } from "lucide-react";

interface RoomSpecsCardProps {
  roomSize: string | null;
  electricityIncluded: boolean;
  furnitureIncluded: boolean;
}

export function RoomSpecsCard({
  roomSize,
  electricityIncluded,
  furnitureIncluded,
}: RoomSpecsCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h3 className="font-semibold text-sm text-foreground">Spesifikasi Kamar</h3>

      <div className="space-y-2">
        {roomSize && (
          <div className="flex items-center gap-2 text-sm">
            <Ruler className="w-4 h-4 text-muted-foreground" />
            <span>Ukuran: {roomSize}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-muted-foreground" />
          <span
            className={electricityIncluded ? "text-green-600" : "text-muted-foreground"}
          >
            Listrik {electricityIncluded ? "termasuk" : "belum termasuk"}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Sofa className="w-4 h-4 text-muted-foreground" />
          <span
            className={furnitureIncluded ? "text-green-600" : "text-muted-foreground"}
          >
            Furnitur {furnitureIncluded ? "termasuk" : "belum termasuk"}
          </span>
        </div>
      </div>
    </div>
  );
}
