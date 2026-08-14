"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Stay = {
  propertyId: string;
  propertyName?: string;
  unitId: string;
  unitName?: string;
};
const categories = [
  ["air", "Air"],
  ["listrik", "Listrik"],
  ["kunci_pintu", "Kunci pintu"],
  ["ac", "AC"],
  ["furniture", "Furniture"],
  ["lainnya", "Lainnya"],
] as const;

export default function ReportForm({ onSuccess }: { onSuccess?: () => void }) {
  const [stays, setStays] = useState<Stay[]>([]);
  const [stay, setStay] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get("/api/bookings?limit=100")
      .then(({ data: json }) => {
        const bookings = json?.data?.data ?? [];
        setStays(
          bookings.filter((b: { status: string }) =>
            ["confirmed", "completed"].includes(b.status),
          ),
        );
      })
      .catch(() => setMessage("Gagal memuat unit sewaan Anda."));
  }, []);

  async function upload(file: File) {
    if (!file.type.startsWith("image/"))
      return setMessage("File harus berupa gambar.");
    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "report");
      const { data: json } = await apiClient.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = json?.data?.url ?? json?.url;
      if (!url) throw new Error("URL gambar tidak tersedia");
      setImages((current) => [...current, url].slice(0, 5));
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Gagal upload gambar.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const selected = stays.find((item) => item.unitId === stay);
    if (!selected || !category || description.trim().length < 10)
      return setMessage(
        "Lengkapi unit, kategori, dan deskripsi minimal 10 karakter.",
      );
    setSubmitting(true);
    try {
      await apiClient.post("/api/reports", {
        propertyId: selected.propertyId,
        unitId: selected.unitId,
        category,
        description: description.trim(),
        images,
      });
      setStay("");
      setCategory("");
      setDescription("");
      setImages([]);
      setMessage("Laporan berhasil dikirim.");
      onSuccess?.();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Gagal mengirim laporan.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporkan Masalah</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {message && (
            <p className="text-sm text-muted-foreground" role="status">
              {message}
            </p>
          )}
          <div className="space-y-2">
            <Label>Unit</Label>
            <Select
              value={stay}
              onValueChange={(value) => value && setStay(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih unit sewaan" />
              </SelectTrigger>
              <SelectContent>
                {stays.map((item) => (
                  <SelectItem key={item.unitId} value={item.unitId}>
                    {item.propertyName ?? "Properti"} -{" "}
                    {item.unitName ?? item.unitId.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select
              value={category}
              onValueChange={(value) => value && setCategory(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-description">Deskripsi</Label>
            <Textarea
              id="report-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Jelaskan masalah yang terjadi..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-images">Gambar (opsional, maksimal 5)</Label>
            <input
              id="report-images"
              type="file"
              accept="image/*"
              multiple
              disabled={uploading || images.length >= 5}
              onChange={(event) =>
                Array.from(event.target.files ?? []).forEach(upload)
              }
            />
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {images.map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt="Lampiran laporan"
                    className="size-16 rounded-md object-cover"
                  />
                ))}
              </div>
            )}
          </div>
          <Button type="submit" disabled={submitting || uploading}>
            {submitting ? "Mengirim..." : "Kirim Laporan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
