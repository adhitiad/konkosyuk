import { NextRequest } from 'next/server'
import { db } from '@/db'
import { bookings, units, properties, payments, users, balanceLogs } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { validateMutationCsrf } from '@/lib/api-auth'
import { bookingRateLimit, enforceRateLimit } from '@/lib/rate-limit'
import { ok, fail, handleApiError } from '@/lib/api'
import { reviewBookingSchema } from '@/lib/zod'
import type { Role } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const csrfError = validateMutationCsrf(req)
    if (csrfError) return csrfError
    const limited = await enforceRateLimit(req, bookingRateLimit)
    if (limited) return limited
    const session = await requireSession(['owner', 'staff', 'admin'] as Role[])
    const body = reviewBookingSchema.parse(await req.json())
    const { bookingId } = await params

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1)

    if (!booking) {
      return fail('Booking not found', 404)
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, booking.propertyId))
      .limit(1)

    if (!property) {
      return fail('Property not found', 404)
    }

    if (session.user.role === 'owner' && property.ownerId !== session.user.id) {
      return fail('Forbidden', 403)
    }

    if (booking.status !== 'awaiting_owner_approval') {
      return fail('Booking is not awaiting approval', 400)
    }

    const newStatus = body.status === 'confirmed' ? 'awaiting_full_payment' : 'rejected'

    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      metadata: {
        ...booking.metadata,
        reviewNote: body.note,
        reviewedBy: session.user.id,
        reviewedAt: new Date().toISOString(),
      },
      updatedAt: new Date(),
    }

    if (body.status === 'rejected') {
      updatePayload.rejectionReason = body.note ?? null
    }

    if (body.status === 'rejected') {
      await db.transaction(async (tx) => {
        const [dpPayment] = await tx
          .select()
          .from(payments)
          .where(
            and(
              eq(payments.bookingId, bookingId),
              eq(payments.status, 'success'),
              eq(payments.purpose, 'dp')
            )
          )
          .limit(1)

        if (dpPayment) {
          const dpAmount = Number(dpPayment.amount)

          await tx
            .update(users)
            .set({
              balance: sql`${users.balance} + ${dpAmount}`,
              updatedAt: new Date(),
            })
            .where(eq(users.id, booking.userId))

          await tx.insert(balanceLogs).values({
            userId: booking.userId,
            amount: dpAmount.toFixed(2),
            type: 'refund',
            description: `Refund DP booking #${bookingId.slice(0, 8)} - ${body.note ?? 'Booking ditolak'}`,
            relatedId: bookingId,
          })
        }

        const [updated] = await tx
          .update(bookings)
          .set(updatePayload)
          .where(eq(bookings.id, booking.id))
          .returning()

        return updated
      })
    } else {
      const [updated] = await db
        .update(bookings)
        .set(updatePayload)
        .where(eq(bookings.id, booking.id))
        .returning()

      return ok(updated)
    }
  } catch (error) {
    return handleApiError(error)
  }
}
