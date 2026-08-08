import { NextRequest } from 'next/server'
import { db } from '@/db'
import { properties, payments, bookings } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'
import type { Role } from '@/lib/auth'

const FEATURED_DURATION_DAYS = 30

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(['owner', 'admin', 'staff'] as Role[])
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

    const [existingPayment] = await db
      .select({
        id: payments.id,
        status: payments.status,
        paidAt: payments.paidAt,
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(
        and(
          eq(bookings.propertyId, propertyId),
          eq(payments.purpose, 'featured_listing'),
          eq(payments.status, 'success'),
        ),
      )
      .orderBy(desc(payments.paidAt))
      .limit(1)

    if (!existingPayment) {
      return fail('Payment for featured listing not found. Please complete the featured listing payment first.', 402)
    }

    const featuredUntil = new Date()
    featuredUntil.setDate(featuredUntil.getDate() + FEATURED_DURATION_DAYS)

    const [updated] = await db
      .update(properties)
      .set({
        isFeatured: true,
        featuredUntil,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, propertyId))
      .returning()

    return ok(updated)
  } catch (error) {
    return handleApiError(error, 'POST /api/properties/[id]/feature')
  }
}
