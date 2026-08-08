import { NextRequest } from 'next/server'
import { db } from '@/db'
import { notifications } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession()
    const { id } = await params

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))

    return ok({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
