"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRightIcon, Alert02Icon } from "@hugeicons/core-free-icons";
import { formatCurrency } from "@/lib/utils/currency";

interface ComparisonItem {
  category: string;
  itemName: string;
  moveInCondition: string;
  moveOutCondition: string;
  isNewDamage: boolean;
  repairCost: string | null;
  notes: string | null;
}

interface InspectionComparisonProps {
  comparison: ComparisonItem[];
  summary: {
    totalItems: number;
    damagedItems: number;
    totalDamageCost: number;
  };
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

const CONDITION_LABEL: Record<string, string> = {
  excellent: "Sangat Baik",
  good: "Baik",
  fair: "Cukup",
  poor: "Buruk",
  damaged: "Rusak",
  missing: "Hilang",
  unknown: "Tidak Diketahui",
};

export function InspectionComparison({ comparison, summary }: InspectionComparisonProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Item</p>
            <p className="text-2xl font-bold">{summary.totalItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Item Rusak</p>
            <p className="text-2xl font-bold text-destructive">{summary.damagedItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Biaya Perbaikan</p>
            <p className="text-2xl font-bold text-destructive">
              {formatCurrency(summary.totalDamageCost)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perbandingan Move-in vs Move-out</CardTitle>
        </CardHeader>
        <CardContent>
          {comparison.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Tidak ada data perbandingan
            </p>
          ) : (
            <div className="space-y-4">
              {comparison.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{CATEGORY_LABEL[item.category] || item.category}</Badge>
                      {item.isNewDamage && (
                        <Badge variant="destructive" className="gap-1">
                          <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-3" />
                          Kerusakan Baru
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium">{item.itemName}</p>
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                    )}
                    {item.repairCost && Number(item.repairCost) > 0 && (
                      <p className="text-sm font-medium text-destructive mt-1">
                        Biaya: {formatCurrency(Number(item.repairCost))}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Move-in</p>
                      <Badge variant={item.moveInCondition === "excellent" || item.moveInCondition === "good" ? "default" : "secondary"}>
                        {CONDITION_LABEL[item.moveInCondition] || item.moveInCondition}
                      </Badge>
                    </div>

                    <HugeiconsIcon icon={ArrowRightIcon} strokeWidth={2} className="size-4 text-muted-foreground" />

                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Move-out</p>
                      <Badge variant={item.moveOutCondition === "excellent" || item.moveOutCondition === "good" ? "default" : "destructive"}>
                        {CONDITION_LABEL[item.moveOutCondition] || item.moveOutCondition}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
