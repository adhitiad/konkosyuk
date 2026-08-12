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

const rateLimitStore = new Map<string, { count: number; resetAt: Date }>()

export function rateLimit(
  options: RateLimitOptions,
): (req: RateLimitDeviceInput) => RateLimitResult {
  const { windowMs, max, key = "global" } = options

  return (req: RateLimitDeviceInput) => {
    const now = new Date()
    const deviceId = req.deviceId || key
    const deviceName = req.deviceName || ''
    const clientKey = `${key}:${deviceId}:${deviceName}`

    const record = rateLimitStore.get(clientKey)

    if (record && now < record.resetAt) {
      if (record.count >= max) {
        return {
          success: false,
          remaining: 0,
          resetAt: record.resetAt,
        }
      }
      record.count++
      return {
        success: true,
        remaining: max - record.count,
        resetAt: record.resetAt,
      }
    }

    rateLimitStore.set(clientKey, {
      count: 1,
      resetAt: new Date(now.getTime() + windowMs),
    })

    return {
      success: true,
      remaining: max - 1,
      resetAt: new Date(now.getTime() + windowMs),
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
