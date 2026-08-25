"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Bookmark01Icon,
  Search01Icon,
  Delete01Icon,
  CheckmarkCircle01Icon,
  CancelCircleIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getSavedSearches,
  toggleSavedSearchActive,
  deleteSavedSearch,
} from "@/actions/saved-searches";
import type { SavedSearch } from "@/db/schema";
import { useLocale } from "next-intl";

function formatRelativeTime(date: Date | null): string {
  if (!date) return "Belum pernah";

  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit yang lalu`;
  if (hours < 24) return `${hours} jam yang lalu`;
  if (days < 7) return `${days} hari yang lalu`;

  return new Date(date).toLocaleDateString("id-ID");
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

export function SavedSearchesClient() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const result = await getSavedSearches();
        if (!cancelled && result.success && Array.isArray(result.data)) {
          setSearches(result.data as SavedSearch[]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleToggle(id: string) {
    const result = await toggleSavedSearchActive(id);
    if (result.success) {
      setSearches((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, isActive: !s.isActive, updatedAt: new Date() }
            : s,
        ),
      );
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus pencarian tersimpan ini?")) return;

    const result = await deleteSavedSearch(id);
    if (result.success) {
      setSearches((prev) => prev.filter((s) => s.id !== id));
    }
  }

  function handleSearchAgain(filters: Record<string, unknown>) {
    const params = new URLSearchParams();
    if (filters.location) params.set("location", String(filters.location));
    if (filters.city) params.set("city", String(filters.city));
    if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
    if (filters.type) params.set("type", String(filters.type));
    if (filters.amenities && Array.isArray(filters.amenities)) {
      (filters.amenities as string[]).forEach((a) =>
        params.append("amenities", a),
      );
    }

    router.push(`/${locale}/properties?${params.toString()}`);
  }

  if (loading) {
    return <div className="text-muted-foreground">Memuat...</div>;
  }

  if (searches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <HugeiconsIcon
          icon={Bookmark01Icon}
          strokeWidth={1.5}
          className="size-16 text-muted-foreground mb-4"
        />
        <h2 className="text-lg font-semibold mb-2">
          Belum ada pencarian tersimpan
        </h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Simpan kriteria pencarian properti Anda untuk menerima notifikasi saat
          ada properti baru yang cocok.
        </p>
        <Button onClick={() => router.push(`/${locale}/properties`)}>
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="mr-2" />
          Cari Properti
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {searches.map((search) => (
        <div
          key={search.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border bg-background p-4"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium truncate">
                {search.name || "Pencarian Tanpa Nama"}
              </h3>
              <Badge variant={search.isActive ? "default" : "secondary"}>
                {search.isActive ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {formatFilterPreview(search.filters as Record<string, unknown>)}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>Dibuat: {formatRelativeTime(search.createdAt)}</span>
              {search.lastNotifiedAt && (
                <span>
                  Notifikasi terakhir:{" "}
                  {formatRelativeTime(search.lastNotifiedAt)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleSearchAgain(search.filters as Record<string, unknown>)
              }
            >
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={2}
                className="mr-2"
              />
              Cari Lagi
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleToggle(search.id)}
              title={search.isActive ? "Nonaktifkan" : "Aktifkan"}
            >
              <HugeiconsIcon
                icon={
                  search.isActive ? CheckmarkCircle01Icon : CancelCircleIcon
                }
                strokeWidth={2}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDelete(search.id)}
              title="Hapus"
            >
              <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
