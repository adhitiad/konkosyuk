"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { toast } from "@/components/ui/toast";
import { withAdminAuth } from "@/lib/with-admin-auth";
import { ROLE_OPTIONS } from "@/lib/constants/user";
import { ImageUpload } from "@/components/ui/image-upload";
import { apiClient } from "@/lib/axios";
import { updateUserAction } from "@/actions/admin/users";

interface UserDetail {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  image?: string | null;
  phone: string | null;
  whatsapp: string | null;
  telegram: string | null;
  district: string | null;
  city: string | null;
  province: string | null;
  createdAt: string;
  updatedAt: string;
}

function UserEditPage() {
  const params = useParams();
  const userId = params.id as string;
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isError,
    error: queryError,
  } = useQuery<{ data: UserDetail }>({
    queryKey: ["user", userId],
    queryFn: async () => {
      const { data: json } = await apiClient.get(`/api/users/${userId}`);
      return json;
    },
    staleTime: 30000,
    enabled: !!userId,
  });

  const user = data?.data;

  const [editName, setEditName] = useState(user?.name ?? "");
  const [editEmail, setEditEmail] = useState(user?.email ?? "");
  const [editRole, setEditRole] = useState(user?.role ?? "");
  const [editIsActive, setEditIsActive] = useState(user?.isActive ?? true);
  const [editIsBanned, setEditIsBanned] = useState(user?.isBanned ?? false);
  const [editPhone, setEditPhone] = useState(user?.phone ?? "");
  const [editWhatsapp, setEditWhatsapp] = useState(user?.whatsapp ?? "");
  const [editTelegram, setEditTelegram] = useState(user?.telegram ?? "");
  const [editDistrict, setEditDistrict] = useState(user?.district ?? "");
  const [editCity, setEditCity] = useState(user?.city ?? "");
  const [editProvince, setEditProvince] = useState(user?.province ?? "");
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);

  const editMutation = useMutation({
    mutationFn: async ({
      userId,
      name,
      email,
      role,
      isActive,
      isBanned,
      image,
      phone,
      whatsapp,
      telegram,
      district,
      city,
      province,
    }: {
      userId: string;
      name?: string;
      email?: string;
      role?: string;
      isActive?: boolean;
      isBanned?: boolean;
      image?: string | null;
      phone?: string | null;
      whatsapp?: string | null;
      telegram?: string | null;
      district?: string | null;
      city?: string | null;
      province?: string | null;
    }) => {
      const formData = new FormData();
      formData.append("id", userId);
      if (name !== undefined) formData.append("name", name);
      if (email !== undefined) formData.append("email", email);
      if (role !== undefined) formData.append("role", role);
      if (isActive !== undefined) formData.append("isActive", String(isActive));
      if (isBanned !== undefined) formData.append("isBanned", String(isBanned));
      if (image !== undefined) formData.append("image", image || "");
      if (phone !== undefined) formData.append("phone", phone || "");
      if (whatsapp !== undefined) formData.append("whatsapp", whatsapp || "");
      if (telegram !== undefined) formData.append("telegram", telegram || "");
      if (district !== undefined) formData.append("district", district || "");
      if (city !== undefined) formData.append("city", city || "");
      if (province !== undefined) formData.append("province", province || "");

      const result = await updateUserAction(undefined, formData);
      if (!result.success) {
        throw new Error(result.error || "Failed to update user");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "User diperbarui",
        description: "Data user telah diubah.",
        type: "success",
      });
    },
    onError: (err) => {
      toast({
        title: "Gagal",
        description:
          err instanceof Error ? err.message : "Gagal mengubah user.",
        type: "error",
      });
    },
  });

  const handleSave = () => {
    if (!user) return;
    const changes: Record<string, unknown> = {};
    if (editName !== user.name) changes.name = editName;
    if (editEmail !== user.email) changes.email = editEmail;
    if (editRole !== user.role) changes.role = editRole;
    if (editIsActive !== user.isActive) changes.isActive = editIsActive;
    if (editIsBanned !== user.isBanned) changes.isBanned = editIsBanned;
    if (editPhone !== (user.phone || "")) changes.phone = editPhone || null;
    if (editWhatsapp !== (user.whatsapp || ""))
      changes.whatsapp = editWhatsapp || null;
    if (editTelegram !== (user.telegram || ""))
      changes.telegram = editTelegram || null;
    if (editDistrict !== (user.district || ""))
      changes.district = editDistrict || null;
    if (editCity !== (user.city || "")) changes.city = editCity || null;
    if (editProvince !== (user.province || ""))
      changes.province = editProvince || null;
    if (newImageUrl !== null) changes.image = newImageUrl;

    if (Object.keys(changes).length === 0) {
      toast({
        title: "Tidak ada perubahan",
        description: "Data user tidak berubah.",
        type: "info",
      });
      return;
    }

    editMutation.mutate({ userId: user.id, ...changes });
  };

  if (isLoading) {
    return (
      <div className="container py-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !user) {
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
            {queryError instanceof Error
              ? queryError.message
              : "Gagal memuat data user."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <BreadcrumbNav
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Manajemen User", href: "/admin/users" },
              { label: `Edit ${user.name}` },
            ]}
          />
          <h1 className="text-2xl font-bold tracking-tight mt-2">Edit User</h1>
          <p className="text-muted-foreground">Ubah data user</p>
        </div>
        <Button
          render={
            <Link href={`/admin/users/view/${user.id}`}>
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                strokeWidth={2}
                className="mr-2 size-4"
              />
              Batal
            </Link>
          }
          variant="outline"
          nativeButton={false}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Akun</CardTitle>
        </CardHeader>

        <div className="px-6 pb-4">
          <ImageUpload
            initialImageUrl={user.image}
            onUploadComplete={(url) => setNewImageUrl(url)}
          />
        </div>

        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama</label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select<string>
              value={editRole}
              onValueChange={(v) => v && setEditRole(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select<string>
              value={editIsActive ? "active" : "inactive"}
              onValueChange={(v) => setEditIsActive(v === "active")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kontak & Lokasi</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Telepon</label>
            <Input
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">WhatsApp</label>
            <Input
              value={editWhatsapp}
              onChange={(e) => setEditWhatsapp(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Telegram</label>
            <Input
              value={editTelegram}
              onChange={(e) => setEditTelegram(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Provinsi</label>
            <Input
              value={editProvince}
              onChange={(e) => setEditProvince(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Kota</label>
            <Input
              value={editCity}
              onChange={(e) => setEditCity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Kecamatan</label>
            <Input
              value={editDistrict}
              onChange={(e) => setEditDistrict(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Keamanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isBanned"
              checked={editIsBanned}
              onChange={(e) => setEditIsBanned(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <label htmlFor="isBanned" className="text-sm font-medium">
              Akun Diblokir
            </label>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            User yang diblokir tidak akan dapat login ke sistem.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          render={<Link href={`/admin/users/view/${user.id}`} />}
          variant="outline"
          nativeButton={false}
        >
          Batal
        </Button>
        <Button disabled={editMutation.isPending} onClick={handleSave}>
          {editMutation.isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </div>
  );
}

export default withAdminAuth(UserEditPage);
