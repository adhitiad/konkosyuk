import { NextRequest } from 'next/server'
import { db } from '@/db'
import { properties } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'
import { z } from 'zod'
import type { Role } from '@/lib/auth'

const updatePropertySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  address: z.string().min(1).max(500).optional(),
  type: z.enum(['kost', 'kontrakan']).optional(),
  city: z.string().optional(),
  basePrice: z.string().optional(),
  packages: z.any().optional(),
  status: z.enum(['aktif', 'nonaktif']).optional(),
  amenities: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession(['admin', 'staff'] as Role[])
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

    const [updated] = await db
      .update(properties)
      .set({
        name: body.name ?? existing.name,
        address: body.address ?? existing.address,
        type: body.type ?? existing.type,
        city: body.city ?? existing.city,
        basePrice: body.basePrice ?? existing.basePrice,
        packages: body.packages ?? existing.packages,
        status: body.status ?? existing.status,
        amenities: body.amenities ?? existing.amenities,
        metadata: body.metadata ?? existing.metadata,
        latitude: body.latitude ?? existing.latitude,
        longitude: body.longitude ?? existing.longitude,
        isActive: body.isActive ?? existing.isActive,
        updatedAt: new Date(),
      } as any)
      .where(eq(properties.id, propertyId))
      .returning()

    return ok(updated)
  } catch (error) {
    return handleApiError(error, 'PATCH /api/admin/properties/[id]')
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireSession(['admin'] as Role[])
    const { id: propertyId } = await params

    const [existing] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1)

    if (!existing) {
      return fail('Property not found', 404)
    }

    await db.delete(properties).where(eq(properties.id, propertyId))

    return ok({ success: true })
  } catch (error) {
    return handleApiError(error, 'DELETE /api/admin/properties/[id]')
  }
}
