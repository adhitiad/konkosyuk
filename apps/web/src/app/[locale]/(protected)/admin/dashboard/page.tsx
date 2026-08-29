import { Metadata } from "next";
import AdminDashboardClient from "./dashboard-client";

export const metadata: Metadata = {
  title: "Admin Dashboard - Notifikasi",
};

async function getInitialStats() {
  const res = await fetch(`/api/admin/stats?hours=24`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return {
      period: "24h",
      generatedAt: new Date().toISOString(),
      data: {},
      trend: [],
    };
  }

  return (await res.json()) as {
    period: string;
    generatedAt: string;
    data: Record<string, { success: number; failed: number; rate_limited: number; dlq: number; total: number }>;
    trend: Array<{
      timestamp: string;
      email: number;
      telegram: number;
      whatsapp: number;
    }>;
  };
}

export default async function AdminDashboardPage() {
  const initialData = await getInitialStats();

  return <AdminDashboardClient initialData={initialData} />;
}
