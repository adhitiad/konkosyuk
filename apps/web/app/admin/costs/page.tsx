import { Metadata } from "next";
import AdminCostsClient from "./costs-client";

export const metadata: Metadata = {
  title: "Admin - Monitoring Biaya",
};

interface CostData {
  success: boolean;
  data: Array<{
    service: string;
    current: number;
    threshold: number;
    percentage: number;
    history: { month: string; count: number }[];
  }>;
  generatedAt: string;
}

async function getCostData(): Promise<CostData> {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/admin/costs?monthsBack=6`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return {
      success: true,
      data: [],
      generatedAt: new Date().toISOString(),
    };
  }

  return (await res.json()) as CostData;
}

export default async function AdminCostsPage() {
  const initialData = await getCostData();

  return <AdminCostsClient initialData={initialData} />;
}
