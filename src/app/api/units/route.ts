import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { units, properties } from '@/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'
import { createUnitSchema, unitQuerySchema } from '@/lib/zod'
import type { Role } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const query = unitQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams))
    const { page, limit, propertyId, status } = query

    const conditions = []
    if (propertyId) {
      conditions.push(eq(units.propertyId, propertyId))
    }
    if (status) {
      conditions.push(eq(units.status, status))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const offset = (page - 1) * limit

    const [data, [{ count }]] = await Promise.all([
      db.select().from(units).where(where).orderBy(desc(units.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(units).where(where),
    ])

    return ok({
      data,
      meta: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(['owner', 'staff', 'admin'] as Role[])
    const body = createUnitSchema.parse(await req.json())

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, body.propertyId))
      .limit(1)

    if (!property) {
      return fail('Property not found', 404)
    }

    if (session.user.role === 'owner' && property.ownerId !== session.user.id) {
      return fail('Forbidden', 403)
    }

    const [existing] = await db
      .select()
      .from(units)
      .where(and(eq(units.propertyId, body.propertyId), eq(units.name, body.name)))
      .limit(1)

    if (existing) {
      return fail('Unit name already exists in this property', 409)
    }

    const [unit] = await db.insert(units).values(body).returning()

    return ok(unit, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
