"use client";

import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type OccupancyData = {
  date: string;
  rate: number;
};

function getRateColor(rate: number): string {
  if (rate >= 70) return "hsl(var(--chart-2))";
  if (rate >= 50) return "hsl(var(--chart-4))";
  return "hsl(var(--chart-1))";
}

export function OccupancyChart({
  data,
  loading,
}: {
  data: OccupancyData[];
  loading: boolean;
}) {
  if (loading) {
    return <div className="h-80 w-full animate-pulse rounded-lg bg-muted" />;
  }

  if (!data.length) {
    return (
      <div className="flex h-80 items-center justify-center text-muted-foreground">
        Belum ada data okupansi
      </div>
    );
  }

  const chartData = data.map((item) => ({
    date: item.date,
    rate: item.rate,
    fill: getRateColor(item.rate),
  }));

  return (
    <ChartContainer
      config={{
        rate: { label: "Okupansi", color: "hsl(var(--chart-2))" },
      }}
      className="h-80 w-full"
    >
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(value: number) => `${value}%`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => {
                if (name === "Okupansi") {
                  return [`${value}%`, "Okupansi"];
                }
                return [value, name];
              }}
            />
          }
        />
        <ReferenceLine
          y={80}
          stroke="hsl(var(--chart-3))"
          strokeDasharray="4 4"
        />
        <Line
          type="monotone"
          dataKey="rate"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
