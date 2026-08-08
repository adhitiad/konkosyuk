import { NextRequest } from 'next/server'
import { db } from '@/db'
import { properties } from '@/db/schema'
import { eq, count, and } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'
import type { Role } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    await requireSession(['admin', 'staff'] as Role[])
    const { searchParams } = new URL(req.url)
    const ownerId = searchParams.get('ownerId')

    const [result] = await db
      .select({ total: count() })
      .from(properties)
      .where(ownerId ? and(eq(properties.isFeatured, true), eq(properties.ownerId, ownerId)) : eq(properties.isFeatured, true))

    return ok({ total: result?.total ?? 0 })
  } catch (error) {
    return handleApiError(error, 'GET /api/admin/analytics/featured-count')
  }
}
