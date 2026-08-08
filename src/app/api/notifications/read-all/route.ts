import { NextRequest } from 'next/server'
import { db } from '@/db'
import { notifications } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession()

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, session.user.id))

    return ok({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
