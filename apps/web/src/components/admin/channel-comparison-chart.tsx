"use client";

import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

export interface ChannelComparisonData {
  channel: string;
  success: number;
  failed: number;
  rate_limited: number;
  dlq: number;
}

interface ChannelComparisonChartProps {
  data: ChannelComparisonData[];
}

const chartConfig = {
  success: {
    label: "Berhasil",
    color: "#10b981",
  },
  failed: {
    label: "Gagal",
    color: "#ef4444",
  },
  rate_limited: {
    label: "Rate Limited",
    color: "#f59e0b",
  },
  dlq: {
    label: "DLQ",
    color: "#6b7280",
  },
};

export default function ChannelComparisonChart({
  data,
}: ChannelComparisonChartProps) {
  return (
    <div className="w-full rounded-lg bg-white p-6 shadow-md">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">
        Perbandingan Status per Channel
      </h3>
      <ChartContainer config={chartConfig} className="h-80 w-full">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="channel" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="success"
            fill="var(--color-success)"
            radius={[4, 4, 0, 0]}
            name="Berhasil"
          />
          <Bar
            dataKey="failed"
            fill="var(--color-failed)"
            radius={[4, 4, 0, 0]}
            name="Gagal"
          />
          <Bar
            dataKey="rate_limited"
            fill="var(--color-rate_limited)"
            radius={[4, 4, 0, 0]}
            name="Rate Limited"
          />
          <Bar
            dataKey="dlq"
            fill="var(--color-dlq)"
            radius={[4, 4, 0, 0]}
            name="DLQ"
          />
        </BarChart>
      </ChartContainer>
    </div>
  );
}