import { NextRequest, NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
}

export function getRateLimitHeaders(
  result: RateLimitResult,
  maxRequests: number,
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(maxRequests),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": result.resetAt.toISOString(),
  };
}

export async function rateLimit(
  config: RateLimitConfig,
  identifier: string,
): Promise<RateLimitResult> {
  const { windowMs, maxRequests, keyPrefix } = config;
  const redis = await getRedis();
  const ttlSeconds = Math.ceil(windowMs / 1000);
  const key = `${keyPrefix}:${identifier}`;

  try {
    const count = await redis.incr(key, ttlSeconds);

    return {
      success: count <= maxRequests,
      remaining: Math.max(0, maxRequests - count),
      resetAt: new Date(Date.now() + ttlSeconds * 1000),
    };
  } catch {
    return {
      success: true,
      remaining: maxRequests,
      resetAt: new Date(Date.now() + ttlSeconds * 1000),
    };
  }
}

export async function withRateLimit(
  config: RateLimitConfig,
  request: NextRequest,
  handler: (req: NextRequest) => Promise<Response>,
): Promise<Response> {
  let identifier: string;

  try {
    identifier = request.headers.get("x-user-id") || "";
    if (!identifier) {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";
      identifier = ip;
    }
  } catch {
    identifier = "unknown";
  }

  const result = await rateLimit(config, identifier);

  if (!result.success) {
    const retryAfter = Math.ceil(
      (result.resetAt.getTime() - Date.now()) / 1000,
    );

    return NextResponse.json(
      {
        error: `Terlalu banyak request. Coba lagi dalam ${retryAfter} detik.`,
      },
      {
        status: 429,
        headers: {
          ...getRateLimitHeaders(result, config.maxRequests),
          RetryAfter: String(retryAfter),
        },
      },
    );
  }

  const response = await handler(request);

  Object.entries(getRateLimitHeaders(result, config.maxRequests)).forEach(
    ([key, value]) => {
      response.headers.set(key, value);
    },
  );

  return response;
}

import { getDeviceInfoFromRequest } from "@/lib/device";
import { RateLimitResultPool } from "@/lib/perf";

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  key?: string;
}

export interface RateLimitDeviceInput {
  deviceId?: string;
  deviceName?: string;
}

export function rateLimitByDevice(
  options: RateLimitOptions,
): (req: RateLimitDeviceInput) => Promise<RateLimitResult> {
  const { windowMs, max, key = "global" } = options;

  return async (req: RateLimitDeviceInput) => {
    const deviceId = req.deviceId || key;
    const deviceName = req.deviceName || "";
    const clientKey = `${key}:${deviceId}:${deviceName}`;
    const redis = await getRedis();
    const ttlSeconds = Math.ceil(windowMs / 1000);
    const count = await redis.incr(`ratelimit:${clientKey}`, ttlSeconds);

    const pooled = RateLimitResultPool.acquire();
    pooled.success = count <= max;
    pooled.remaining = Math.max(0, max - count);
    pooled.resetAtMs = Date.now() + ttlSeconds * 1000;

    const result: RateLimitResult = {
      success: pooled.success,
      remaining: pooled.remaining,
      resetAt: new Date(pooled.resetAtMs),
    };
    RateLimitResultPool.release(pooled);

    return result;
  };
}

export const authRateLimit = rateLimitByDevice({
  windowMs: 60 * 1000,
  max: 60,
  key: "auth",
});

export const bookingRateLimit = rateLimitByDevice({
  windowMs: 60 * 1000,
  max: 10,
  key: "booking",
});

export const generalRateLimit = rateLimitByDevice({
  windowMs: 60 * 1000,
  max: 30,
  key: "general",
});

export const adminRateLimit = rateLimitByDevice({
  windowMs: 60 * 1000,
  max: 20,
  key: "admin",
});

export const webhookRateLimit = rateLimitByDevice({
  windowMs: 60 * 1000,
  max: 50,
  key: "webhook",
});

export const publicRateLimit = rateLimitByDevice({
  windowMs: 60 * 1000,
  max: 60,
  key: "public",
});

export async function enforceRateLimit(
  req: NextRequest,
  limiter: (input: RateLimitDeviceInput) => Promise<RateLimitResult>,
) {
  const result = await limiter(getDeviceInfoFromRequest(req));
  if (result.success) return null;

  return NextResponse.json(
    { success: false, error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": Math.ceil(
          (result.resetAt.getTime() - Date.now()) / 1000,
        ).toString(),
      },
    },
  );
}
