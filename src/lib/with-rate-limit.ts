import { NextResponse } from 'next/server'
import { authRateLimit, bookingRateLimit, generalRateLimit } from '@/lib/rate-limit'

export function withRateLimit(
  handler: (req: Request) => Promise<NextResponse>,
  options: { type?: 'auth' | 'booking' | 'general' } = {}
) {
  return async (req: Request): Promise<NextResponse> => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    let result
    switch (options.type) {
      case 'auth':
        result = authRateLimit({ ip })
        break
      case 'booking':
        result = bookingRateLimit({ ip })
        break
      default:
        result = generalRateLimit({ ip })
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((result.resetAt.getTime() - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    return handler(req)
  }
}
