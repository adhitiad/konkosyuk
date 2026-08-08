import { NextRequest } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'
import { eq, desc } from 'drizzle-orm'
import type { Role } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(['admin', 'staff'] as Role[])

    const data = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        ktpNumber: users.ktpNumber,
        ktpImageUrl: users.ktpImageUrl,
        kycStatus: users.kycStatus,
        updatedAt: users.updatedAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.kycStatus, 'pending'))
      .orderBy(desc(users.updatedAt))

    return ok({ data })
  } catch (error) {
    return handleApiError(error)
  }
}
