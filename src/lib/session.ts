import { auth } from '@/lib/auth'
import type { NextRequest } from 'next/server'
import type { Role } from '@/lib/auth'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role
}

export async function verifySession(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session) {
    return { user: null as SessionUser | null }
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as Role,
    },
  }
}