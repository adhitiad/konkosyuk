import { NextRequest } from 'next/server'
import { db } from '@/db'
import { payments, bookings, units } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'
import { z } from 'zod'
import type { Role } from '@/lib/auth'

const reconcileSchema = z.object({
  transactionId: z.string().optional(),
  reason: z.string().min(1),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(['admin', 'staff'] as Role[])
    const { id: paymentId } = await params
    const body = reconcileSchema.parse(await req.json())

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1)

    if (!payment) {
      return fail('Payment not found', 404)
    }

    if (payment.status === 'success') {
      return fail('Payment is already success', 400)
    }

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, payment.bookingId))
      .limit(1)

    if (!booking) {
      return fail('Booking not found', 404)
    }

    const now = new Date()
    const updatedMetadata = {
      ...payment.metadata,
      reconciledBy: session.user.id,
      reconciledAt: now.toISOString(),
      reconcileReason: body.reason,
      manualReconcile: true,
    }

    await db
      .update(payments)
      .set({
        status: 'success',
        paidAt: now,
        transactionId: body.transactionId ?? payment.transactionId,
        metadata: updatedMetadata,
        updatedAt: now,
      })
      .where(eq(payments.id, paymentId))

    if (payment.purpose === 'dp') {
      const nextStatus =
        booking.bookingType === 'request'
          ? 'awaiting_owner_approval'
          : 'awaiting_full_payment'

      await db
        .update(bookings)
        .set({
          status: nextStatus,
          updatedAt: now,
        })
        .where(eq(bookings.id, booking.id))
    }

    if (payment.purpose === 'full_payment') {
      await db.transaction(async (tx) => {
        await tx
          .update(bookings)
          .set({
            status: 'confirmed',
            updatedAt: now,
          })
          .where(eq(bookings.id, booking.id))

        await tx
          .update(units)
          .set({
            status: 'booked',
            updatedAt: now,
          })
          .where(eq(units.id, booking.unitId))
      })
    }

    return ok({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
