"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  Edit01Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";
import { getRoleBadgeVariant } from "@/lib/constants/user";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { apiClient } from "@/lib/axios";
import { withAdminAuth } from "@/lib/with-admin-auth";

interface UserDetail {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  isBanned: boolean;
  phone: string | null;
  whatsapp: string | null;
  telegram: string | null;
  district: string | null;
  city: string | null;
  province: string | null;
  kycStatus: string;
  reputationScore: string;
  balance: string;
  createdAt: string;
  updatedAt: string;
}

function UserViewPage() {
  const params = useParams();
  const userId = params.id as string;
  const { data: session } = useSession();

  const { data, isLoading, isError, error } = useQuery<{ data: UserDetail }>({
    queryKey: ["user", userId],
    queryFn: async () => {
      const { data: json } = await apiClient.get(`/api/users/${userId}`);
      return json;
    },
    staleTime: 30000,
  });

  const user = data?.data;

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
            {error instanceof Error ? error.message : "Gagal memuat data user."}
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
              { label: user.name },
            ]}
          />
          <h1 className="text-2xl font-bold tracking-tight mt-2">
            Detail User
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            render={<Link href="/admin/users" />}
            variant="outline"
            nativeButton={false}
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              strokeWidth={2}
              className="mr-2 size-4"
            />
            Kembali
          </Button>
          <Button
            render={<Link href={`/admin/users/edit/${user.id}`} />}
            nativeButton={false}
          >
            <HugeiconsIcon
              icon={Edit01Icon}
              strokeWidth={2}
              className="mr-2 size-4"
            />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Akun</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Nama</p>
                <p className="text-sm font-medium">{user.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <Badge
                  variant={getRoleBadgeVariant(user.role)}
                  className="capitalize"
                >
                  {user.role}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={user.isActive ? "default" : "destructive"}>
                  {user.isActive ? "Aktif" : "Nonaktif"}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">KYC Status</p>
                <p className="text-sm font-medium capitalize">
                  {user.kycStatus}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reputasi</p>
                <p className="text-sm font-medium">
                  {Number(user.reputationScore ?? 0).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kontak</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Telepon</p>
                <p className="text-sm font-medium">{user.phone || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">WhatsApp</p>
                <p className="text-sm font-medium">{user.whatsapp || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Telegram</p>
                <p className="text-sm font-medium">{user.telegram || "-"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lokasi</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Provinsi</p>
                <p className="text-sm font-medium">{user.province || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kota</p>
                <p className="text-sm font-medium">{user.city || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kecamatan</p>
                <p className="text-sm font-medium">{user.district || "-"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Keuangan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Saldo</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  }).format(Number(user.balance ?? 0))}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Dibuat</span>
                <span className="font-medium">
                  {new Date(user.createdAt).toLocaleDateString("id-ID")}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Diperbarui</span>
                <span className="font-medium">
                  {new Date(user.updatedAt).toLocaleDateString("id-ID")}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default withAdminAuth(UserViewPage);
