import { NextRequest, NextResponse } from 'next/server'

const csrfTokenKey = 'x-csrf-token'
const csrfCookieName = 'csrf_token'

export function getCsrfToken(req: NextRequest): string | null {
  return req.cookies.get(csrfCookieName)?.value ?? null
}

export function validateCsrfToken(req: NextRequest): { success: boolean; error?: NextResponse } {
  const token = getCsrfToken(req)
  const headerToken = req.headers.get(csrfTokenKey)

  if (!token || !headerToken || token !== headerToken) {
    return {
      success: false,
      error: NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 }),
    }
  }

  return { success: true }
}
