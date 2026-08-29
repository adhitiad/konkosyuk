"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BuildingIcon,
  UsersIcon,
  CalendarIcon,
  ActivityIcon,
} from "@hugeicons/core-free-icons";
import { apiClient } from "@/lib/axios";

interface InsightsData {
  propertyStats: {
    total: number;
    active: number;
    withImages: number;
    gpsVerified: number;
    featured: number;
    completionRate: number;
  };
  inquiryStats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    paid: number;
    responseRate: number;
  };
  bookingStats: {
    total: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    confirmationRate: number;
  };
  rankingTips: string[];
}

export default function OwnerInsightsPage() {
  const { data, isLoading } = useQuery<InsightsData>({
    queryKey: ["owner-insights"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/owner/insights");
      return data.data;
    },
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Insights</h1>
        <p className="text-muted-foreground">Gagal memuat data insights.</p>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Insights</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Properti Aktif
            </CardTitle>
            <HugeiconsIcon
              icon={BuildingIcon}
              strokeWidth={2}
              className="size-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {data.propertyStats?.active ?? 0} / {data.propertyStats?.total ?? 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.propertyStats?.completionRate ?? 0}% lengkap
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inquiry Baru
            </CardTitle>
            <HugeiconsIcon
              icon={UsersIcon}
              strokeWidth={2}
              className="size-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.inquiryStats?.total ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.inquiryStats?.responseRate ?? 0}% respons rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Booking Bulan Ini
            </CardTitle>
            <HugeiconsIcon
              icon={CalendarIcon}
              strokeWidth={2}
              className="size-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.bookingStats?.total ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.bookingStats?.confirmationRate ?? 0}% konfirmasi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              GPS Terverifikasi
            </CardTitle>
            <HugeiconsIcon
              icon={ActivityIcon}
              strokeWidth={2}
              className="size-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {data.propertyStats?.gpsVerified ?? 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.propertyStats?.featured ?? 0} featured
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rekomendasi Peningkatan Peringkat</CardTitle>
        </CardHeader>
        <CardContent>
          {data.rankingTips?.length === 0 ? (
            <p className="text-muted-foreground">
              Properti Anda sudah dalam kondisi bagus!
            </p>
          ) : (
            <ul className="space-y-2">
              {data.rankingTips?.map((tip, index) => (
                <li
                  key={index}
                  className="text-sm text-muted-foreground border-l-2 border-primary pl-3"
                >
                  {tip}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
