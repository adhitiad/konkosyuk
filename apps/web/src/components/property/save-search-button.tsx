"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Bookmark01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createSavedSearch } from "@/actions/saved-searches";

interface SaveSearchButtonProps {
  filters: Record<string, unknown>;
  existingSearch?: {
    id: string;
    name: string;
    filters: Record<string, unknown>;
  } | null;
}

function formatFilterPreview(filters: Record<string, unknown>): string {
  const parts: string[] = [];

  if (filters.location) parts.push(`Lokasi: ${filters.location}`);
  if (filters.city) parts.push(`Kota: ${filters.city}`);
  if (filters.minPrice || filters.maxPrice) {
    const min = filters.minPrice
      ? `Rp ${Number(filters.minPrice).toLocaleString("id-ID")}`
      : "Rp 0";
    const max = filters.maxPrice
      ? `Rp ${Number(filters.maxPrice).toLocaleString("id-ID")}`
      : "Tanpa batas";
    parts.push(`Harga: ${min} - ${max}`);
  }
  if (filters.type) parts.push(`Tipe: ${filters.type}`);
  if (
    filters.amenities &&
    Array.isArray(filters.amenities) &&
    filters.amenities.length > 0
  ) {
    parts.push(`Fasilitas: ${(filters.amenities as string[]).join(", ")}`);
  }

  return parts.length > 0 ? parts.join(" | ") : "Semua properti";
}

export function SaveSearchButton({
  filters,
  existingSearch,
}: SaveSearchButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(!!existingSearch);
  const router = useRouter();

  async function handleSave() {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("filters", JSON.stringify(filters));

    const result = await createSavedSearch(undefined, formData);

    setIsSubmitting(false);

    if (result.success) {
      setIsSaved(true);
      setOpen(false);
      setName("");
      router.refresh();
    } else {
      alert(result.error || "Gagal menyimpan pencarian");
    }
  }

  if (isSaved) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => router.push("/saved-searches")}
      >
        <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} />
        Tersimpan
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2">
            <HugeiconsIcon icon={Bookmark01Icon} strokeWidth={2} />
            Simpan Pencarian
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Simpan Pencarian</DialogTitle>
          <DialogDescription>
            Simpan kriteria pencarian ini untuk menerima notifikasi saat ada
            properti baru yang cocok.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Nama Pencarian{" "}
              <span className="text-muted-foreground">(opsional)</span>
            </label>
            <Input
              id="name"
              placeholder="Contoh: Kost Dekat Kampus UI"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Kriteria</label>
            <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
              {formatFilterPreview(filters)}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
