/**
 * Statistik notifikasi per channel dan status.
 *
 * Key format: stats:{channel}:{status}:{YYYY-MM-DD-HH}
 * Status: success | failed | rate_limited | dlq
 *
 * Contoh: stats:whatsapp:success:2026-08-28-10
 *
 * TTL otomatis 48 jam agar key lama terhapus.
 *
 * Non-blocking: operasi Redis dijalankan dengan Promise.allSettled
 * agar kegagalan tracking tidak mempengaruhi flow utama.
 */
import { getRedis, getRedisProvider, getSharedRedisConnection } from "@/lib/redis";
import { bufferStatUpdate } from "@/lib/stats-publisher";

const STATS_TTL = 48 * 60 * 60;

export type ChannelStatus = "success" | "failed" | "rate_limited" | "dlq";

function getTimeBucket(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  return `${year}-${month}-${day}-${hour}`;
}

export async function trackStat(channel: string, status: ChannelStatus): Promise<void> {
  const bucket = getTimeBucket();
  const key = `stats:${channel}:${status}:${bucket}`;

  const redis = await getRedis();
  const provider = getRedisProvider();

  if (provider === "ioredis") {
    const client = getSharedRedisConnection();
    client.incr(key).then(() => client.expire(key, STATS_TTL)).catch(() => {});
    bufferStatUpdate(channel, status, 1);
    return;
  }

  redis.incr(key, STATS_TTL).catch(() => {});
  bufferStatUpdate(channel, status, 1);
}

export function getHourBuckets(hours: number): string[] {
  const buckets: string[] = [];
  const now = new Date();
  for (let i = hours - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60 * 60 * 1000);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hour = String(d.getHours()).padStart(2, "0");
    buckets.push(`${year}-${month}-${day}-${hour}`);
  }
  return buckets;
}

export function parseStatsKey(key: string): { channel: string; status: ChannelStatus; bucket: string } | null {
  const parts = key.split(":");
  if (parts.length !== 4 || parts[0] !== "stats") return null;
  const [_, channel, status, bucket] = parts;
  if (!channel || !status || !bucket) return null;
  if (!["success", "failed", "rate_limited", "dlq"].includes(status)) return null;
  return { channel, status: status as ChannelStatus, bucket };
}
