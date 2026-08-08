import { NextRequest } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq, or, like, sql, desc, and } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'
import type { Role } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(['admin', 'staff'] as Role[])
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const role = searchParams.get('role')

    const conditions = []
    if (search) {
      const term = `%${search}%`
      conditions.push(
        or(
          like(users.name, term),
          like(users.email, term),
        )
      )
    }
    if (role) {
      conditions.push(eq(users.role, role as any))
    }

    const where = conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined

    const data = await db
      .select()
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))

    return ok({ data, meta: { total: data.length } })
  } catch (error) {
    return handleApiError(error)
  }
}
