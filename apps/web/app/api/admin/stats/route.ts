import { NextRequest, NextResponse } from "next/server";
import { getSharedRedisConnection } from "@/lib/redis";
import { logError } from "@/lib/logger";
import { requireSession } from "@/lib/auth";
import { getHourBuckets, parseStatsKey } from "@/lib/stats";

export interface TrendData {
  timestamp: string;
  email: number;
  telegram: number;
  whatsapp: number;
}

export async function GET(request: NextRequest) {
  try {
    await requireSession(["admin"]);

    const url = new URL(request.url);
    const hours = Math.min(
      Math.max(Number(url.searchParams.get("hours") || "24"), 1),
      168,
    );

    const client = getSharedRedisConnection();
    const buckets = getHourBuckets(hours);
    const patterns = buckets.map((bucket) => `stats:*:*:${bucket}`);

    const allKeys: string[] = [];
    for (const pattern of patterns) {
      const keys = await client.keys(pattern);
      allKeys.push(...keys);
    }

    const values = allKeys.length > 0 ? await client.mget(...allKeys) : [];

    const aggregated: Record<string, Record<string, number>> = {};
    const channelTimeline: Record<string, TrendBucket[]> = {};

    for (let i = 0; i < allKeys.length; i++) {
      const key = allKeys[i];
      const rawValue = values[i];
      const count = rawValue ? Number(rawValue) : 0;

      const parsed = parseStatsKey(key);
      if (!parsed) continue;

      if (!aggregated[parsed.channel]) {
        aggregated[parsed.channel] = {
          success: 0,
          failed: 0,
          rate_limited: 0,
          dlq: 0,
          total: 0,
        };
      }

      const channelStats = aggregated[parsed.channel];
      if (parsed.status in channelStats) {
        channelStats[parsed.status as keyof typeof channelStats] = count;
      }

      if (!channelTimeline[parsed.channel]) {
        channelTimeline[parsed.channel] = [];
      }
      channelTimeline[parsed.channel].push({
        timestamp: parsed.bucket,
        status: parsed.status,
        count,
      });
    }

    for (const channel of Object.keys(aggregated)) {
      const stats = aggregated[channel];
      stats.total = stats.success + stats.failed + stats.rate_limited + stats.dlq;
    }

    const trendData = buildTrendData(buckets, channelTimeline);

    return NextResponse.json({
      period: `${hours}h`,
      generatedAt: new Date().toISOString(),
      data: aggregated,
      trend: trendData,
    });
  } catch (error) {
    logError(error, "Admin stats error");
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

interface TrendBucket {
  timestamp: string;
  status: string;
  count: number;
}

function buildTrendData(
  buckets: string[],
  channelTimeline: Record<string, TrendBucket[]>,
): TrendData[] {
  const channelNames = Object.keys(channelTimeline);
  const channelMap = new Map<string, TrendBucket[]>();
  for (const channel of channelNames) {
    channelMap.set(channel, channelTimeline[channel] || []);
  }

  return buckets.map((bucket) => {
    const item: TrendData = {
      timestamp: bucket,
      email: 0,
      telegram: 0,
      whatsapp: 0,
    };

    for (const [channel, entries] of channelMap) {
      const entry = entries.find((e) => e.timestamp === bucket);
      if (entry && entry.status === "success") {
        const channelKey = channel as keyof Omit<TrendData, "timestamp">;
        if (channelKey in item) {
          item[channelKey] = entry.count;
        }
      }
    }

    return item;
  });
}