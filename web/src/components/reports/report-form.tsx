import { useActionState } from "react";
import { useEffect, useState } from "react";
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
import { createReportAction } from "@/actions/reports";
import { uploadImageAction, type UploadImageState } from "@/actions/upload";
import { getBookingsAction } from "@/actions/bookings";
import Image from "next/image";
import { getCsrfToken } from "@/lib/axios";

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

function ReportFormInner({ onSuccess }: { onSuccess?: () => void }) {
  const [stays, setStays] = useState<Stay[]>([]);
  const [stay, setStay] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(
    createReportAction,
    undefined,
  );
  const [, uploadAction] = useActionState(uploadImageAction, undefined);

  useEffect(() => {
    getBookingsAction({ limit: 100 })
      .then((result) => {
        if (!result.success) {
          setMessage("Gagal memuat unit sewaan Anda.");
          return;
        }
        const stays = (result.data ?? []).filter((b) =>
          ["confirmed", "completed"].includes(b.status),
        );
        setStays(stays as Stay[]);
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
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        formData.append("csrf", csrfToken);
      }
      const result = (await uploadAction(
        formData,
      )) as unknown as UploadImageState;
      if (result?.success && result.data?.url) {
        setImages((current) => [...current, result.data!.url].slice(0, 5));
      } else {
        throw new Error(result?.error || "Gagal upload gambar.");
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Gagal upload gambar.",
      );
    } finally {
      setUploading(false);
    }
  }

  if (state?.success) {
    setStay("");
    setCategory("");
    setDescription("");
    setImages([]);
    setMessage("Laporan berhasil dikirim.");
    onSuccess?.();
  }

  if (state?.error) {
    setMessage(state.error);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporkan Masalah</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
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
              name="description"
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
                  <div key={url} className="relative size-16">
                    <Image
                      src={url}
                      alt="Lampiran laporan"
                      fill
                      className="object-cover rounded-md"
                      sizes="64px"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button type="submit" disabled={isPending || uploading}>
            {isPending ? "Mengirim..." : "Kirim Laporan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ReportForm({ onSuccess }: { onSuccess?: () => void }) {
  return <ReportFormInner onSuccess={onSuccess} />;
}
