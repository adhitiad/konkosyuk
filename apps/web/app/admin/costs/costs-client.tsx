"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const chartConfig = {
  qstash: {
    label: "QStash",
    color: "#0d9488",
  },
  ably: {
    label: "Ably",
    color: "#2563eb",
  },
  redis: {
    label: "Redis",
    color: "#f59e0b",
  },
} satisfies ChartConfig;

interface UsageData {
  service: string;
  current: number;
  threshold: number;
  percentage: number;
  history: { month: string; count: number }[];
}

interface AdminCostsClientProps {
  initialData: {
    success: boolean;
    data: UsageData[];
    generatedAt: string;
  };
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

function getStatusColor(percentage: number): string {
  if (percentage >= 100) return "bg-red-500";
  if (percentage >= 80) return "bg-yellow-500";
  return "bg-green-500";
}

function getStatusLabel(percentage: number): string {
  if (percentage >= 100) return "Kritis";
  if (percentage >= 80) return "Peringatan";
  return "Normal";
}

export default function AdminCostsClient({
  initialData,
}: AdminCostsClientProps) {
  const [data] = useState<UsageData[]>(initialData.data || []);
  const [activeTab, setActiveTab] = useState("overview");

  const qstashData = data.find((d) => d.service === "qstash");
  const ablyData = data.find((d) => d.service === "ably");
  const redisData = data.find((d) => d.service === "redis");

  const chartData = data
    .filter((d) => d.history && d.history.length > 0)
    .flatMap((item) =>
      item.history.map((h) => ({
        month: h.month,
        [item.service]: h.count,
      })),
    )
    .reduce((acc, curr) => {
      const existing = acc.find((a) => a.month === curr.month);
      if (existing) {
        Object.assign(existing, curr);
      } else {
        acc.push({ ...curr });
      }
      return acc;
    }, [] as Array<Record<string, string | number>>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Monitoring Biaya</h1>
        <p className="text-muted-foreground">
          Estimasi penggunaan layanan bulan ini vs batas threshold
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Terakhir diperbarui: {new Date(initialData.generatedAt).toLocaleString("id-ID")}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="history">Historis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[qstashData, ablyData, redisData].map((item) => {
              if (!item) return null;

              return (
                <Card key={item.service}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base capitalize">
                      {item.service}
                    </CardTitle>
                    <CardDescription>
                      {formatNumber(item.current)} / {formatNumber(item.threshold)}{" "}
                      operasi
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Penggunaan</span>
                        <span className="font-medium">{item.percentage}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div
                          className={`h-2 rounded-full ${getStatusColor(item.percentage)}`}
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Status: {getStatusLabel(item.percentage)}</span>
                        <span>
                          {formatNumber(item.current)} / {formatNumber(item.threshold)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historis Penggunaan (6 Bulan)</CardTitle>
              <CardDescription>
                Jumlah operasi per bulan untuk setiap layanan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        const [year, month] = value.split("-");
                        const date = new Date(Number(year), Number(month) - 1);
                        return date.toLocaleDateString("id-ID", {
                          month: "short",
                          year: "2-digit",
                        });
                      }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="qstash"
                      fill={chartConfig.qstash.color}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="ably"
                      fill={chartConfig.ably.color}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="redis"
                      fill={chartConfig.redis.color}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
