import { NextRequest, NextResponse } from 'next/server'

const csrfTokenKey = 'x-csrf-token'
const csrfCookieName = 'csrf_token'

function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
}

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

export async function csrfMiddleware(req: NextRequest) {
  const method = req.method.toLowerCase()
  const safeMethods = ['get', 'head', 'options']

  if (safeMethods.includes(method)) {
    const token = getCsrfToken(req)
    if (!token) {
      const newToken = generateToken()
      const response = NextResponse.next()
      response.cookies.set(csrfCookieName, newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      })
      return response
    }
    return NextResponse.next()
  }

  const validation = validateCsrfToken(req)
  if (!validation.success) {
    return validation.error as NextResponse
  }

  return NextResponse.next()
}
