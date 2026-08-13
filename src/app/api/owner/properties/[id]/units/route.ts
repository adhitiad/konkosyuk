import { NextRequest } from 'next/server'
import { db } from '@/db'
import { units, properties } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { validateMutationCsrf } from '@/lib/api-auth'
import { ok, fail, handleApiError } from '@/lib/api'
import { z } from 'zod'
import type { Role } from '@/lib/auth'

const createUnitBodySchema = z.object({
  name: z.string().min(1).max(255),
  price: z.coerce.number().nonnegative(),
  status: z.enum(['available', 'booked', 'maintenance']).optional(),
  description: z.string().optional(),
})

const updateUnitStatusBodySchema = z.object({
  unitId: z.string().uuid(),
  status: z.enum(['available', 'booked', 'maintenance']),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(['owner', 'admin'] as Role[])
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

    const data = await db
      .select()
      .from(units)
      .where(eq(units.propertyId, propertyId))
      .orderBy(units.name)

    return ok({ data })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const csrfError = validateMutationCsrf(req)
    if (csrfError) return csrfError
    const session = await requireSession(['owner'] as Role[])
    const { id: propertyId } = await params
    const body = createUnitBodySchema.parse(await req.json())

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1)

    if (!property) {
      return fail('Property not found', 404)
    }

    if (property.ownerId !== session.user.id) {
      return fail('Forbidden', 403)
    }

    const [existing] = await db
      .select()
      .from(units)
      .where(and(eq(units.propertyId, propertyId), eq(units.name, body.name)))
      .limit(1)

    if (existing) {
      return fail('Unit name already exists in this property', 409)
    }

    const [unit] = await db
      .insert(units)
      .values({
        propertyId,
        name: body.name,
        description: body.description,
        price: body.price.toFixed(2),
        status: body.status ?? 'available',
      })
      .returning()

    return ok(unit, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const csrfError = validateMutationCsrf(req)
    if (csrfError) return csrfError
    const session = await requireSession(['owner'] as Role[])
    const { id: propertyId } = await params
    const body = updateUnitStatusBodySchema.parse(await req.json())

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1)

    if (!property) {
      return fail('Property not found', 404)
    }

    if (property.ownerId !== session.user.id) {
      return fail('Forbidden', 403)
    }

    const [unit] = await db
      .select()
      .from(units)
      .where(and(eq(units.id, body.unitId), eq(units.propertyId, propertyId)))
      .limit(1)

    if (!unit) {
      return fail('Unit not found', 404)
    }

    const [updated] = await db
      .update(units)
      .set({
        status: body.status,
        updatedAt: new Date(),
      })
      .where(eq(units.id, body.unitId))
      .returning()

    return ok(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
