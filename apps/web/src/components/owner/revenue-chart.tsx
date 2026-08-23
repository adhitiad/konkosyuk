"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

type RevenueData = {
  label: string;
  revenue: number;
  transactions: number;
};

function formatRupiah(value: number): string {
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
  }
  if (value >= 1_000) {
    return `Rp ${(value / 1_000).toFixed(1)}rb`;
  }
  return `Rp ${value}`;
}

export function RevenueChart({ data, loading }: { data: RevenueData[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="h-80 w-full animate-pulse rounded-lg bg-muted" />
    );
  }

  if (!data.length) {
    return (
      <div className="flex h-80 items-center justify-center text-muted-foreground">
        Belum ada data pendapatan
      </div>
    );
  }

  return (
    <ChartContainer
      config={{
        revenue: { label: "Pendapatan", color: "hsl(var(--chart-2))" },
        transactions: { label: "Transaksi", color: "hsl(var(--chart-1))" },
      }}
      className="h-80 w-full"
    >
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis
          tickFormatter={(value: number) => formatRupiah(value)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => {
                if (name === "Pendapatan") {
                  return [formatRupiah(Number(value)), "Pendapatan"];
                }
                return [value, "Transaksi"];
              }}
            />
          }
        />
        <Bar
          dataKey="revenue"
          fill="hsl(var(--chart-2))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
