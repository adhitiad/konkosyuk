"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { CameraIcon, Cancel02Icon } from "@hugeicons/core-free-icons";

interface InspectionItem {
  id: string;
  category: string;
  itemName: string;
  condition: string | null;
  notes: string | null;
  repairCost: string | null;
  photoUrls: string[];
  isNewDamage: boolean;
}

interface InspectionChecklistProps {
  inspectionId: string;
  items: InspectionItem[];
  readonly?: boolean;
  onUpdateItem?: (itemId: string, updates: Partial<InspectionItem>) => void;
  onAddPhoto?: (itemId: string, url: string) => void;
}

const CATEGORY_LABEL: Record<string, string> = {
  furniture: "Furnitur",
  electrical: "Kelistrikan",
  plumbing: "Pipa & Air",
  walls: "Dinding",
  floor: "Lantai",
  doors_windows: "Pintu & Jendela",
  ac: "AC",
  kitchen: "Dapur",
  bathroom: "Kamar Mandi",
  other: "Lainnya",
};

const CONDITION_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  excellent: { label: "Sangat Baik", variant: "default" },
  good: { label: "Baik", variant: "secondary" },
  fair: { label: "Cukup", variant: "outline" },
  poor: { label: "Buruk", variant: "destructive" },
  damaged: { label: "Rusak", variant: "destructive" },
  missing: { label: "Hilang", variant: "destructive" },
};

export function InspectionChecklist({
  items,
  readonly = false,
  onUpdateItem,
  onAddPhoto,
}: Omit<InspectionChecklistProps, "_inspectionId">) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = Array.from(new Set(items.map((i) => i.category)));
  const filteredItems = selectedCategory === "all" ? items : items.filter((i) => i.category === selectedCategory);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory("all")}
        >
          Semua
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
          >
            {CATEGORY_LABEL[cat] || cat}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredItems.map((item) => (
          <div key={item.id} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{item.itemName}</p>
                <p className="text-xs text-muted-foreground">
                  {CATEGORY_LABEL[item.category] || item.category}
                </p>
              </div>
              {item.condition && (
                <Badge variant={CONDITION_LABEL[item.condition]?.variant || "outline"}>
                  {CONDITION_LABEL[item.condition]?.label || item.condition}
                </Badge>
              )}
            </div>

            {item.isNewDamage && (
              <Badge variant="destructive" className="gap-1">
                <HugeiconsIcon icon={Cancel02Icon} strokeWidth={2} className="size-3" />
                Kerusakan Baru
              </Badge>
            )}

            {item.notes && (
              <p className="text-sm text-muted-foreground">{item.notes}</p>
            )}

            {item.repairCost && Number(item.repairCost) > 0 && (
              <p className="text-sm font-medium text-destructive">
                Estimasi Biaya: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(item.repairCost))}
              </p>
            )}

            {item.photoUrls.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {item.photoUrls.map((url, idx) => (
                  <Image
                    key={idx}
                    src={url}
                    alt={`${item.itemName} - ${idx + 1}`}
                    width={80}
                    height={80}
                    className="object-cover rounded-md border"
                    unoptimized
                  />
                ))}
              </div>
            )}

            {!readonly && onUpdateItem && (
              <div className="flex gap-2">
                <select
                  className="text-sm border rounded px-2 py-1"
                  value={item.condition || ""}
                  onChange={(e) => onUpdateItem(item.id, { condition: e.target.value })}
                >
                  <option value="">Pilih kondisi</option>
                  <option value="excellent">Sangat Baik</option>
                  <option value="good">Baik</option>
                  <option value="fair">Cukup</option>
                  <option value="poor">Buruk</option>
                  <option value="damaged">Rusak</option>
                  <option value="missing">Hilang</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = prompt("Masukkan URL foto:");
                    if (url && onAddPhoto) {
                      onAddPhoto(item.id, url);
                    }
                  }}
                >
                  <HugeiconsIcon icon={CameraIcon} strokeWidth={2} className="size-3 mr-1" />
                  Foto
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
