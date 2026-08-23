"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { toast } from "@/components/ui/toast";
import { apiClient } from "@/lib/axios";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { withAdminAuth } from "@/lib/with-admin-auth";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { approvePropertyAction } from "@/actions/properties";
import { getBookingsAction } from "@/actions/bookings";

interface AdminStats {
  totalUsers: number;
  totalProperties: number;
  totalBookingsToday: number;
  totalRevenue: number;
}

interface AdminProperty {
  id: string;
  name: string;
  address: string;
  type: string;
  ownerName: string | null;
  isActive: boolean;
  createdAt: string;
}

interface PendingPropertiesResponse {
  data: AdminProperty[];
}

type PendingPropertiesCacheData = PendingPropertiesResponse | undefined;

interface AdminBooking {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  propertyName: string | null;
  unitName: string | null;
  userName: string | null;
  userEmail: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
  propertyId: string;
}

function unwrapApiResponse<T>(response: unknown): T {
  if (typeof response === "object" && response !== null && "data" in response) {
    const candidate = (response as { data?: T }).data;
    if (candidate !== undefined) return candidate;
  }
  return response as T;
}

export default withAdminAuth(AdminDashboardPage);

function AdminDashboardPage() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [usersRes, propertiesRes, bookingsResult] = await Promise.all([
        apiClient.get("/api/users"),
        apiClient.get("/api/properties"),
        getBookingsAction(),
      ]);

      const usersList: unknown[] = Array.isArray(usersRes.data)
        ? usersRes.data
        : (unwrapApiResponse<{ data?: unknown[] }>(usersRes.data).data ?? []);

      const propertiesList: unknown[] = Array.isArray(propertiesRes.data)
        ? propertiesRes.data
        : (unwrapApiResponse<{ data?: unknown[] }>(propertiesRes.data).data ??
          []);

      const bookingsList: AdminBooking[] = bookingsResult.success
        ? ((bookingsResult.data ?? []) as unknown as AdminBooking[])
        : [];

      const today = new Date().toISOString().split("T")[0];
      const bookingsToday = bookingsList.filter((b) =>
        b.createdAt?.startsWith(today),
      );

      const revenue = bookingsList
        .filter(
          (b) =>
            b.status === "confirmed" || b.status === "awaiting_full_payment",
        )
        .reduce((sum, b) => {
          const metadata = b.metadata as Record<string, unknown> | undefined;
          const totalPrice = metadata?.totalPrice
            ? Number(metadata.totalPrice)
            : 0;
          return sum + totalPrice;
        }, 0);

      return {
        totalUsers: usersList.length,
        totalProperties: propertiesList.length,
        totalBookingsToday: bookingsToday.length,
        totalRevenue: revenue,
      };
    },
    staleTime: 30000,
  });

  const { data: pendingProperties, isLoading: propertiesLoading } = useQuery<
    AdminProperty[]
  >({
    queryKey: ["admin-pending-properties"],
    queryFn: async () => {
      const { data: json } = await apiClient.get("/api/properties");
      const payload = unwrapApiResponse<{ data?: AdminProperty[] }>(json);
      return (payload.data ?? []).filter((p: AdminProperty) => !p.isActive);
    },
    staleTime: 30000,
  });

  const { data: problematicBookings, isLoading: bookingsLoading } = useQuery<
    AdminBooking[]
  >({
    queryKey: ["admin-problematic-bookings"],
    queryFn: async () => {
      const result = await getBookingsAction();
      if (!result.success) {
        throw new Error("Gagal memuat booking bermasalah");
      }
      const bookingsList = ((result.data ?? []) as unknown as AdminBooking[]);
      return bookingsList.filter((b) =>
        ["rejected", "cancelled"].includes(b.status),
      );
    },
    staleTime: 30000,
  });

  const {
    data: monthlyRevenue,
    isLoading: monthlyLoading,
    isError: monthlyError,
  } = useQuery<{
    chartData: {
      month: string;
      totalGMV: number;
      platformFee: number;
      ownerEarnings: number;
      count: number;
    }[];
    period: { startDate: string; endDate: string };
    feePercent: number;
  }>({
    queryKey: ["admin-monthly-revenue"],
    queryFn: async () => {
      const { data: json } = await apiClient.get(
        "/api/admin/analytics/revenue-trend?months=12",
      );
      return unwrapApiResponse(json);
    },
    staleTime: 30000,
  });

  const {
    data: platformRevenue,
    isLoading: platformLoading,
    isError: platformError,
  } = useQuery<{
    chartData: { platform: string; revenue: number; count: number }[];
    period: { startDate: string; endDate: string };
  }>({
    queryKey: ["admin-platform-revenue"],
    queryFn: async () => {
      const { data: json } = await apiClient.get(
        "/api/admin/analytics/revenue-by-platform?months=12",
      );
      return unwrapApiResponse(json);
    },
    staleTime: 30000,
  });

  const approveMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const formData = new FormData();
      formData.append("propertyId", propertyId);
      formData.append("isActive", "true");
      const result = await approvePropertyAction(undefined, formData);
      if (!result.success) {
        throw new Error(result.error || "Failed to approve property");
      }
      return result.data;
    },
    onMutate: async (propertyId) => {
      await queryClient.cancelQueries({
        queryKey: ["admin-pending-properties"],
      });
      const previous = queryClient.getQueryData<PendingPropertiesCacheData>([
        "admin-pending-properties",
      ]);
      queryClient.setQueryData<PendingPropertiesCacheData>(
        ["admin-pending-properties"],
        (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.filter((p) => p.id !== propertyId),
          };
        },
      );
      return { previous };
    },
    onError: (err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["admin-pending-properties"],
          context.previous,
        );
      }
      toast({
        title: "Gagal",
        description:
          err instanceof Error ? err.message : "Gagal menyetujui properti.",
        type: "error",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-properties"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({
        title: "Properti disetujui",
        description: "Properti sekarang aktif dan terlihat oleh public.",
        type: "success",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const formData = new FormData();
      formData.append("propertyId", propertyId);
      formData.append("isActive", "false");
      const result = await approvePropertyAction(undefined, formData);
      if (!result.success) {
        throw new Error(result.error || "Failed to reject property");
      }
      return result.data;
    },
    onMutate: async (propertyId) => {
      await queryClient.cancelQueries({
        queryKey: ["admin-pending-properties"],
      });
      const previous = queryClient.getQueryData<PendingPropertiesCacheData>([
        "admin-pending-properties",
      ]);
      queryClient.setQueryData<PendingPropertiesCacheData>(
        ["admin-pending-properties"],
        (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.filter((p) => p.id !== propertyId),
          };
        },
      );
      return { previous };
    },
    onError: (err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["admin-pending-properties"],
          context.previous,
        );
      }
      toast({
        title: "Gagal",
        description:
          err instanceof Error ? err.message : "Gagal menolak properti.",
        type: "error",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-properties"] });
      toast({
        title: "Properti ditolak",
        description: "Properti tetap nonaktif.",
        type: "info",
      });
    },
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(value);

  const monthlyChartConfig = {
    totalGMV: {
      label: "Total GMV",
      color: "hsl(var(--chart-1))",
    },
  };

  const platformChartConfig = {
    revenue: {
      label: "Pendapatan",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <BreadcrumbNav items={[{ label: "Dashboard" }]} />
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Kelola dan monitor sistem</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total User
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">{stats?.totalUsers ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Properti
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">
                {stats?.totalProperties ?? 0}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Booking Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">
                {stats?.totalBookingsToday ?? 0}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pendapatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold">
                {formatCurrency(stats?.totalRevenue ?? 0)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-6 my-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pendapatan Per Bulan</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : monthlyError ? (
              <p className="text-sm text-destructive text-center py-8">
                Gagal memuat data pendapatan bulanan.
              </p>
            ) : Array.isArray(monthlyRevenue?.chartData) &&
              monthlyRevenue.chartData.length > 0 ? (
              <ChartContainer
                config={monthlyChartConfig}
                className="h-80 w-full"
              >
                <AreaChart data={monthlyRevenue.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="totalGMV"
                    stroke="hsl(var(--chart-1))"
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Tidak ada data pendapatan.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pendapatan Per Platform</CardTitle>
          </CardHeader>
          <CardContent>
            {platformLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : platformError ? (
              <p className="text-sm text-destructive text-center py-8">
                Gagal memuat data pendapatan per platform.
              </p>
            ) : Array.isArray(platformRevenue?.chartData) &&
              platformRevenue.chartData.length > 0 ? (
              <ChartContainer
                config={platformChartConfig}
                className="h-80 w-full"
              >
                <BarChart data={platformRevenue.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platform" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="revenue"
                    fill="hsl(var(--chart-2))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Tidak ada data pendapatan per platform.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Properti Menunggu Approval</CardTitle>
          </CardHeader>
          <CardContent>
            {propertiesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : pendingProperties && pendingProperties.length > 0 ? (
              <div className="space-y-3">
                {pendingProperties.map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{property.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {property.address} • {property.ownerName}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        disabled={approveMutation.isPending}
                        onClick={() => approveMutation.mutate(property.id)}
                      >
                        <HugeiconsIcon
                          icon={CheckmarkCircle02Icon}
                          strokeWidth={2}
                          className="size-4"
                        />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={rejectMutation.isPending}
                        onClick={() => rejectMutation.mutate(property.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tidak ada properti yang menunggu approval.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Bermasalah</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : problematicBookings && problematicBookings.length > 0 ? (
              <div className="space-y-3">
                {problematicBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {booking.propertyName ?? booking.unitName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.userName ?? booking.userEmail} •{" "}
                        {booking.status}
                      </p>
                    </div>
                    <Badge variant="destructive">{booking.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tidak ada booking bermasalah.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
