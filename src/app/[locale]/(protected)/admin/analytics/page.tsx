"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, Analytics01Icon } from "@hugeicons/core-free-icons";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { toast } from "@/components/ui/toast";
import { apiClient } from "@/lib/axios";
import { withAdminAuth } from "@/lib/with-admin-auth";

interface OwnerProfit {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  totalEarning: number;
  platformFee: number;
}

interface RevenueData {
  totalGMV: number;
  platformProfit: number;
  totalPaidToOwner: number;
  ownerProfits: OwnerProfit[];
  period: {
    startDate: string;
    endDate: string;
  };
  platformFeePercent: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(value);

const chartData = {
  platformFee: {
    label: "Fee Platform",
    color: "hsl(var(--primary))",
  },
  ownerEarnings: {
    label: "Pendapatan Owner",
    color: "hsl(var(--chart-2))",
  },
};

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RevenueChart({ data }: { data: OwnerProfit[] }) {
  const chartDataFormatted = data.map((owner) => ({
    name: owner.ownerName.split(" ")[0] || owner.ownerName,
    pendapatan: Number(owner.totalEarning.toFixed(2)),
    fee: Number(owner.platformFee.toFixed(2)),
  }));

  return (
    <ChartContainer config={chartData} className="h-80 w-full">
      <BarChart data={chartDataFormatted}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey="pendapatan"
          fill="hsl(var(--chart-2))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}

export default withAdminAuth(AdminAnalyticsPage);

function AdminAnalyticsPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery<RevenueData>({
    queryKey: ["admin-analytics-revenue", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const { data } = await apiClient.get(
        `/api/admin/analytics/revenue?${params.toString()}`,
      );
      return data;
    },
    staleTime: 60000,
  });

  const { data: featuredData } = useQuery<{ total: number }>({
    queryKey: ["admin-analytics-featured-count"],
    queryFn: async () => {
      const { data } = await apiClient.get(
        "/api/admin/analytics/featured-count",
      );
      return data;
    },
    staleTime: 60000,
  });

  const handleApply = () => {
    refetch();
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="mb-4">
        <BreadcrumbNav
          items={[
            { label: "Dashboard Admin", href: "/admin" },
            { label: "Analitik & Keuntungan" },
          ]}
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="md:grid-cols-2 flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Analitik Keuntungan
            </h1>
            <p className="text-muted-foreground">
              Dashboard keuntungan platform dan owner
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
            <Button onClick={handleApply}>Terapkan</Button>
          </div>
        </div>
      </div>
      {isError && (
        <Alert variant="destructive">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            strokeWidth={2}
            className="size-4"
          />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Gagal memuat data analitik."}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total GMV
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(data?.totalGMV ?? 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Keuntungan Platform ({data?.platformFeePercent ?? 1.8}%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-teal-600">
                {formatCurrency(data?.platformProfit ?? 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Dibayarkan ke Owner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">
                {formatCurrency(data?.totalPaidToOwner ?? 0)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Owner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {data?.ownerProfits?.length ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Properti Featured
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                {featuredData?.total ?? 0}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Keuntungan Per Owner</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : data && (data.ownerProfits?.length ?? 0) > 0 ? (
            <RevenueChart data={data.ownerProfits} />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Tidak ada data keuntungan untuk periode ini.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detail Keuntungan Per Owner</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data && (data.ownerProfits?.length ?? 0) > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Nama Owner</TableHead>
                    <TableHead scope="col">Email</TableHead>
                    <TableHead scope="col">Total Transaksi Sukses</TableHead>
                    <TableHead scope="col">Fee Platform </TableHead>
                    <TableHead scope="col">Pendapatan Bersih Owner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.ownerProfits.map((owner) => (
                    <TableRow key={owner.ownerId}>
                      <TableCell className="font-medium">
                        {owner.ownerName}
                      </TableCell>
                      <TableCell>{owner.ownerEmail}</TableCell>
                      <TableCell>
                        {formatCurrency(owner.totalEarning + owner.platformFee)}
                      </TableCell>
                      <TableCell className="text-red-600">
                        -{formatCurrency(owner.platformFee)}
                      </TableCell>
                      <TableCell className="font-semibold text-teal-600">
                        {formatCurrency(owner.totalEarning)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Tidak ada data keuntungan untuk periode ini.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
