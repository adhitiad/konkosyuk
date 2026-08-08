import { NextRequest } from 'next/server'
import { db } from '@/db'
import { balanceLogs, users } from '@/db/schema'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'
import { eq, desc, and } from 'drizzle-orm'
import type { Role } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(['cust', 'owner'] as Role[])
    const { searchParams } = new URL(req.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100)
    const offset = Number(searchParams.get('offset')) || 0

    const data = await db
      .select()
      .from(balanceLogs)
      .where(eq(balanceLogs.userId, session.user.id))
      .orderBy(desc(balanceLogs.createdAt))
      .limit(limit)
      .offset(offset)

    const [user] = await db
      .select({ balance: users.balance })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    return ok({
      data,
      currentBalance: user?.balance || '0.00',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
