import { Metadata } from "next";
import { requireSession } from "@/lib/auth";
import {
  getUsage,
  getUsageHistory,
  COST_THRESHOLDS,
  UsageService,
} from "@/lib/usage-tracker";
import AdminCostsClient from "./costs-client";

export const metadata: Metadata = {
  title: "Admin - Monitoring Biaya",
};

interface UsageData {
  service: UsageService;
  current: number;
  threshold: number;
  percentage: number;
  history: { month: string; count: number }[];
}

async function getCostData(): Promise<{
  success: boolean;
  data: UsageData[];
  generatedAt: string;
}> {
  await requireSession(["admin"]);

  const services: UsageService[] = ["qstash", "ably", "redis"];
  const data: UsageData[] = [];

  for (const service of services) {
    const current = await getUsage(service);
    const threshold = COST_THRESHOLDS[service];
    const percentage = threshold > 0 ? Math.round((current / threshold) * 100) : 0;
    const history = await getUsageHistory(service, 6);

    data.push({
      service,
      current,
      threshold,
      percentage: Math.min(percentage, 100),
      history: history.map((h) => ({ month: h.month, count: h.count })),
    });
  }

  return {
    success: true,
    data,
    generatedAt: new Date().toISOString(),
  };
}

export default async function AdminCostsPage() {
  const initialData = await getCostData();

  return <AdminCostsClient initialData={initialData} />;
}
