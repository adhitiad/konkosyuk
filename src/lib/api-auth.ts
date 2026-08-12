import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { validateCsrfToken, getCsrfToken } from '@/lib/csrf'
import { withAdminRateLimit } from '@/lib/admin-rate-limit'
import { createAuditLog } from '@/lib/audit-log'

export async function requireSession(allowedRoles?: string[]) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    throw new Error('Unauthorized')
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    throw new Error('Forbidden')
  }

  return session
}

export async function validateAdminRequest(req: NextRequest) {
  const session = await requireSession(['admin', 'staff'])

  const rateLimitResult = await withAdminRateLimit(req)
  if (rateLimitResult) return rateLimitResult

  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    const csrfResult = validateCsrfToken(req)
    if (!csrfResult.success) {
      return csrfResult.error as NextResponse
    }
  }

  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'

  return { session, ipAddress, userAgent }
}

export async function validateAdminOnlyRequest(req: NextRequest) {
  const session = await requireSession(['admin'])

  const rateLimitResult = await withAdminRateLimit(req)
  if (rateLimitResult) return rateLimitResult

  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    const csrfResult = validateCsrfToken(req)
    if (!csrfResult.success) {
      return csrfResult.error as NextResponse
    }
  }

  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'

  return { session, ipAddress, userAgent }
}
