import { NextRequest } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq, and, ne } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'
import { z } from 'zod'
import type { Role } from '@/lib/auth'

const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  role: z.enum(['cust', 'owner', 'admin', 'staff']).optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(['admin', 'staff'] as Role[])
    const { id: userId } = await params
    const body = updateUserSchema.parse(await req.json())

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!existing) {
      return fail('User not found', 404)
    }

    if (existing.id === session.user.id && body.role && body.role !== existing.role) {
      return fail('You cannot change your own role', 400)
    }

    const [updated] = await db
      .update(users)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning()

    return ok(updated)
  } catch (error) {
    return handleApiError(error, 'PATCH /api/admin/users/[id]')
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(['admin'] as Role[])
    const { id: userId } = await params

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!existing) {
      return fail('User not found', 404)
    }

    if (existing.id === session.user.id) {
      return fail('You cannot delete your own account', 400)
    }

    await db.delete(users).where(eq(users.id, userId))

    return ok({ success: true })
  } catch (error) {
    return handleApiError(error, 'DELETE /api/admin/users/[id]')
  }
}
