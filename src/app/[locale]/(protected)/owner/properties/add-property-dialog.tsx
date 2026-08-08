"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { createPropertySchema, type CreatePropertyInput } from "@/lib/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import PackageForm from "@/components/owner/package-form";
import type { PropertyPackages } from "@/lib/types/property-packages";

const propertyTypeOptions = [
  { value: "kost", label: "Kost" },
  { value: "kontrakan", label: "Kontrakan" },
];

const commonAmenities = [
  "WiFi",
  "AC",
  "Laundry",
  "Parkir Motor",
  "Parkir Mobil",
  "Dapur",
  "Kamar Mandi Dalam",
  "Balcony",
];

export default function AddPropertyDialog() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<CreatePropertyInput["type"]>("kost");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [packages, setPackages] = useState<PropertyPackages | null>(null);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addAmenity = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !amenities.includes(trimmed)) {
      setAmenities([...amenities, trimmed]);
    }
    setAmenityInput("");
  };

  const removeAmenity = (value: string) => {
    setAmenities(amenities.filter((a) => a !== value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: CreatePropertyInput = {
      title,
      type,
      address,
      description: description || undefined,
      city,
      packages: packages || undefined,
      amenities,
      status: "aktif",
      province: '',
      images: [],
    };

    const result = createPropertySchema.safeParse(payload);
    if (!result.success) {
      setError(
        result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", "),
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Gagal menambahkan properti.");
      }

      queryClient.invalidateQueries({ queryKey: ["properties"] });
      resetForm();
      (
        document.querySelector(
          '[data-slot="dialog-close"]',
        ) as HTMLElement | null
      )?.click();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menambahkan properti.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setType("kost");
    setCity("");
    setAddress("");
    setPackages(null);
    setAmenities([]);
    setAmenityInput("");
    setDescription("");
    setError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            strokeWidth={2}
            className="size-4"
          />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Judul Properti</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Contoh: Kost Melati"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Tipe</Label>
        <Select
          value={type}
          onValueChange={(v) => setType(v as CreatePropertyInput["type"])}
        >
          <SelectTrigger id="type">
            <SelectValue placeholder="Pilih tipe" />
          </SelectTrigger>
          <SelectContent>
            {propertyTypeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">Kota</Label>
        <Input
          id="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Contoh: Jakarta Selatan"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Lokasi / Alamat</Label>
        <Input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Contoh: Jl. Sudirman No. 123"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Paket Harga</Label>
        <PackageForm
          type={type}
          onChange={setPackages}
        />
      </div>

      <div className="space-y-2">
        <Label>Amenities</Label>
        <div className="flex gap-2">
          <Input
            value={amenityInput}
            onChange={(e) => setAmenityInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addAmenity(amenityInput);
              }
            }}
            placeholder="Ketik dan tekan Enter"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addAmenity(amenityInput)}
          >
            Tambah
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {amenities.map((a) => (
            <Badge
              key={a}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => removeAmenity(a)}
            >
              {a} ×
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {commonAmenities
            .filter((c) => !amenities.includes(c))
            .map((c) => (
              <Button
                key={c}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addAmenity(c)}
              >
                + {c}
              </Button>
            ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Deskripsi singkat properti..."
          className="w-full min-h-[80px] rounded-4xl border border-input bg-input/30 px-3 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </div>

      <div className="flex justify-end gap-2">
        <DialogClose render={<Button type="button" variant="outline" />}>
          Batal
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
