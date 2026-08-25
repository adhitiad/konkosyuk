"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { withAdminAuth } from "@/lib/with-admin-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RevenueData {
  totalRevenue: number;
  totalPaid: number;
  totalPending: number;
  conversionRate: string;
  byTier: Record<string, { revenue: number; count: number }>;
  byPackage: Array<{
    packageId: string;
    label: string;
    tier: string;
    revenue: number;
    count: number;
  }>;
  recentTransactions: Array<{
    adId: string;
    title: string;
    advertiserName: string;
    price: string;
    paidAt: string | null;
    paymentStatus: string;
  }>;
}

function AdRevenuePage() {
  const [period, setPeriod] = useState("month");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-ad-revenue", period],
    queryFn: async () => {
      const res = await fetch(`/api/admin/ad-revenue?period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch revenue");
      const json = await res.json();
      return json.data as RevenueData;
    },
    staleTime: 60000,
  });

  const formatRupiah = (value: number) => {
    return `Rp ${value.toLocaleString("id-ID")}`;
  };

  const chartData =
    data?.byTier &&
    Object.entries(data.byTier).map(([tier, stats]) => ({
      tier: tier.charAt(0).toUpperCase() + tier.slice(1),
      revenue: stats.revenue,
      count: stats.count,
    }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pendapatan Iklan</h1>
          <p className="mt-2 text-muted-foreground">
            Statistik pendapatan dari iklan berbayar.
          </p>
        </div>
        <Select value={period} onValueChange={(v) => v && setPeriod(v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Periode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hari Ini</SelectItem>
            <SelectItem value="week">Minggu Ini</SelectItem>
            <SelectItem value="month">Bulan Ini</SelectItem>
            <SelectItem value="quarter">Kuartal</SelectItem>
            <SelectItem value="year">Tahun Ini</SelectItem>
            <SelectItem value="all">Semua</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pendapatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : formatRupiah(data?.totalRevenue || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Iklan Lunas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalPaid || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Menunggu Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalPending || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Konversi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.conversionRate || "0"}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Tier</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="tier" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground">Belum ada data.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Package</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : data?.byPackage && data.byPackage.length > 0 ? (
              <div className="space-y-3">
                {data.byPackage.map((pkg) => (
                  <div
                    key={pkg.packageId}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">{pkg.label}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {pkg.tier}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatRupiah(pkg.revenue)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pkg.count} iklan
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Belum ada data.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 rounded-lg border">
        <div className="p-4">
          <h3 className="font-semibold">Transaksi Terbaru</h3>
        </div>
        {isLoading ? (
          <p className="p-4 text-muted-foreground">Loading...</p>
        ) : data?.recentTransactions && data.recentTransactions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Iklan</TableHead>
                <TableHead>Advertiser</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal Bayar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentTransactions.map((tx) => (
                <TableRow key={tx.adId}>
                  <TableCell className="font-medium">{tx.title}</TableCell>
                  <TableCell>{tx.advertiserName}</TableCell>
                  <TableCell>{formatRupiah(Number(tx.price))}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tx.paymentStatus === "paid" ? "default" : "secondary"
                      }
                    >
                      {tx.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {tx.paidAt
                      ? new Date(tx.paidAt).toLocaleDateString("id-ID")
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="p-4 text-muted-foreground">Belum ada transaksi.</p>
        )}
      </div>
    </div>
  );
}

export default withAdminAuth(AdRevenuePage);
