import { NextRequest } from 'next/server'
import { db } from '@/db'
import { properties } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'
import { z } from 'zod'
import type { Role } from '@/lib/auth'

const approvePropertySchema = z.object({
  isActive: z.boolean(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(['admin', 'staff'] as Role[])
    const { id: propertyId } = await params
    const body = approvePropertySchema.parse(await req.json())

    const [existing] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1)

    if (!existing) {
      return fail('Property not found', 404)
    }

    const [updated] = await db
      .update(properties)
      .set({
        isActive: body.isActive,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, propertyId))
      .returning()

    return ok(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
