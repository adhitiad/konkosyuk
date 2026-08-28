import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  getUsage,
  getUsageHistory,
  UsageService,
} from "@/lib/usage-tracker";

const COST_THRESHOLDS: Record<UsageService, number> = {
  qstash: Number(process.env.COST_THRESHOLD_QSTASH || "100000"),
  ably: Number(process.env.COST_THRESHOLD_ABLY || "500000"),
  redis: Number(process.env.COST_THRESHOLD_REDIS || "100000"),
};

interface UsageData {
  service: UsageService;
  current: number;
  threshold: number;
  percentage: number;
  history: { month: string; count: number }[];
}

export async function GET(request: NextRequest) {
  try {
    await requireSession(["admin"]);

    const url = new URL(request.url);
    const monthsBack = Math.min(
      Math.max(Number(url.searchParams.get("monthsBack") || "6"), 1),
      12,
    );

    const services: UsageService[] = ["qstash", "ably", "redis"];
    const data: UsageData[] = [];

    for (const service of services) {
      const current = await getUsage(service);
      const threshold = COST_THRESHOLDS[service];
      const percentage = threshold > 0 ? Math.round((current / threshold) * 100) : 0;
      const history = await getUsageHistory(service, monthsBack);

      data.push({
        service,
        current,
        threshold,
        percentage: Math.min(percentage, 100),
        history: history.map((h) => ({ month: h.month, count: h.count })),
      });
    }

    return NextResponse.json({
      success: true,
      data,
      generatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal memuat data penggunaan" },
      { status: 500 },
    );
  }
}
