"use client";

import { useEffect, useState, useCallback } from "react";
import StatsCard from "@/components/admin/stats-card";
import NotificationTrendChart, {
  TrendData,
} from "@/components/admin/notification-trend-chart";
import ChannelComparisonChart, {
  ChannelComparisonData,
} from "@/components/admin/channel-comparison-chart";
import RealTimeStats, { UpdateItem } from "@/components/admin/RealTimeStats";

interface StatsResponse {
  period: string;
  generatedAt: string;
  data: Record<string, { success: number; failed: number; rate_limited: number; dlq: number; total: number }>;
  trend: TrendData[];
}

const TIME_RANGES = [
  { label: "24 Jam", value: "24" },
  { label: "7 Hari", value: "168" },
  { label: "30 Hari", value: "720" },
];

interface AdminDashboardClientProps {
  initialData: StatsResponse;
  selectedRange?: string;
}

export default function AdminDashboardClient({
  initialData,
  selectedRange = "24",
}: AdminDashboardClientProps) {
  const [stats, setStats] = useState<StatsResponse>(initialData);
  const [range, setRange] = useState(selectedRange);

  const handleRealtimeUpdate = useCallback((updates: UpdateItem[]) => {
    setStats((prev) => {
      if (!prev) return prev;

      const newData = { ...prev.data };
      const newTrend = [...prev.trend];

      for (const update of updates) {
        const channelData = newData[update.channel];
        if (channelData) {
          if (update.status in channelData) {
            (channelData as Record<string, number>)[update.status] += update.count;
          }
          channelData.total += update.count;
        }

        const nowIso = new Date().toISOString();
        const lastTrend = newTrend[newTrend.length - 1];
        if (lastTrend && lastTrend.timestamp === nowIso) {
          const updatedTrend = { ...lastTrend };
          if (update.channel === "email") {
            updatedTrend.email += update.count;
          } else if (update.channel === "telegram") {
            updatedTrend.telegram += update.count;
          } else if (update.channel === "whatsapp") {
            updatedTrend.whatsapp += update.count;
          }
          newTrend[newTrend.length - 1] = updatedTrend;
        } else {
          const newPoint: TrendData = {
            timestamp: nowIso,
            email: 0,
            telegram: 0,
            whatsapp: 0,
          };
          if (update.channel === "email") {
            newPoint.email = update.count;
          } else if (update.channel === "telegram") {
            newPoint.telegram = update.count;
          } else if (update.channel === "whatsapp") {
            newPoint.whatsapp = update.count;
          }
          newTrend.push(newPoint);
        }
      }

      while (newTrend.length > 50) {
        newTrend.shift();
      }

      return { ...prev, data: newData, trend: newTrend };
    });
  }, []);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/admin/stats?hours=${range}`);
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = (await res.json()) as StatsResponse;
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    }

    fetchStats();
  }, [range]);

  const summaryCards = stats
    ? [
        {
          title: "Total Pesan",
          value: Object.values(stats.data).reduce((sum, ch) => sum + ch.total, 0),
          icon: "📨",
        },
        {
          title: "Berhasil",
          value: Object.values(stats.data).reduce((sum, ch) => sum + ch.success, 0),
          icon: "✅",
        },
        {
          title: "Gagal",
          value: Object.values(stats.data).reduce((sum, ch) => sum + ch.failed, 0),
          icon: "❌",
        },
        {
          title: "Rate Limited",
          value: Object.values(stats.data).reduce((sum, ch) => sum + ch.rate_limited, 0),
          icon: "⚠️",
        },
        {
          title: "DLQ",
          value: Object.values(stats.data).reduce((sum, ch) => sum + ch.dlq, 0),
          icon: "🗑️",
        },
      ]
    : [];

  const comparisonData: ChannelComparisonData[] = stats
    ? Object.entries(stats.data).map(([channel, values]) => ({
        channel: channel.charAt(0).toUpperCase() + channel.slice(1),
        success: values.success,
        failed: values.failed,
        rate_limited: values.rate_limited,
        dlq: values.dlq,
      }))
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <RealTimeStats onUpdate={handleRealtimeUpdate} />

      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard Notifikasi
            </h1>
            <p className="mt-1 text-gray-600">
              Statistik pengiriman notifikasi untuk periode{" "}
              <span className="font-semibold">{range} jam terakhir</span>
            </p>
          </div>

          <div className="flex gap-2">
            {TIME_RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`rounded-lg px-4 py-2 transition-colors ${
                  range === r.value
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {summaryCards.map((card, index) => (
            <StatsCard
              key={index}
              title={card.title}
              value={card.value}
              icon={card.icon}
            />
          ))}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <NotificationTrendChart data={stats.trend} />
          <ChannelComparisonChart data={comparisonData} />
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-4 text-lg font-semibold text-gray-800">
            Detail per Channel
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-3 text-left text-sm font-semibold text-gray-700">
                    Channel
                  </th>
                  <th className="py-3 text-right text-sm font-semibold text-gray-700">
                    Berhasil
                  </th>
                  <th className="py-3 text-right text-sm font-semibold text-gray-700">
                    Gagal
                  </th>
                  <th className="py-3 text-right text-sm font-semibold text-gray-700">
                    Rate Limited
                  </th>
                  <th className="py-3 text-right text-sm font-semibold text-gray-700">
                    DLQ
                  </th>
                  <th className="py-3 text-right text-sm font-semibold text-gray-700">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.data).map(([channel, values]) => (
                  <tr key={channel} className="border-b last:border-b-0">
                    <td className="py-3 text-sm font-medium text-gray-900 capitalize">
                      {channel}
                    </td>
                    <td className="py-3 text-right text-sm text-green-600">
                      {values.success}
                    </td>
                    <td className="py-3 text-right text-sm text-red-600">
                      {values.failed}
                    </td>
                    <td className="py-3 text-right text-sm text-yellow-600">
                      {values.rate_limited}
                    </td>
                    <td className="py-3 text-right text-sm text-gray-600">
                      {values.dlq}
                    </td>
                    <td className="py-3 text-right text-sm font-semibold text-gray-900">
                      {values.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
