"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BuildingIcon,
  UsersIcon,
  CalendarIcon,
  ActivityIcon,
} from "@hugeicons/core-free-icons";
import { apiClient } from "@/lib/axios";
import { withAdminAuth } from "@/lib/with-admin-auth";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";

interface AdminInsightsData {
  userStats: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  propertyStats: {
    total: number;
    active: number;
    featured: number;
    gpsVerified: number;
  };
  bookingStats: {
    total: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    confirmationRate: number;
  };
  platformHealth: {
    totalRevenue: number;
    monthlyRevenue: number;
    activeOwners: number;
    activeTenants: number;
  };
}

export default withAdminAuth(AdminInsightsPage);

function AdminInsightsPage() {
  const { data, isLoading, isError, error, refetch: _refetch } = useQuery<AdminInsightsData>({
    queryKey: ["admin-insights"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/admin/insights");
      return data;
    },
    staleTime: 60000,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="container py-6 space-y-6">
      <div>
        <BreadcrumbNav
          items={[
            { label: "Dashboard Admin", href: "/admin" },
            { label: "Wawasan" },
          ]}
        />
        <h1 className="text-3xl font-bold tracking-tight mt-2">Wawasan Platform</h1>
        <p className="text-muted-foreground">
          Ringkasan kondisi platform KonkosYuk
        </p>
      </div>

      {isError && (
        <Alert variant="destructive">
          <HugeiconsIcon
            icon={ActivityIcon}
            strokeWidth={2}
            className="size-4"
          />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Gagal memuat data wawasan."}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total User
            </CardTitle>
            <HugeiconsIcon
              icon={UsersIcon}
              strokeWidth={2}
              className="size-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                data?.userStats?.total ?? 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.userStats?.active ?? 0} aktif · {data?.userStats?.newThisMonth ?? 0} baru bulan ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Properti
            </CardTitle>
            <HugeiconsIcon
              icon={BuildingIcon}
              strokeWidth={2}
              className="size-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                data?.propertyStats?.total ?? 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.propertyStats?.gpsVerified ?? 0} GPS terverifikasi · {data?.propertyStats?.featured ?? 0} featured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Booking
            </CardTitle>
            <HugeiconsIcon
              icon={CalendarIcon}
              strokeWidth={2}
              className="size-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                data?.bookingStats?.total ?? 0
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.bookingStats?.confirmationRate ?? 0}% konfirmasi · {data?.bookingStats?.cancelled ?? 0} batal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendapatan Bulan Ini
            </CardTitle>
            <HugeiconsIcon
              icon={ActivityIcon}
              strokeWidth={2}
              className="size-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                formatCurrency(data?.platformHealth?.monthlyRevenue ?? 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total: {formatCurrency(data?.platformHealth?.totalRevenue ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Owner Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                data?.platformHealth.activeOwners ?? 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tenant Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                data?.platformHealth.activeTenants ?? 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tingkat Konfirmasi Booking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>{data?.bookingStats?.confirmationRate ?? 0}%</>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.bookingStats?.confirmed ?? 0} dari {data?.bookingStats?.total ?? 0} booking
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
