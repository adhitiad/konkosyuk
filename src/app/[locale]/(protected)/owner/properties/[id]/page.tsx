"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { useParams, useRouter } from "next/navigation";
import { Link } from "@/config";
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
import { AlertCircleIcon, ArrowLeftIcon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import type { Property } from "@/db/schema";
import { updatePropertySchema, type UpdatePropertyInput } from "@/lib/zod";
import { apiClient } from "@/lib/axios";

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

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<UpdatePropertyInput["type"]>("kost");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data,
    isLoading,
    isError,
    error: fetchError,
  } = useQuery<Property | undefined>({
    queryKey: ["property", id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/properties/${id}`)
      const body = response.data as { data?: Property }
      return body.data
    },
    staleTime: 30000,
    enabled: !!id,
  });

  const property = data;

  useEffect(() => {
    if (property) {
      setTitle(property.name ?? "");
      setType((property.type as UpdatePropertyInput["type"]) ?? "kost");
      setCity(property.city ?? "");
      setAddress(property.address ?? "");
      setBasePrice(property.basePrice ?? "");
      setAmenities(property.amenities ?? []);
      setDescription(property.description ?? "");
    }
  }, [property]);

  const updateMutation = useMutation({
    mutationFn: async (payload: UpdatePropertyInput) => {
      const { data } = await apiClient.put(`/api/properties/${id}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["property", id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.delete(`/api/properties/${id}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      router.push("/owner/properties");
    },
  });

  if (isLoading) {
    return (
      <div className="container py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !property) {
    return (
      <div className="container py-6">
        <Alert variant="destructive">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            strokeWidth={2}
            className="size-4"
          />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {isError
              ? fetchError instanceof Error
                ? fetchError.message
                : "Gagal memuat data properti."
              : "Properti tidak ditemukan."}
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          render={<Link href="/owner/properties" />}
          nativeButton={false}
        >
          <HugeiconsIcon
            icon={ArrowLeftIcon}
            strokeWidth={2}
            className="size-4"
          />
          Kembali ke Daftar Properti
        </Button>
      </div>
    );
  }

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

    const payload: UpdatePropertyInput = {
      title,
      type,
      address,
      description: description || undefined,
      city: city || undefined,
      basePrice: basePrice || undefined,
      amenities,
      status: "aktif",
    };

    const result = updatePropertySchema.safeParse(payload);
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
      await updateMutation.mutateAsync(result.data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memperbarui properti.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <BreadcrumbNav
          items={[
            { label: "Dashboard Owner", href: "/owner/dashboard" },
            { label: "Properti Saya", href: "/owner/properties" },
            { label: property?.name ?? "Detail Properti" },
          ]}
        />
      </div>
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href="/owner/properties" />}
          nativeButton={false}
        >
          <HugeiconsIcon
            icon={ArrowLeftIcon}
            strokeWidth={2}
            className="size-4"
          />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Properti</h1>
          <p className="text-muted-foreground">
            Perbarui informasi properti Anda
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            strokeWidth={2}
            className="size-4"
          />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Informasi Dasar</h2>
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
              onValueChange={(v) => setType(v as UpdatePropertyInput["type"])}
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
            <Label htmlFor="basePrice">Harga Dasar (per bulan)</Label>
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
        </div>

        <div className="flex items-center justify-between">
          <Dialog>
            <DialogTrigger render={<Button variant="destructive" />}>
              Hapus Properti
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Konfirmasi Hapus</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Apakah Anda yakin ingin menghapus properti &quot;{property.name}
                &quot;? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex justify-end gap-2">
                <DialogTrigger render={<Button variant="outline" />}>
                  Batal
                </DialogTrigger>
                <Button
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                >
                  {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              render={<Link href="/owner/properties" />}
              nativeButton={false}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </div>
      </form>

      <div className="mt-8">
        <Button
          variant="outline"
          render={<Link href={`/owner/properties/${id}/units`} />}
          nativeButton={false}
        >
          Kelola Unit Properti
        </Button>
      </div>
    </div>
  );
}
