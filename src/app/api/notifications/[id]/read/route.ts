import { NextRequest } from 'next/server'
import { db } from '@/db'
import { notifications } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { validateMutationCsrf } from '@/lib/api-auth'
import { ok, fail, handleApiError } from '@/lib/api'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const csrfError = validateMutationCsrf(req)
    if (csrfError) return csrfError
    const session = await requireSession()
    const { id } = await params

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)))

    return ok({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
