"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { toast } from "@/components/ui/toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PropertyImagesUpload } from "@/components/property/property-images-upload";
const PropertyMapPicker = dynamic(
  () => import("@/components/property/map-picker"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] animate-pulse rounded-lg border bg-muted" />
    ),
  },
);
import PackageForm from "@/components/owner/package-form";
import type { PropertyPackages } from "@/lib/types/property-packages";
import { createPropertyAction } from "@/actions/properties";
import type { CreatePropertyInput } from "@/lib/zod";

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
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<CreatePropertyInput["type"]>("kost");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [propertyImages, setPropertyImages] = useState<string[]>([]);
  const [basePrice, setBasePrice] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [icalImportUrl, setIcalImportUrl] = useState("");
  const [packages, setPackages] = useState<PropertyPackages | null>(null);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [state, formAction, isPending] = useActionState(
    createPropertyAction,
    undefined,
  );

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

  if (state?.success) {
    queryClient.invalidateQueries({ queryKey: ["owner-properties-v2"] });
    toast({
      title: "Berhasil",
      description: "Properti berhasil ditambahkan.",
      type: "success",
    });
    router.push("/owner/properties");
  } else if (state?.error) {
    setError(state.error);
  }

  return (
    <div className="container py-6 space-y-6 max-w-5xl">
      <BreadcrumbNav
        items={[
          { label: "Dashboard", href: "/owner" },
          { label: "Properti", href: "/owner/properties" },
          { label: "Tambah Properti Baru" },
        ]}
      />

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          render={
            <Link href="/owner/properties">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          }
          nativeButton={false}
        />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Tambah Properti Baru
          </h1>
          <p className="text-muted-foreground">
            Isi detail properti kost atau kontrakan Anda
          </p>
        </div>
      </div>

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

      <form action={formAction} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Properti *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Kost Melati"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipe *</Label>
                <Select
                  value={type}
                  onValueChange={(v) =>
                    setType(v as CreatePropertyInput["type"])
                  }
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
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Deskripsi singkat properti..."
                  rows={4}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lokasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="province">Provinsi (Opsional)</Label>
                <Input
                  id="province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Contoh: DKI Jakarta"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Kota *</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Contoh: Jakarta Selatan"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="district">Kecamatan (Opsional)</Label>
                <Input
                  id="district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Contoh: Menteng"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Alamat *</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Contoh: Jl. Sudirman No. 123"
                  required
                />
              </div>
            </div>
            <PropertyMapPicker
              lat={latitude ? Number(latitude) : undefined}
              lng={longitude ? Number(longitude) : undefined}
              onLocationSelected={(data) => {
                setAddress(data.address || address);
                setProvince(data.province);
                setCity(data.city);
                setLatitude(String(data.lat));
                setLongitude(String(data.lng));
              }}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude (Opsional)</Label>
                <Input
                  id="latitude"
                  type="number"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="-6.2088"
                  step="0.000001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude (Opsional)</Label>
                <Input
                  id="longitude"
                  type="number"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="106.8456"
                  step="0.000001"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Foto Properti</CardTitle>
          </CardHeader>
          <CardContent>
            <PropertyImagesUpload
              onImagesChange={setPropertyImages}
              minImages={3}
              maxImages={5}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Harga & Paket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="basePrice">Harga Dasar (Opsional)</Label>
              <Input
                id="basePrice"
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="Contoh: 2500000"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Paket Harga</Label>
              <PackageForm type={type} onChange={setPackages} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fasilitas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <div className="flex flex-wrap gap-2">
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
            <div className="flex flex-wrap gap-2">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pengaturan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span>Aktif</span>
              <span className="text-xs text-muted-foreground">
                Properti akan ditampilkan secara publik setelah diverifikasi
                admin.
              </span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="icalImportUrl">ICAL Import URL (Opsional)</Label>
              <Input
                id="icalImportUrl"
                value={icalImportUrl}
                onChange={(e) => setIcalImportUrl(e.target.value)}
                placeholder="https://example.com/calendar.ics"
              />
              <p className="text-xs text-muted-foreground">
                Import kalender eksternal untuk sinkronisasi ketersediaan
                tanggal.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            render={<Link href="/owner/properties">Batal</Link>}
            nativeButton={false}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
