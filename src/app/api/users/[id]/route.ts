import { NextRequest } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'
import { z } from 'zod'
import type { Role } from '@/lib/auth'

const updateUserSchema = z.object({
  role: z.enum(['cust', 'owner', 'staff', 'admin']).optional(),
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
    return handleApiError(error)
  }
}
