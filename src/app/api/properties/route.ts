import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { properties, units } from '@/db/schema'
import { eq, and, or, sql, desc, gte, lte } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'
import { createPropertySchema, updatePropertySchema, propertyQuerySchema } from '@/lib/zod'
import type { Role } from '@/lib/auth'
import { calculateDistance } from '@/lib/geolocation'
import { logError } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const rawParams = Object.fromEntries(req.nextUrl.searchParams)
    const query = propertyQuerySchema.parse(rawParams)
    const { page, limit, ownerId, type, city, search, lat, lng, radius, amenities, minPrice, maxPrice } = query

    let isOwner = false
    let effectiveOwnerId = ownerId

    try {
      const session = await requireSession()
      isOwner = session.user.role === 'owner'
      effectiveOwnerId = isOwner ? session.user.id : ownerId
    } catch {
    }

    const conditions = []
    if (effectiveOwnerId) {
      conditions.push(eq(properties.ownerId, effectiveOwnerId))
    }
    if (type) {
      conditions.push(eq(properties.type, type))
    }
    if (city) {
      conditions.push(eq(properties.city, city))
    }
    if (search) {
      const searchTerm = search.replace(/'/g, "''")
      const searchCondition = sql`
        to_tsvector('indonesian', ${properties.name} || ' ' || ${properties.address} || ' ' || COALESCE(${properties.description}, ''))
        @@ websearch_to_tsquery('indonesian', ${searchTerm})
      `
      conditions.push(searchCondition)
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const offset = (page - 1) * limit

    let data: any[] = []
    let count = 0

    try {
      const [rows, [{ count: totalCount }]] = await Promise.all([
        db.select().from(properties).where(where).orderBy(desc(properties.createdAt)).limit(limit).offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(properties).where(where),
      ])

      data = rows
      count = Number(totalCount)
    } catch (dbError) {
      logError(dbError, 'GET /api/properties - DB_QUERY', { query, ownerId: effectiveOwnerId })
      return fail('Gagal memuat data properti dari database.', 500)
    }

    if (lat !== undefined && lng !== undefined && radius !== undefined) {
      data = data
        .map((property) => {
          if (!property.latitude || !property.longitude) return null
          const distance = calculateDistance(lat, lng, Number(property.latitude), Number(property.longitude))
          return { ...property, distance }
        })
        .filter((p): p is NonNullable<typeof p> => p !== null && p.distance <= radius)
        .sort((a, b) => a.distance - b.distance)
    }

    if (amenities && amenities.length > 0) {
      data = data.filter((property) => {
        const propertyAmenities = Array.isArray(property.amenities) ? property.amenities : []
        return amenities.every((amenity: string) => propertyAmenities.includes(amenity))
      })
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      data = data.filter((property) => {
        const packages = property.packages as { predefined?: { finalPrice?: number }[] } | null
        const prices = packages?.predefined?.map((p) => p.finalPrice).filter((p): p is number => typeof p === 'number') ?? []
        if (prices.length === 0) return false
        
        const min = Math.min(...prices)
        const max = Math.max(...prices)
        
        if (minPrice !== undefined && max < Number(minPrice)) return false
        if (maxPrice !== undefined && min > Number(maxPrice)) return false
        
        return true
      })
    }

    return ok({
      data,
      meta: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    })
  } catch (error) {
    logError(error, 'GET /api/properties')
    return handleApiError(error, 'GET /api/properties')
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(['owner', 'staff', 'admin'] as Role[])
    const body = createPropertySchema.parse(await req.json())

    const [property] = await db
      .insert(properties)
      .values({
        ...body,
        ownerId: session.user.id,
      })
      .returning()

    return ok(property, 201)
  } catch (error) {
    logError(error, 'POST /api/properties')
    return handleApiError(error, 'POST /api/properties')
  }
}