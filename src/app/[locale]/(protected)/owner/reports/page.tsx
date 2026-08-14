"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { withOwnerAuth } from "@/lib/with-owner-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Home,
  Users,
  Calendar,
} from "lucide-react";
import OwnerReportList from "@/components/reports/owner-report-list";

interface ReportStats {
  totalRevenue: number;
  monthlyRevenue: number;
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  availableUnits: number;
  totalBookings: number;
  pendingBookings: number;
  occupancyRate: number;
}

function OwnerReportsPage() {
  const { data, isLoading } = useQuery<ReportStats>({
    queryKey: ["owner-reports"],
    queryFn: async () => {
      const response = await apiClient.get("/api/owner/reports");
      const body = response.data as { data?: ReportStats };
      if (body.data) return body.data;
      const inner = (body as any)?.data?.data;
      if (inner) return inner;
      throw new Error("Invalid reports response");
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const stats: ReportStats = data || {
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalProperties: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    availableUnits: 0,
    totalBookings: 0,
    pendingBookings: 0,
    occupancyRate: 0,
  };

  return (
    <div className="container py-6 space-y-6">
      <div>
        <BreadcrumbNav
          items={[
            { label: "Dashboard", href: "/owner" },
            { label: "Laporan & Analitik" },
          ]}
        />
        <h1 className="text-3xl font-bold tracking-tight mt-2">
          Laporan & Analitik
        </h1>
        <p className="text-muted-foreground">
          Pantau performa properti dan pendapatan Anda
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pendapatan
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Semua waktu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendapatan Bulan Ini
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.monthlyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date().toLocaleString("id-ID", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tingkat Hunian
            </CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.occupiedUnits} dari {stats.totalUnits} unit terisi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Booking
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingBookings} pending
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Properti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalProperties}</div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">
                  {stats.totalUnits} unit total
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unit Tersedia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.availableUnits}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">Siap disewa</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unit Terisi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats.occupiedUnits}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <TrendingDown className="h-3 w-3 text-blue-600" />
              <span className="text-xs text-blue-600">Sedang ditempati</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grafik Pendapatan (Coming Soon)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">
              Grafik pendapatan bulanan akan ditampilkan di sini
            </p>
          </div>
        </CardContent>
      </Card>
      <OwnerReportList />
    </div>
  );
}

export default withOwnerAuth(OwnerReportsPage);
