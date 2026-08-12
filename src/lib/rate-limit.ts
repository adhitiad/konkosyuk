export interface RateLimitOptions {
  windowMs: number;
  max: number;
  key?: string;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
}

export interface RateLimitDeviceInput {
  deviceId?: string
  deviceName?: string
}

import { getRedis } from '@/lib/redis'

export function rateLimit(
  options: RateLimitOptions,
): (req: RateLimitDeviceInput) => Promise<RateLimitResult> {
  const { windowMs, max, key = "global" } = options

  return async (req: RateLimitDeviceInput) => {
    const deviceId = req.deviceId || key
    const deviceName = req.deviceName || ''
    const clientKey = `${key}:${deviceId}:${deviceName}`
    const redis = await getRedis()
    const ttlSeconds = Math.ceil(windowMs / 1000)
    const count = await redis.incr(`ratelimit:${clientKey}`, ttlSeconds)
    const resetAt = new Date(Date.now() + ttlSeconds * 1000)
    return {
      success: count <= max,
      remaining: Math.max(0, max - count),
      resetAt,
    }
  }
}

export const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  key: "auth",
})

export const bookingRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  key: "booking",
})

export const generalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  key: "general",
})

export const adminRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  key: "admin",
})
