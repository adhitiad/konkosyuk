import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { properties, units, bookings } from '@/db/schema'
import { eq, and, or, sql, desc, gte, lte } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'
import { createPropertySchema, updatePropertySchema, propertyQuerySchema } from '@/lib/zod'
import type { Role } from '@/lib/auth'
import { calculateDistance } from '@/lib/geolocation'
import { jitterCoordinates } from '@/lib/utils/location'
import { logError } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const rawParams = Object.fromEntries(req.nextUrl.searchParams)
    const query = propertyQuerySchema.parse(rawParams)
    const { page, limit, ownerId, type, city, search, lat, lng, radiusKm, radius, amenities, minPrice, maxPrice } = query

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
      const searchCondition = sql`
        to_tsvector('indonesian', ${properties.name} || ' ' || ${properties.address} || ' ' || COALESCE(${properties.description}, ''))
        @@ websearch_to_tsquery('indonesian', ${search})
      `
      conditions.push(searchCondition)
    }

    let orderBy = sql`${properties.gpsVerified} DESC, ${properties.createdAt} DESC`

    if (lat !== undefined && lng !== undefined && radiusKm !== undefined) {
      const distanceExpr = sql<number>`
        6371 * acos(
          cos(radians(${lat})) * cos(radians(${properties.latitude})) *
          cos(radians(${properties.longitude}) - radians(${lng})) +
          sin(radians(${lat})) * sin(radians(${properties.latitude}))
        )
      `
      conditions.push(eq(properties.isActive, true))
      conditions.push(eq(properties.gpsVerified, true))
      conditions.push(sql`${properties.latitude} IS NOT NULL AND ${properties.longitude} IS NOT NULL`)
      conditions.push(sql`${distanceExpr} <= ${radiusKm}`)
      orderBy = sql`${distanceExpr} ASC`
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const offset = (page - 1) * limit

    let data: any[] = []
    let count = 0

    try {
      const [rows, [{ count: totalCount }]] = await Promise.all([
        db.select().from(properties).where(where).orderBy(orderBy).limit(limit).offset(offset),
        db.select({ count: sql<number>`count(*)` }).from(properties).where(where),
      ])

      data = rows
      count = Number(totalCount)
    } catch (dbError) {
      logError(dbError, 'GET /api/properties - DB_QUERY', { query, ownerId: effectiveOwnerId })
      return fail('Gagal memuat data properti dari database.', 500)
    }

    if (lat !== undefined && lng !== undefined && radiusKm !== undefined) {
      data = data.map((property) => {
        const distance = calculateDistance(lat, lng, Number(property.latitude), Number(property.longitude))
        return { ...property, distance }
      })
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

  let viewerId: string | null = null
  try {
    const viewerSession = await requireSession()
    viewerId = viewerSession.user.id
  } catch {
  }

  if (viewerId && data.length > 0) {
    const propertyIds = data.map((p) => p.id)
    const qualifyingBookings = await db
      .select({ propertyId: bookings.propertyId })
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, viewerId),
          or(
            eq(bookings.status, 'confirmed'),
            eq(bookings.status, 'awaiting_full_payment'),
          ),
          sql`${bookings.propertyId} IN ${propertyIds}`,
        ),
      )

    const unlockedPropertyIds = new Set(qualifyingBookings.map((b) => b.propertyId))

    data = data.map((property) => {
      if (unlockedPropertyIds.has(property.id)) {
        return property
      }

      const maskedAddress =
        property.city && property.province
          ? `Lokasi Perkiraan di ${property.city}, ${property.province}`
          : 'Lokasi Perkiraan'

      const maskedLatLng =
        property.latitude && property.longitude
          ? jitterCoordinates(Number(property.latitude), Number(property.longitude))
          : null

      return {
        ...property,
        address: maskedAddress,
        latitude: maskedLatLng?.lat ?? property.latitude,
        longitude: maskedLatLng?.lng ?? property.longitude,
      }
    })
  } else if (!viewerId && data.length > 0) {
    data = data.map((property) => {
      const maskedAddress =
        property.city && property.province
          ? `Lokasi Perkiraan di ${property.city}, ${property.province}`
          : 'Lokasi Perkiraan'

      const maskedLatLng =
        property.latitude && property.longitude
          ? jitterCoordinates(Number(property.latitude), Number(property.longitude))
          : null

      return {
        ...property,
        address: maskedAddress,
        latitude: maskedLatLng?.lat ?? property.latitude,
        longitude: maskedLatLng?.lng ?? property.longitude,
      }
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

    if (session.user.role === 'owner') {
      if (session.user.kycStatus !== 'verified') {
        return fail('Verifikasi KTP Anda terlebih dahulu.', 403)
      }

      if (!session.user.phone) {
        return fail('Nomor HP/WA wajib diisi di profil.', 400)
      }

      if (!session.user.name || session.user.name.trim().length < 2) {
        return fail('Nama profil tidak sesuai dengan data KYC terverifikasi.', 400)
      }
    }

    const [property] = await db
      .insert(properties)
      .values({
        name: body.title,
        description: body.description,
        address: body.address,
        province: body.province,
        city: body.city,
        type: body.type,
        basePrice: body.basePrice,
        packages: body.packages,
        status: body.status,
        amenities: body.amenities,
        images: body.images,
        metadata: body.metadata,
        ownerId: session.user.id,
        latitude: body.latitude !== undefined ? String(body.latitude) : undefined,
        longitude: body.longitude !== undefined ? String(body.longitude) : undefined,
      })
      .returning()

    return ok(property, 201)
  } catch (error) {
    logError(error, 'POST /api/properties')
    return handleApiError(error, 'POST /api/properties')
  }
}