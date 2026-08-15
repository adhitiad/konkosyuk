"use client";

import { useState, useEffect, useActionState } from "react";
import { useForm, SubmitHandler, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, Location02Icon } from "@hugeicons/core-free-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import type { SessionUserWithRole } from "@/lib/auth-client";
import {
  PROVINCES,
  CITIES_BY_PROVINCE,
} from "@/lib/constants/indonesia-regions";
import { Dropzone } from "@/components/owner/dropzone";
import PackageForm from "@/components/owner/package-form";
import type { PropertyPackages } from "@/lib/types/property-packages";
import Link from "next/link";
import { createPropertyAction, CreatePropertyState } from "@/actions/properties";
import { uploadImageAction, type UploadImageState } from "@/actions/upload";

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

export default function AddPropertyForm() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMissing, setContactMissing] = useState<string[]>([]);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<CreatePropertyInput>({
    resolver: zodResolver(createPropertySchema) as Resolver<CreatePropertyInput>,
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      address: "",
      province: "",
      city: "",
      type: "kost",
      basePrice: "",
      packages: undefined,
      status: "aktif",
      amenities: [],
      images: [],
      metadata: {},
      latitude: undefined,
      longitude: undefined,
    },
  });

  const province = watch("province");
  const city = watch("city");
  const address = watch("address");
  const amenities = watch("amenities") || [];
  const packages = watch("packages") as PropertyPackages | null;

  const availableCities = province ? CITIES_BY_PROVINCE[province] || [] : [];
  const user = session?.user as SessionUserWithRole | undefined;
  const imageCount = uploadedImages.length;
  const canSubmit = isValid && imageCount >= 3;

  const [state, formAction, isPending] = useActionState<
    CreatePropertyState | undefined,
    FormData
  >(createPropertyAction, undefined);

  const handleActionSubmit: SubmitHandler<CreatePropertyInput> = (data) => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("address", data.address || "");
    if (data.description) formData.append("description", data.description);
    if (data.province) formData.append("province", data.province);
    if (data.city) formData.append("city", data.city);
    formData.append("type", data.type);
    if (data.basePrice) formData.append("basePrice", data.basePrice);
    if (data.status) formData.append("status", data.status);
    if (data.latitude !== undefined) formData.append("latitude", String(data.latitude));
    if (data.longitude !== undefined) formData.append("longitude", String(data.longitude));
    formData.append("images", JSON.stringify(uploadedImages));
    formData.append("amenities", JSON.stringify(data.amenities || []));
    if (data.packages) {
      formData.append("packages", JSON.stringify(data.packages));
    }
    formAction(formData);
  };

  const addAmenity = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !amenities.includes(trimmed)) {
      setValue("amenities", [...amenities, trimmed]);
    }
  };

  const removeAmenity = (value: string) => {
    setValue(
      "amenities",
      amenities.filter((a) => a !== value),
    );
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setGeolocationError("Geolocation tidak didukung oleh browser ini.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue("latitude", Number(position.coords.latitude.toFixed(6)));
        setValue("longitude", Number(position.coords.longitude.toFixed(6)));
        setGeolocationError(null);
      },
      () => {
        setGeolocationError("Gagal mendapatkan lokasi. Izinkan akses lokasi di browser.");
      },
    );
  };

  const [uploadState, uploadAction] = useActionState(uploadImageAction, undefined);

  const uploadImages = async (): Promise<string[]> => {
    const uploaded: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "property");
      const result = (await uploadAction(formData)) as unknown as UploadImageState;
      if (result?.success && result.data?.url) {
        uploaded.push(result.data.url);
      } else {
        throw new Error(result?.error || "Gagal upload gambar");
      }
    }
    return uploaded;
  };

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  useEffect(() => {
    if (files.length > 0) {
      uploadImages()
        .then((urls) => setUploadedImages(urls))
        .catch((err) => setGeolocationError(err.message));
    }
  }, [files]);

  return (
    <>
      <form onSubmit={handleSubmit(handleActionSubmit)} className="space-y-4">
        {geolocationError && (
          <Alert variant="destructive">
            <HugeiconsIcon
              icon={AlertCircleIcon}
              strokeWidth={2}
              className="size-4"
            />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{geolocationError}</AlertDescription>
          </Alert>
        )}

        {state?.error && (
          <Alert variant="destructive">
            <HugeiconsIcon
              icon={AlertCircleIcon}
              strokeWidth={2}
              className="size-4"
            />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {state?.success && (
          <Alert variant="default">
            <AlertTitle>Berhasil</AlertTitle>
            <AlertDescription>Properti berhasil ditambahkan</AlertDescription>
          </Alert>
        )}

        {user?.role === "owner" && (
          <div className="rounded-4xl border border-input bg-input/30 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Kontak yang akan ditampilkan ke Tenant:
              </Label>
              <Button variant="ghost" size="sm">
                <Link href="/settings/profile">Edit Profil</Link>
              </Button>
            </div>
            <div className="text-sm space-y-1">
              <p>
                <span className="font-medium">Nama:</span> {user.name || "-"}
              </p>
              <p>
                <span className="font-medium">Email:</span> {user.email || "-"}
              </p>
              <p>
                <span className="font-medium">No HP/WA:</span>{" "}
                {user.phone || (
                  <span className="text-red-500">Belum diisi</span>
                )}
              </p>
              <p>
                <span className="font-medium">Telegram:</span>{" "}
                {user.telegram || (
                  <span className="text-muted-foreground">Belum diisi</span>
                )}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">Judul Properti</Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="Contoh: Kost Melati"
            required
          />
          {errors.title && (
            <p className="text-xs text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Tipe</Label>
          <Select
            value={watch("type")}
            onValueChange={(v) =>
              setValue("type", v as CreatePropertyInput["type"])
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
          <Label htmlFor="province">Provinsi</Label>
          <Select
            value={watch("province") ?? ""}
            onValueChange={(v) => {
              setValue("province", v ?? "");
              setValue("city", "");
            }}
          >
            <SelectTrigger id="province">
              <SelectValue placeholder="Pilih Provinsi" />
            </SelectTrigger>
            <SelectContent>
              {PROVINCES.map((prov) => (
                <SelectItem key={prov} value={prov}>
                  {prov}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.province && (
            <p className="text-xs text-red-500">{errors.province.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Kota/Kabupaten</Label>
          <Select
            value={watch("city") ?? ""}
            onValueChange={(v) => setValue("city", v ?? "")}
            disabled={!province}
          >
            <SelectTrigger id="city">
              <SelectValue
                placeholder={province ? "Pilih Kota" : "Pilih Provinsi dahulu"}
              />
            </SelectTrigger>
            <SelectContent>
              {availableCities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.city && (
            <p className="text-xs text-red-500">{errors.city.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Alamat Detail</Label>
          <div className="flex gap-2">
            <Input
              id="address"
              {...register("address")}
              placeholder="Jl. Sudirman No. 123, RT 05/RW 10"
              required
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleGeolocation}
              title="Gunakan lokasi saat ini"
            >
              <HugeiconsIcon
                icon={Location02Icon}
                strokeWidth={2}
                className="size-4"
              />
            </Button>
          </div>
          {errors.address && (
            <p className="text-xs text-red-500">{errors.address.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Foto Properti (Minimal 3, Maksimal 5)</Label>
          <Dropzone
            onFilesChange={handleFilesChange}
            maxFiles={5}
            minFiles={3}
            currentFiles={files}
          />
          <div className="flex items-center justify-between text-xs">
            <span
              className={
                imageCount < 3
                  ? "text-red-500 font-medium"
                  : "text-muted-foreground"
              }
            >
              Foto terupload: {imageCount}/5 (Minimal 3)
            </span>
            {imageCount < 3 && (
              <span className="text-red-500">
                Kurang {3 - imageCount} gambar lagi
              </span>
            )}
          </div>
          {imageCount < 3 && (
            <div className="h-2 w-full rounded-full bg-red-100 overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${(imageCount / 5) * 100}%` }}
              />
            </div>
          )}
          {errors.images && (
            <p className="text-xs text-red-500">{errors.images.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Paket Harga</Label>
          <PackageForm
            type={watch("type")}
            onChange={(packs) => setValue("packages", packs)}
          />
        </div>

        <div className="space-y-2">
          <Label>Amenities</Label>
          <div className="flex gap-2">
            <Input
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addAmenity(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
              placeholder="Ketik dan tekan Enter"
            />
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
            {...register("description")}
            placeholder="Deskripsi singkat properti..."
            className="w-full min-h-[80px] rounded-4xl border border-input bg-input/30 px-3 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => reset()}>
            Batal
          </Button>
          <Button type="submit" disabled={isPending || !canSubmit}>
            {isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </form>

      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lengkapi Data Kontak</DialogTitle>
          </DialogHeader>
          <Alert>
            <HugeiconsIcon
              icon={AlertCircleIcon}
              strokeWidth={2}
              className="size-4"
            />
            <AlertTitle>Data Kontak Belum Lengkap</AlertTitle>
            <AlertDescription>
              Anda harus melengkapi {contactMissing.join(", ")} di profil
              sebelum dapat menambah properti.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end">
            <Button onClick={() => setShowContactModal(false)}>Mengerti</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}