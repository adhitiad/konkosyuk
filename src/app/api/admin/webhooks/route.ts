import { NextRequest } from 'next/server'
import { db } from '@/db'
import { webhookEvents } from '@/db/schema'
import { eq, desc, sql, and } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'
import type { Role } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(['admin', 'staff'] as Role[])
    const { searchParams } = new URL(req.url)
    const provider = searchParams.get('provider')
    const status = searchParams.get('status')

    const conditions = []
    if (provider) {
      conditions.push(eq(webhookEvents.provider, provider))
    }
    if (status === 'processed') {
      conditions.push(sql`${webhookEvents.processedAt} IS NOT NULL`)
    } else if (status === 'pending') {
      conditions.push(sql`${webhookEvents.processedAt} IS NULL`)
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const data = await db
      .select()
      .from(webhookEvents)
      .where(where)
      .orderBy(desc(webhookEvents.createdAt))
      .limit(100)

    return ok({ data, meta: { total: data.length } })
  } catch (error) {
    return handleApiError(error)
  }
}
