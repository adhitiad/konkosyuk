/**
 * Volume-based usage tracker untuk monitoring biaya.
 *
 * Melacak jumlah operasi per layanan per bulan menggunakan Redis.
 * Key format: usage:{service}:{YYYY-MM}
 *
 * Layanan yang dilacak:
 * - qstash: jumlah pesan yang dipublikasikan
 * - ably: jumlah pesan yang dipublikasikan
 * - redis: jumlah perintah Redis yang dieksekusi
 *
 * TTL key: 40 hari agar data bulan lalu masih bisa dilihat
 * sebelum terhapus secara otomatis.
 *
 * Non-blocking: kegagalan tracking tidak mempengaruhi flow utama.
 */

import type {
  UsageService,
  UsageAction,
  UsageMetric,
} from "@/types/analytics";

export type { UsageService, UsageAction, UsageMetric };

function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function buildUsageKey(service: UsageService, month: string): string {
  return `usage:${service}:${month}`;
}

export const COST_THRESHOLDS: Record<UsageService, number> = {
  qstash: Number(process.env.COST_THRESHOLD_QSTASH || "100000"),
  ably: Number(process.env.COST_THRESHOLD_ABLY || "500000"),
  redis: Number(process.env.COST_THRESHOLD_REDIS || "100000"),
};

export async function trackUsage(
  service: UsageService,
  action: UsageAction,
  count = 1,
): Promise<void> {
  const month = getCurrentMonth();
  const key = buildUsageKey(service, month);

  try {
    const { getRedis } = await import("@/lib/redis");
    const redis = await getRedis();

    await redis.incrby(key, count);
    await redis.expire(key, 40 * 24 * 60 * 60);
  } catch (error) {
    console.error("[usage-tracker] Gagal mencatat penggunaan", {
      service,
      action,
      count,
      error,
    });
  }
}

export async function getUsage(
  service: UsageService,
  month?: string,
): Promise<number> {
  const targetMonth = month || getCurrentMonth();
  const key = buildUsageKey(service, targetMonth);

  try {
    const redis = await import("@/lib/redis").then((mod) => mod.getRedis());
    const value = await (await redis).get(key);
    return value ? Number(value) : 0;
  } catch (error) {
    console.error("[usage-tracker] Gagal membaca penggunaan", {
      service,
      month: targetMonth,
      error,
    });
    return 0;
  }
}

export async function getUsageHistory(
  service: UsageService,
  monthsBack = 6,
): Promise<UsageMetric[]> {
  const results: UsageMetric[] = [];
  const now = new Date();

  for (let i = 0; i < monthsBack; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const count = await getUsage(service, month);

    results.push({
      service,
      action: "publish",
      count,
      month,
    });
  }

  return results;
}

export async function getAllUsageCurrentMonth(): Promise<Record<UsageService, number>> {
  const month = getCurrentMonth();
  const services: UsageService[] = ["qstash", "ably", "redis"];

  const results = await Promise.all(
    services.map(async (service) => {
      const count = await getUsage(service, month);
      return { service, count };
    }),
  );

  return results.reduce((acc, { service, count }) => {
    acc[service] = count;
    return acc;
  }, {} as Record<UsageService, number>);
}
