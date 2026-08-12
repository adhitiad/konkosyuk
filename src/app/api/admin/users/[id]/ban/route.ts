import { NextRequest } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateAdminOnlyRequest } from '@/lib/api-auth'
import { ok, fail, handleApiError } from '@/lib/api'
import { z } from 'zod'
import { createAuditLog } from '@/lib/audit-log'

const banUserSchema = z.object({
  isBanned: z.boolean(),
  banReason: z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await validateAdminOnlyRequest(req)
    if (authResult instanceof Response) return authResult
    const { session, ipAddress, userAgent } = authResult
    const { id: userId } = await params
    const body = banUserSchema.parse(await req.json())

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!existing) {
      return fail('User not found', 404)
    }

    if (existing.id === session.user.id) {
      return fail('You cannot ban your own account', 400)
    }

    const [updated] = await db
      .update(users)
      .set({
        isBanned: body.isBanned,
        banReason: body.isBanned ? body.banReason ?? null : null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning()

    await createAuditLog({
      action: body.isBanned ? 'reject' : 'approve',
      targetType: 'user',
      targetId: userId,
      adminId: session.user.id,
      details: {
        userId,
        userEmail: existing.email,
        isBanned: body.isBanned,
        banReason: body.banReason ?? null,
      },
    })

    return ok(updated)
  } catch (error) {
    return handleApiError(error, 'PATCH /api/admin/users/[id]/ban')
  }
}
