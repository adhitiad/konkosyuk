import { NextRequest } from 'next/server'
import { db } from '@/db'
import { properties } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'
import { updatePropertySchema } from '@/lib/zod'
import type { Role } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession()
    const { id: propertyId } = await params

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1)

    if (!property) {
      return fail('Property not found', 404)
    }

    if (session.user.role !== 'admin' && property.ownerId !== session.user.id) {
      return fail('Forbidden', 403)
    }

    return ok(property)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(['owner', 'staff', 'admin'] as Role[])
    const { id: propertyId } = await params
    const body = updatePropertySchema.parse(await req.json())

    const [existing] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1)

    if (!existing) {
      return fail('Property not found', 404)
    }

    if (session.user.role !== 'admin' && existing.ownerId !== session.user.id) {
      return fail('Forbidden', 403)
    }

    const [updated] = await db
      .update(properties)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, propertyId))
      .returning()

    return ok(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(['owner', 'staff', 'admin'] as Role[])
    const { id: propertyId } = await params

    const [existing] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1)

    if (!existing) {
      return fail('Property not found', 404)
    }

    if (session.user.role !== 'admin' && existing.ownerId !== session.user.id) {
      return fail('Forbidden', 403)
    }

    await db.delete(properties).where(eq(properties.id, propertyId))

    return ok({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
