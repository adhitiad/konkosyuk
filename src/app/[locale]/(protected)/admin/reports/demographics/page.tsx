"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { apiClient } from "@/lib/axios";
import { apiGet } from "@/lib/api.client";
import { withAdminAuth } from "@/lib/with-admin-auth";
import dynamic from "next/dynamic";

const IndonesiaMapVisualization = dynamic(
  () => import("@/components/admin/indonesia-map"),
  { ssr: false },
);

interface RegionItem {
  province: string;
  city: string;
  district: string;
  count: number;
}

interface DemographicsResponse {
  data: RegionItem[];
  total: number;
  filterType: string;
}

const REGION_API = "/api/proxy/wilayah";

const PIE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
  "#14b8a6",
];

export default withAdminAuth(AdminDemographicsPage);

function AdminDemographicsPage() {
  const { data: session } = useSession();
  const [filterType, setFilterType] = useState<"user" | "owner">("user");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [activeTab, setActiveTab] = useState("map");

  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [districts, setDistricts] = useState<{ id: string; name: string }[]>(
    [],
  );

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const data = await apiGet<{ id: string; name: string }[]>(
          "/api/proxy/wilayah/provinces.json",
        );
        setProvinces(data);
      } catch (err) {
        console.error("Gagal fetch provinsi", err);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (!province) {
      setCities([]);
      setCity("");
      setDistricts([]);
      setDistrict("");
      return;
    }
    const selectedProvince = provinces.find((p) => p.name === province);
    if (!selectedProvince) return;

    const fetchCities = async () => {
      try {
        const data = await apiGet<{ id: string; name: string }[]>(
          `/api/proxy/wilayah/regencies/${selectedProvince.id}.json`,
        );
        setCities(data);
      } catch (err) {
        console.error("Gagal fetch kota", err);
      }
    };
    fetchCities();
  }, [province, provinces]);

  useEffect(() => {
    if (!city) {
      setDistricts([]);
      setDistrict("");
      return;
    }
    const selectedCity = cities.find((c) => c.name === city);
    if (!selectedCity) return;

    const fetchDistricts = async () => {
      try {
        const data = await apiGet<{ id: string; name: string }[]>(
          `/api/proxy/wilayah/districts/${selectedCity.id}.json`,
        );
        setDistricts(data);
      } catch (err) {
        console.error("Gagal fetch kecamatan", err);
      }
    };
    fetchDistricts();
  }, [city, cities]);

  const { data, isLoading, isError, error, refetch } =
    useQuery<DemographicsResponse>({
      queryKey: ["admin-demographics", filterType, province, city, district],
      queryFn: async () => {
        const params = new URLSearchParams();
        params.set("filterType", filterType);
        if (province) params.set("province", province);
        if (city) params.set("city", city);
        if (district) params.set("district", district);

        const { data: json } = await apiClient.get(
          `/api/admin/reports/demographics?${params.toString()}`,
        );
        return json.data;
      },
      staleTime: 30000,
    });

  const provinceAggregation = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of data?.data || []) {
      const key = item.province;
      map.set(key, (map.get(key) || 0) + item.count);
    }
    const sorted = Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    return sorted;
  }, [data]);

  const top10Provinces = useMemo(
    () => provinceAggregation.slice(0, 10),
    [provinceAggregation],
  );
  const otherProvinces = useMemo(
    () => ({
      name: "Lainnya",
      value: provinceAggregation
        .slice(10)
        .reduce((sum, item) => sum + item.value, 0),
    }),
    [provinceAggregation],
  );

  const pieData = useMemo(() => {
    const combined =
      otherProvinces.value > 0
        ? [...top10Provinces, otherProvinces]
        : top10Provinces;
    return combined;
  }, [top10Provinces, otherProvinces]);

  const cityAggregation = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of data?.data || []) {
      if (item.city === "-") continue;
      const key = `${item.province} / ${item.city}`;
      map.set(key, (map.get(key) || 0) + item.count);
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [data]);

  const chartConfig = {
    count: {
      label: "Jumlah",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="mb-4">
        <BreadcrumbNav
          items={[
            { label: "Dashboard Admin", href: "/admin" },
            { label: "Laporan Demografi" },
          ]}
        />
        <h1 className="text-2xl font-bold tracking-tight">Laporan Demografi</h1>
        <p className="text-muted-foreground">
          Distribusi user dan owner berdasarkan wilayah
        </p>
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
              : "Gagal memuat data demografi."}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Select
              value={filterType}
              onValueChange={(v) => {
                setFilterType(v as "user" | "owner");
                setProvince("");
                setCity("");
                setDistrict("");
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Tipe Laporan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={province}
              onValueChange={(v) => {
                setProvince(v ?? "");
                setCity("");
                setDistrict("");
              }}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Semua Provinsi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Provinsi</SelectItem>
                {provinces.map((prov) => (
                  <SelectItem key={prov.id} value={prov.name}>
                    {prov.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={city}
              onValueChange={(v) => {
                setCity(v ?? "");
                setDistrict("");
              }}
              disabled={!province}
            >
              <SelectTrigger className="w-56">
                <SelectValue
                  placeholder={
                    province ? "Semua Kota/Kabupaten" : "Pilih provinsi dahulu"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Kota/Kabupaten</SelectItem>
                {cities.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={district}
              onValueChange={(v) => setDistrict(v ?? "")}
              disabled={!city || filterType === "owner"}
            >
              <SelectTrigger className="w-56">
                <SelectValue
                  placeholder={
                    filterType === "owner"
                      ? "Tidak tersedia untuk Owner"
                      : city
                        ? "Semua Kecamatan"
                        : "Pilih kota dahulu"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Kecamatan</SelectItem>
                {districts.map((d) => (
                  <SelectItem key={d.id} value={d.name}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={() => refetch()}>Terapkan Filter</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total {filterType === "user" ? "User" : "Owner"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                (data?.total ?? 0)
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Wilayah Terfilter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                (data?.data.length ?? 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="map">Peta Sebaran</TabsTrigger>
          <TabsTrigger value="stats">Statistik Detail</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Peta Sebaran {filterType === "user" ? "User" : "Owner"} di
                Indonesia
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[600px] w-full" />
              ) : (
                <IndonesiaMapVisualization
                  data={data?.data || []}
                  filterType={filterType}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribusi per Provinsi (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={({ name, percent }: any) =>
                        `${name || ""}: ${((percent ?? 0) * 100).toFixed(1)}%`
                      }
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [
                        `${value} ${filterType === "user" ? "User" : "Owner"}`,
                        "Jumlah",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Tidak ada data untuk filter ini.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 10 Kota/Kabupaten</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-80 w-full" />
              ) : cityAggregation.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-80 w-full">
                  <BarChart data={cityAggregation} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={220}
                      tick={{ fontSize: 12 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="value"
                      fill="hsl(var(--chart-1))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Tidak ada data untuk filter ini.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Detail per Wilayah</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data && data.data.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Provinsi</TableHead>
                    <TableHead scope="col">Kota/Kabupaten</TableHead>
                    {filterType === "user" && (
                      <TableHead scope="col">Kecamatan</TableHead>
                    )}
                    <TableHead scope="col" className="text-right">
                      Jumlah
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {item.province}
                      </TableCell>
                      <TableCell>{item.city}</TableCell>
                      {filterType === "user" && (
                        <TableCell>{item.district}</TableCell>
                      )}
                      <TableCell className="text-right font-semibold">
                        {item.count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Tidak ada data untuk filter ini.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
