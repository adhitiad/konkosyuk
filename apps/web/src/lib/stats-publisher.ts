/**
 * Publisher statistik notifikasi ke Ably dengan batching.
 *
 * Setiap update dikumpulkan ke buffer, lalu dipublish secara
 * batch setiap 10 detik ke channel `admin:stats` dengan event `stats-update`.
 */

import { trackUsage } from "@/lib/usage-tracker";
import type { StatUpdate, StatsPayload } from "@/types/analytics";

const buffer = new Map<string, StatUpdate>();
let intervalId: ReturnType<typeof setInterval> | null = null;

export function bufferStatUpdate(channel: string, status: string, count: number): void {
  const key = `${channel}:${status}`;
  const existing = buffer.get(key);
  if (existing) {
    existing.count += count;
  } else {
    buffer.set(key, { channel, status, count });
  }
}

async function flushBuffer(): Promise<void> {
  if (buffer.size === 0) {
    return;
  }

  const updates: StatUpdate[] = [];
  for (const value of buffer.values()) {
    updates.push(value);
  }
  buffer.clear();

  const payload: StatsPayload = {
    timestamp: new Date().toISOString(),
    updates,
  };

  try {
    const { getAblyRest } = await import("@/lib/ably/server");
    const ably = await getAblyRest();
    await ably.channels.get("admin:stats").publish("stats-update", payload);
    void trackUsage("ably", "publish");
  } catch (error) {
    console.error("[stats-publisher] Gagal publish update statistik", error);
  }
}

export function startStatsPublisher(): void {
  if (intervalId) {
    return;
  }

  intervalId = setInterval(() => {
    flushBuffer().catch((error) => {
      console.error("[stats-publisher] Flush error", error);
    });
  }, 10000);
}

export function stopStatsPublisher(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

if (process.env.NODE_ENV !== "test") {
  startStatsPublisher();
}
