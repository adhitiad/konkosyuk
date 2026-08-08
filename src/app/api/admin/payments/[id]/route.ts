import { NextRequest } from 'next/server'
import { db } from '@/db'
import { payments, bookings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'
import { z } from 'zod'
import type { Role } from '@/lib/auth'

const cancelPaymentSchema = z.object({
  reason: z.string().min(1),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(['admin', 'staff'] as Role[])
    const { id: paymentId } = await params
    const body = cancelPaymentSchema.parse(await req.json())

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1)

    if (!payment) {
      return fail('Payment not found', 404)
    }

    const status = payment.status as string
    if (status === 'refunded' || status === 'cancelled') {
      return fail('Payment is already cancelled/refunded', 400)
    }

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, payment.bookingId))
      .limit(1)

    const updatedMetadata = {
      ...payment.metadata,
      cancelledBy: session.user.id,
      cancelledAt: new Date().toISOString(),
      cancelReason: body.reason,
    }

    await db
      .update(payments)
      .set({
        status: 'refunded',
        metadata: updatedMetadata,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId))

    if (booking && (payment.purpose === 'dp' || payment.purpose === 'full_payment')) {
      await db
        .update(bookings)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, booking.id))
    }

    return ok({ success: true })
  } catch (error) {
    return handleApiError(error, 'PATCH /api/admin/payments/[id]')
  }
}
