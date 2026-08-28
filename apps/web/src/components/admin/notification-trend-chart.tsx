"use client";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

export interface TrendData {
  timestamp: string;
  email: number;
  telegram: number;
  whatsapp: number;
}

interface NotificationTrendChartProps {
  data: TrendData[];
}

const chartConfig = {
  email: {
    label: "Email",
    color: "#2563eb",
  },
  telegram: {
    label: "Telegram",
    color: "#10b981",
  },
  whatsapp: {
    label: "WhatsApp",
    color: "#f59e0b",
  },
};

export default function NotificationTrendChart({
  data,
}: NotificationTrendChartProps) {
  return (
    <div className="w-full rounded-lg bg-white p-6 shadow-md">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">
        Tren Pengiriman Notifikasi
      </h3>
      <ChartContainer config={chartConfig} className="h-80 w-full">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getHours().toString().padStart(2, "0")}:00`;
            }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Line
            type="monotone"
            dataKey="email"
            stroke="var(--color-email)"
            strokeWidth={2}
            name="Email"
          />
          <Line
            type="monotone"
            dataKey="telegram"
            stroke="var(--color-telegram)"
            strokeWidth={2}
            name="Telegram"
          />
          <Line
            type="monotone"
            dataKey="whatsapp"
            stroke="var(--color-whatsapp)"
            strokeWidth={2}
            name="WhatsApp"
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}