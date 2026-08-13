import { NextRequest } from 'next/server'
import { db } from '@/db'
import { notifications } from '@/db/schema'
import { and, eq, desc } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession()

    const data = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(50)

    return ok({ data, meta: { total: data.length } })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession()
    const body = await req.json()
    const { notificationId } = body

    if (notificationId) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, session.user.id)))
    }

    return ok({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
