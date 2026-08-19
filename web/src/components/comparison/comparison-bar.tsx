"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { CancelCircleIcon } from "@hugeicons/core-free-icons";
import Image from "next/image";

const MAX_COMPARE = 4;

export function ComparisonBar() {
  const [items, setItems] = useState<
    Array<{
      id: string;
      name: string;
      address: string;
      type: "kost" | "kontrakan";
      images: string[];
      basePrice: string | null;
    }>
  >([]);

  useEffect(() => {
    const stored = localStorage.getItem("comparison_list");
    if (!stored) return;

    try {
      const ids = JSON.parse(stored) as string[];
      if (ids.length === 0) return;

      const fetchProperties = async () => {
        const res = await fetch(
          `/api/properties?${new URLSearchParams({
            ids: ids.join(","),
          })}`,
        );
        if (!res.ok) return;
        const json = await res.json();
        if (json.data) {
          setItems(json.data);
        }
      };

      fetchProperties();
    } catch {}
  }, []);

  const removeItem = (id: string) => {
    const stored = localStorage.getItem("comparison_list");
    if (!stored) return;
    try {
      const ids = JSON.parse(stored) as string[];
      const newIds = ids.filter((itemId) => itemId !== id);
      localStorage.setItem("comparison_list", JSON.stringify(newIds));
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {}
  };

  const clearAll = () => {
    localStorage.removeItem("comparison_list");
    setItems([]);
  };

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-4xl">
      <Card className="p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Bandingkan Properti ({items.length}/{MAX_COMPARE})</h3>
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <HugeiconsIcon icon={CancelCircleIcon} strokeWidth={2} className="size-4 mr-1" />
            Hapus Semua
          </Button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative flex-shrink-0 w-40 rounded-lg border overflow-hidden"
            >
              <div className="relative aspect-video">
                <Image
                  src={item.images?.[0] || "/placeholder.jpg"}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => removeItem(item.id)}
                >
                  <HugeiconsIcon icon={CancelCircleIcon} strokeWidth={2} className="size-3" />
                </Button>
              </div>
              <div className="p-2">
                <p className="text-xs font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground truncate">{item.address}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={clearAll}>
            Batal
          </Button>
          <Button
            size="sm"
            render={<Link href={`/comparisons?ids=${items.map((i) => i.id).join(",")}`} />}
            nativeButton={false}
            disabled={items.length < 2}
          >
            Bandingkan ({items.length})
          </Button>
        </div>
      </Card>
    </div>
  );
}
