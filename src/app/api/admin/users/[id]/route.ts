import { NextRequest } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq, and, ne } from 'drizzle-orm'
import { validateAdminRequest, validateAdminOnlyRequest } from '@/lib/api-auth'
import { ok, fail, handleApiError } from '@/lib/api'
import { z } from 'zod'
import type { Role } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit-log'

const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  role: z.enum(['cust', 'owner', 'admin', 'staff']).optional(),
  isActive: z.boolean().optional(),
  image: z.string().nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await validateAdminRequest(req)
    if (authResult instanceof Response) return authResult
    const { session, ipAddress, userAgent } = authResult
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

    const allowedFields = ['name', 'email', 'phone', 'isActive', 'image'] as const
    const updateData: Record<string, unknown> = {}

    for (const key of allowedFields) {
      const value = body[key as keyof typeof body]
      if (value !== undefined) {
        updateData[key] = value
      }
    }

    if (session.user.role !== 'admin') {
      if (updateData.role !== undefined || updateData.isActive !== undefined) {
        return fail('Forbidden - only admin can change role or active status', 403)
      }

      if (existing.role === 'admin') {
        return fail('Forbidden - cannot modify admin users', 403)
      }
    }

    const [updated] = await db
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning()

    if (updateData.role || updateData.isActive) {
      await createAuditLog({
        action: updateData.role ? 'approve' : 'update',
        targetType: 'user',
        targetId: userId,
        adminId: session.user.id,
        details: {
          changes: updateData,
          targetUserId: userId,
        },
      })
    }

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
    const authResult = await validateAdminOnlyRequest(req)
    if (authResult instanceof Response) return authResult
    const { session, ipAddress, userAgent } = authResult
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

    await createAuditLog({
      action: 'delete',
      targetType: 'user',
      targetId: userId,
      adminId: session.user.id,
      details: {
        deletedUserEmail: existing.email,
        deletedUserRole: existing.role,
      },
    })

    return ok({ success: true })
  } catch (error) {
    return handleApiError(error, 'DELETE /api/admin/users/[id]')
  }
}
