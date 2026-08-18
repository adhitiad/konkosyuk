"use client";

import { useState, useEffect, useActionState } from "react";
import { useSession } from "@/lib/auth-client";
import type { SessionUserWithRole } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, AlertTriangle } from "lucide-react";
import imageCompression from "browser-image-compression";
import { updateUserProfileAction } from "@/actions/profile";
import { uploadImageAction } from "@/actions/upload";
import { apiGet } from "@/lib/api.client";

interface RegionOption {
  id: string;
  name: string;
}

export default function ProfileSettingsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const user = session?.user as SessionUserWithRole | undefined;

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [province, setProvince] = useState(user?.province || "");
  const [city, setCity] = useState(user?.city || "");
  const [district, setDistrict] = useState(user?.district || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(user?.image || null);
  const [profileState, profileAction, isProfilePending] = useActionState(
    updateUserProfileAction,
    undefined,
  );
  const [uploadState, uploadAction, isUploadPending] = useActionState(
    uploadImageAction,
    undefined,
  );
  const [formError, setFormError] = useState<string | null>(null);

  const [provinces, setProvinces] = useState<RegionOption[]>([]);
  const [cities, setCities] = useState<RegionOption[]>([]);
  const [districts, setDistricts] = useState<RegionOption[]>([]);

  // Fetch provinces
  const { data: provincesData, isLoading: provincesLoading } = useQuery<
    RegionOption[]
  >({
    queryKey: ["provinces"],
    queryFn: async () => {
      const data = await apiGet<RegionOption[]>(
        "/api/proxy/wilayah/provinces.json",
      );
      return data;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  // Fetch cities when province is selected
  const selectedProvince = provincesData?.find((p) => p.name === province);
  const { data: citiesData, isLoading: citiesLoading } = useQuery<RegionOption[]>({
    queryKey: ["cities", selectedProvince?.id],
    queryFn: async () => {
      if (!selectedProvince) return [];
      const data = await apiGet<RegionOption[]>(
        `/api/proxy/wilayah/regencies/${selectedProvince.id}.json`,
      );
      return data;
    },
    enabled: !!selectedProvince,
    staleTime: 1000 * 60 * 60 * 24,
  });

  // Fetch districts when city is selected
  const selectedCity = citiesData?.find((c) => c.name === city);
  const { data: districtsData, isLoading: districtsLoading } = useQuery<
    RegionOption[]
  >({
    queryKey: ["districts", selectedCity?.id],
    queryFn: async () => {
      if (!selectedCity) return [];
      const data = await apiGet<RegionOption[]>(
        `/api/proxy/wilayah/districts/${selectedCity.id}.json`,
      );
      return data;
    },
    enabled: !!selectedCity,
    staleTime: 1000 * 60 * 60 * 24,
  });

  // Sync query data to state
  useEffect(() => {
    if (provincesData) setProvinces(provincesData); // eslint-disable-line react-hooks/set-state-in-effect
  }, [provincesData]);

  useEffect(() => {
    if (citiesData) setCities(citiesData); // eslint-disable-line react-hooks/set-state-in-effect
  }, [citiesData]);

  useEffect(() => {
    if (districtsData) setDistricts(districtsData); // eslint-disable-line react-hooks/set-state-in-effect
  }, [districtsData]);

  // Reset city/district when province changes
  useEffect(() => {
    if (!province) {
      setCities([]); // eslint-disable-line react-hooks/set-state-in-effect
      setCity("");
      setDistricts([]);
      setDistrict("");
    }
  }, [province]);

  // Reset district when city changes
  useEffect(() => {
    if (!city) {
      setDistricts([]); // eslint-disable-line react-hooks/set-state-in-effect
      setDistrict("");
    }
  }, [city]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormError(null);

    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      setImageFile(compressedFile);
      setImagePreview(URL.createObjectURL(compressedFile));
    } catch (err) {
      setFormError("Gagal mengompres gambar.");
      console.error(err);
    }
  };

  // Handle profile action result
  useEffect(() => {
    if (profileState?.success) {
      router.refresh();
      alert("Profil berhasil diperbarui!");
    } else if (profileState?.error) {
      setFormError(profileState.error); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [profileState, router]);

  // Handle upload action result
  useEffect(() => {
    if (uploadState?.success && uploadState.data?.url) {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("image", uploadState.data.url);
      formData.append("province", province || "");
      formData.append("city", city || "");
      formData.append("district", district || "");
      profileAction(formData);
    } else if (uploadState?.error) {
      setFormError(uploadState.error); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [uploadState, name, phone, province, city, district, profileAction]);

  if (isPending)
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  if (!session) return null;

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pengaturan Profil</h1>
        <p className="text-muted-foreground">Kelola informasi pribadi Anda</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Foto Profil</CardTitle>
          <CardDescription>
            Otomatis dikompresi menjadi maksimal 500KB
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Avatar className="h-24 w-24 border-2 border-primary/20">
            <AvatarImage src={imagePreview || undefined} alt={name} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex items-center gap-2">
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              disabled={isProfilePending || isUploadPending}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("avatar")?.click()}
              disabled={isProfilePending || isUploadPending}
            >
              <Upload className="mr-2 h-4 w-4" />
              {imagePreview ? "Ganti Foto" : "Upload Foto"}
            </Button>
            {imageFile && (
              <span className="text-xs text-muted-foreground">
                ({(imageFile.size / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <form action={profileAction} className="space-y-6">
        {formError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Informasi Pribadi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isProfilePending || isUploadPending}
              />
              {(session.user as SessionUserWithRole).role === "owner" && (
                <p className="text-xs text-amber-600 font-medium">
                  Nama HARUS sama dengan KTP/Buku Tabungan untuk pencairan dana
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={session.user.email || ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="0812xxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={isProfilePending || isUploadPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="province">Provinsi</Label>
              <input type="hidden" name="province" value={province} />
<Select
                value={province}
                onValueChange={(value) => {
                  setProvince(value ?? "");
                  setCity("");
                  setDistrict("");
                }}
                disabled={
                  provincesLoading || isProfilePending || isUploadPending
                }
              >
                <SelectTrigger id="province">
                  <SelectValue
                    placeholder={
                      provincesLoading ? "Memuat provinsi..." : "Pilih Provinsi"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((prov) => (
                    <SelectItem key={prov.id} value={prov.name}>
                      {prov.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Kota/Kabupaten</Label>
              <input type="hidden" name="city" value={city} />
              <Select
                value={city}
                onValueChange={(value) => {
                  setCity(value ?? "");
                  setDistrict("");
                }}
                disabled={
                  !province ||
                  citiesLoading ||
                  isProfilePending ||
                  isUploadPending
                }
              >
                <SelectTrigger id="city">
                  <SelectValue
                    placeholder={
                      citiesLoading
                        ? "Memuat kota..."
                        : !province
                        ? "Pilih provinsi dahulu"
                        : "Pilih Kota/Kabupaten"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">Kecamatan</Label>
              <input type="hidden" name="district" value={district} />
              <Select
                value={district}
                onValueChange={(value) => setDistrict(value ?? "")}
                disabled={
                  !city ||
                  districtsLoading ||
                  isProfilePending ||
                  isUploadPending
                }
              >
                <SelectTrigger id="district">
                  <SelectValue
                    placeholder={
                      districtsLoading
                        ? "Memuat kecamatan..."
                        : !city
                        ? "Pilih kota dahulu"
                        : "Pilih Kecamatan"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d.id} value={d.name}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isProfilePending || isUploadPending}
            >
              {isProfilePending || isUploadPending
                ? "Menyimpan..."
                : "Simpan Perubahan"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
