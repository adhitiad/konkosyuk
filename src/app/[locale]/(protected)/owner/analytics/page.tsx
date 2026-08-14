"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BarChartIcon,
  CalendarDaysIcon,
  CurrencyIcon,
  TrendingUp,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/axios";

interface AnalyticsData {
  totalBookings: number;
  totalRevenue: number;
  occupancyRate: number;
  bookingsPerMonth: Array<{ month: string; count: number }>;
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["owner-analytics"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/owner/analytics");
      return data;
    },
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Analytics</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Booking
            </CardTitle>
            <HugeiconsIcon
              icon={CalendarDaysIcon}
              strokeWidth={2}
              className="size-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.totalBookings ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pendapatan
            </CardTitle>
            <HugeiconsIcon
              icon={CurrencyIcon}
              strokeWidth={2}
              className="size-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              Rp {(data?.totalRevenue ?? 0).toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Occupancy Rate
            </CardTitle>
            <HugeiconsIcon
              icon={TrendingUp}
              strokeWidth={2}
              className="size-4 text-muted-foreground"
            />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {((data?.occupancyRate ?? 0) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Booking per Bulan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Chart akan ditampilkan di sini (gunakan recharts)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
