"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StaticPageLayout } from "@/components/static-page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";

interface AdPackage {
  id: string;
  name: string;
  label: string;
  tier: "reguler" | "utama" | "premium";
  duration: number;
  price: string;
  positionType: string;
}

const AD_TYPES = [
  { value: "kos", label: "Kos" },
  { value: "kontrakan", label: "Kontrakan" },
  { value: "apartemen", label: "Apartemen" },
  { value: "rumah", label: "Rumah" },
];

const TIER_LABELS: Record<string, string> = {
  reguler: "Tampil bergantian",
  utama: "Selalu di posisi tengah",
  premium: "Selalu di posisi pertama",
};

const TIER_COLORS: Record<string, string> = {
  reguler: "border-blue-200 bg-blue-50/50",
  utama: "border-purple-200 bg-purple-50/50",
  premium: "border-amber-200 bg-amber-50/50",
};

export default function SubmitAdPage() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [descriptionLength, setDescriptionLength] = useState(0);
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [fetchingPackages, setFetchingPackages] = useState(true);

  useEffect(() => {
    async function fetchPackages() {
      try {
        const res = await fetch("/api/ad-packages");
        if (!res.ok) throw new Error("Failed to fetch packages");
        const json = await res.json();
        const allPackages = json.packages
          ? [
              ...(json.packages.reguler || []),
              ...(json.packages.utama || []),
              ...(json.packages.premium || []),
            ]
          : [];
        setPackages(allPackages);
      } catch {
        setPackages([]);
      } finally {
        setFetchingPackages(false);
      }
    }
    fetchPackages();
  }, []);

  const selectedPackage = packages.find((p) => p.id === selectedPackageId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    if (!selectedPackageId) {
      toast({
        title: "Gagal",
        description: "Pilih paket iklan terlebih dahulu",
        type: "error",
      });
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data = {
      advertiserName: formData.get("advertiserName") as string,
      advertiserPhone: formData.get("advertiserPhone") as string,
      advertiserWhatsApp: formData.get("advertiserWhatsApp") as string,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      imageUrl: formData.get("imageUrl") as string,
      targetUrl: formData.get("targetUrl") as string,
      location: formData.get("location") as string,
      type: formData.get("type") as string,
      packageId: selectedPackageId,
    };

    try {
      const res = await fetch("/api/ads/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok || json.success === false) {
        throw new Error(json.error || "Gagal mengirim iklan");
      }

      setSubmitted(true);
      toast({
        title: "Iklan Dikirim",
        description: json.message || "Iklan Anda akan ditinjau dalam 1x24 jam",
        type: "success",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal mengirim iklan";
      toast({
        title: "Gagal",
        description: message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  const groupedPackages = packages.reduce<Record<string, AdPackage[]>>(
    (acc, pkg) => {
      if (!acc[pkg.tier]) acc[pkg.tier] = [];
      acc[pkg.tier].push(pkg);
      return acc;
    },
    {},
  );

  return (
    <StaticPageLayout title="Pasang Iklan Properti">
      {submitted ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          <h3 className="text-lg font-semibold mb-2">
            Iklan Anda Telah Dikirim
          </h3>
          <p>
            Iklan Anda akan ditinjau dalam 1x24 jam. Tim kami akan menghubungi
            Anda setelah disetujui.
          </p>
          <Button onClick={() => router.push("/")} className="mt-4">
            Kembali ke Beranda
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-6 max-w-2xl">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="advertiserName">Nama Lengkap</Label>
              <Input id="advertiserName" name="advertiserName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="advertiserPhone">No. HP/WA</Label>
              <Input id="advertiserPhone" name="advertiserPhone" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="advertiserWhatsApp">
              WhatsApp (opsional, jika beda dengan HP)
            </Label>
            <Input id="advertiserWhatsApp" name="advertiserWhatsApp" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Judul Iklan</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="Contoh: Kost Nyaman Dekat UI"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              required
              maxLength={200}
              placeholder="Deskripsi singkat properti Anda..."
              onChange={(e) => setDescriptionLength(e.target.value.length)}
            />
            <p className="text-xs text-muted-foreground">
              {descriptionLength}/200 karakter
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Tipe</Label>
              <Select name="type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  {AD_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Lokasi</Label>
              <Input
                id="location"
                name="location"
                required
                placeholder="Contoh: Depok, Jawa Barat"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL Gambar</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              type="url"
              required
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetUrl">
              URL Tujuan (opsional, default ke detail properti)
            </Label>
            <Input
              id="targetUrl"
              name="targetUrl"
              type="url"
              placeholder="https://..."
            />
          </div>

          <div className="space-y-3">
            <Label>Pilih Paket Iklan</Label>
            {fetchingPackages ? (
              <p className="text-sm text-muted-foreground">Memuat paket...</p>
            ) : (
              <div className="space-y-4">
                {(
                  Object.keys(groupedPackages) as Array<
                    keyof typeof groupedPackages
                  >
                ).map((tier) => (
                  <div
                    key={tier}
                    className={`rounded-lg border p-4 space-y-3 ${TIER_COLORS[tier] || "border-gray-200 bg-gray-50/50"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold capitalize">{tier}</span>
                      <span className="text-xs text-muted-foreground">
                        {TIER_LABELS[tier]}
                      </span>
                    </div>
                    {groupedPackages[tier].map((pkg) => (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedPackageId(pkg.id)}
                        className={`w-full flex items-center justify-between rounded-md border p-3 text-left transition-colors ${
                          selectedPackageId === pkg.id
                            ? "border-primary bg-primary/5"
                            : "bg-background hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                              selectedPackageId === pkg.id
                                ? "border-primary"
                                : "border-muted-foreground"
                            }`}
                          >
                            {selectedPackageId === pkg.id && (
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <Label htmlFor={pkg.id} className="cursor-pointer">
                            <span className="font-medium">{pkg.label}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({pkg.duration} hari)
                            </span>
                          </Label>
                        </div>
                        <span className="font-semibold text-primary">
                          Rp {Number(pkg.price).toLocaleString("id-ID")}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {selectedPackage && (
              <p className="text-sm font-medium">
                Total: Rp{" "}
                {Number(selectedPackage.price).toLocaleString("id-ID")}
              </p>
            )}
          </div>

          <Button type="submit" disabled={loading || !selectedPackageId}>
            {loading ? "Mengirim..." : "Kirim Iklan"}
          </Button>
        </form>
      )}
    </StaticPageLayout>
  );
}
