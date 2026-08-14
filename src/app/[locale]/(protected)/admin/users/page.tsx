"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActionState } from "react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  Edit01Icon,
  Delete01Icon,
  Plus,
} from "@hugeicons/core-free-icons";
import { toast } from "@/components/ui/toast";
import { apiClient } from "@/lib/axios";
import { withAdminAuth } from "@/lib/with-admin-auth";
import { ROLE_OPTIONS, getRoleBadgeVariant } from "@/lib/constants/user";
import { FaCheck, FaTimes, FaTrash } from "react-icons/fa";
import Link from "next/link";
import { ImageUpload } from "@/components/ui/image-upload";
import { updateUserAction, deleteUserAction } from "@/actions/admin/users";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  isBanned?: boolean;
  createdAt?: string;
}

interface UsersResponse {
  data: User[];
  meta: {
    total: number;
  };
}

interface AdminUsersPageProps {}

const AdminUsersPage = ({}: AdminUsersPageProps) => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createRole, setCreateRole] = useState("cust");
  const [createPassword, setCreatePassword] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createImage, setCreateImage] = useState("");
  const [createWhatsApp, setCreateWhatsApp] = useState("");
  const [createTelegram, setCreateTelegram] = useState("");
  const [createProvince, setCreateProvince] = useState("");
  const [createCity, setCreateCity] = useState("");
  const [createDistrict, setCreateDistrict] = useState("");
  const [createIsActive, setCreateIsActive] = useState(true);

  const limit = 10;

  const { data, isLoading, isError, error, refetch } = useQuery<UsersResponse>({
    queryKey: ["admin-users", page, search, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);

      const { data: json } = await apiClient.get(
        `/api/users?${params.toString()}`,
      );
      return { data: json.data?.data, meta: json.data?.meta };
    },
    staleTime: 30000,
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      userId,
      name,
      role,
      isActive,
      isBanned,
    }: {
      userId: string;
      name?: string;
      role?: string;
      isActive?: boolean;
      isBanned?: boolean;
    }) => {
      const formData = new FormData();
      formData.append("id", userId);
      if (name !== undefined) formData.append("name", name);
      if (role !== undefined) formData.append("role", role);
      if (isActive !== undefined) formData.append("isActive", String(isActive));
      if (isBanned !== undefined) formData.append("isBanned", String(isBanned));
      
      const result = await updateUserAction(undefined, formData);
      if (!result.success) {
        throw new Error(result.error || "Failed to update user");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({
        title: "User diperbarui",
        description: "Data user telah diubah.",
        type: "success",
      });
      setSelectedUser(null);
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

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const formData = new FormData();
      formData.append("id", userId);
      
      const result = await deleteUserAction(undefined, formData);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete user");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({
        title: "User dihapus",
        description: "User telah dihapus.",
        type: "success",
      });
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast({
        title: "Gagal",
        description:
          err instanceof Error ? err.message : "Gagal menghapus user.",
        type: "error",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({
      name,
      email,
      role,
      password,
      phone,
      image,
      whatsapp,
      telegram,
      province,
      city,
      district,
      isActive,
    }: {
      name: string;
      email: string;
      role: string;
      password: string;
      phone?: string;
      image?: string;
      whatsapp?: string;
      telegram?: string;
      province?: string;
      city?: string;
      district?: string;
      isActive: boolean;
    }) => {
      const res = await apiClient.post("/api/admin/users", {
        name,
        email,
        role,
        password,
        phone,
        image,
        whatsapp,
        telegram,
        province,
        city,
        district,
        isActive,
      });
      if (res.status >= 400) {
        const text = res.data;
        throw new Error(text || "Failed to create user");
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({
        title: "User created",
        description: "New user has been created.",
        type: "success",
      });
      setCreateOpen(false);
      setCreateName("");
      setCreateEmail("");
      setCreateRole("cust");
      setCreatePassword("");
      setCreatePhone("");
      setCreateImage("");
      setCreateWhatsApp("");
      setCreateTelegram("");
      setCreateProvince("");
      setCreateCity("");
      setCreateDistrict("");
      setCreateIsActive(true);
    },
    onError: (err) => {
      toast({
        title: "Gagal",
        description: err instanceof Error ? err.message : "Gagal membuat user.",
        type: "error",
      });
    },
  });

  const users = Array.isArray(data?.data) ? data.data : [];
  const total = data?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const openEdit = (user: User) => {
    setSelectedUser(user);
    setEditName(user.name);
    setEditRole(user.role);
  };

  const handleSaveEdit = () => {
    if (!selectedUser) return;
    updateMutation.mutate({
      userId: selectedUser.id,
      name: editName !== selectedUser.name ? editName : undefined,
      role: editRole !== selectedUser.role ? editRole : undefined,
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <BreadcrumbNav
          items={[
            { label: "Dashboard", href: "/admin" },
            { label: "Manajemen User" },
          ]}
        />
        <h1 className="text-2xl font-bold tracking-tight">Manajemen User</h1>
        <p className="text-muted-foreground">Kelola semua user di sistem</p>
        <div className="mt-4">
          <Button onClick={() => setCreateOpen(true)}>
            <HugeiconsIcon
              icon={Plus}
              strokeWidth={2}
              className="size-4 mr-2"
            />
            Create User
          </Button>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive" className="mb-6">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            strokeWidth={2}
            className="size-4"
          />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Gagal memuat data user."}
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Cari nama atau email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />
        <Select<string>
          value={roleFilter}
          onValueChange={(v) => {
            setRoleFilter(v ?? "");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua Role</SelectItem>
            {ROLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: limit }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-sm">Tidak ada user untuk filter ini.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Nama</TableHead>
                    <TableHead scope="col">Email</TableHead>
                    <TableHead scope="col">Role</TableHead>
                    <TableHead scope="col">Status</TableHead>
                    <TableHead scope="col">Ket. Ban</TableHead>
                    {/* <TableHead scope="col"></TableHead> */}
                    <TableHead scope="col">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/users/edit/${user.id}`}
                          className="hover:underline"
                        >
                          {user.name}
                        </Link>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={getRoleBadgeVariant(user.role)}
                          className="capitalize"
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.isActive ? "default" : "destructive"}
                        >
                          {user.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {user.isBanned ? (
                          <FaCheck className="text-green-500" />
                        ) : (
                          <FaTimes className="text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(user)}
                          >
                            <HugeiconsIcon
                              icon={Edit01Icon}
                              strokeWidth={2}
                              className="size-4"
                            />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteTarget(user)}
                          >
                            <HugeiconsIcon
                              icon={Delete01Icon}
                              strokeWidth={2}
                              className="size-4"
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      <Dialog
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
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
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                  Batal
                </Button>
                <Button
                  disabled={updateMutation.isPending}
                  onClick={handleSaveEdit}
                >
                  {updateMutation.isPending ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus User</DialogTitle>
          </DialogHeader>
          {deleteTarget && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Apakah kamu yakin ingin menghapus user &quot;{deleteTarget.name}
                &quot;? Aksi ini tidak bisa dibatalkan.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                  onClick={handleDelete}
                >
                  {deleteMutation.isPending ? (
                    "Menghapus..."
                  ) : (
                    <FaTrash className="mr-2" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-4">
            <ImageUpload
              initialImageUrl={createImage}
              onUploadComplete={(url) => setCreateImage(url)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Nama</Label>
              <Input
                id="create-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Nama lengkap"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-phone">Phone</Label>
              <Input
                id="create-phone"
                value={createPhone}
                onChange={(e) => setCreatePhone(e.target.value)}
                placeholder="08123456789"
                className="w-full"
              />
            </div>
            <div className="space-y-2"></div>
            <div className="space-y-2">
              <Label htmlFor="create-whatsapp">WhatsApp</Label>
              <Input
                id="create-whatsapp"
                value={createWhatsApp}
                onChange={(e) => setCreateWhatsApp(e.target.value)}
                placeholder="08123456789"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-telegram">Telegram</Label>
              <Input
                id="create-telegram"
                value={createTelegram}
                onChange={(e) => setCreateTelegram(e.target.value)}
                placeholder="@username"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-province">Province</Label>
              <Input
                id="create-province"
                value={createProvince}
                onChange={(e) => setCreateProvince(e.target.value)}
                placeholder="DKI Jakarta"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-city">City</Label>
              <Input
                id="create-city"
                value={createCity}
                onChange={(e) => setCreateCity(e.target.value)}
                placeholder="Jakarta Selatan"
                className="w-full"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="create-district">District</Label>
              <Input
                id="create-district"
                value={createDistrict}
                onChange={(e) => setCreateDistrict(e.target.value)}
                placeholder="Kebayoran Baru"
                className="w-full"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="create-role">Role</Label>
              <Select<string>
                value={createRole}
                onValueChange={(v) => v && setCreateRole(v)}
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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch
                id="create-active"
                checked={createIsActive}
                onCheckedChange={setCreateIsActive}
              />
              <Label htmlFor="create-active" className="cursor-pointer">
                Aktif
              </Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() =>
                createMutation.mutate({
                  name: createName,
                  email: createEmail,
                  role: createRole,
                  password: createPassword,
                  phone: createPhone,
                  image: createImage,
                  whatsapp: createWhatsApp,
                  telegram: createTelegram,
                  province: createProvince,
                  city: createCity,
                  district: createDistrict,
                  isActive: createIsActive,
                })
              }
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Membuat..." : "Buat"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default withAdminAuth(AdminUsersPage);
