import { NextRequest } from 'next/server'
import { db } from '@/db'
import { payments, bookings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateAdminOnlyRequest } from '@/lib/api-auth'
import { ok, fail, handleApiError } from '@/lib/api'
import { z } from 'zod'
import type { Role } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit-log'

const cancelPaymentSchema = z.object({
  reason: z.string().min(1),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await validateAdminOnlyRequest(req)
    if (authResult instanceof Response) return authResult
    const { session, ipAddress, userAgent } = authResult
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

    const terminalStatuses = ['refunded', 'cancelled', 'success'] as const
    if (terminalStatuses.includes(payment.status as typeof terminalStatuses[number])) {
      return fail('Payment is already in a terminal state', 400)
    }

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, payment.bookingId))
      .limit(1)

    const terminalBookingStatuses = ['completed', 'cancelled', 'rejected'] as const
    if (booking && terminalBookingStatuses.includes(booking.status as typeof terminalBookingStatuses[number])) {
      return fail(`Cannot modify payment for booking in ${booking.status} state`, 400)
    }

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

    await createAuditLog({
      action: 'refund',
      targetType: 'payment',
      targetId: paymentId,
      adminId: session.user.id,
      details: {
        bookingId: payment.bookingId,
        amount: payment.amount,
        reason: body.reason,
        previousStatus: payment.status,
      },
    })

    return ok({ success: true })
  } catch (error) {
    return handleApiError(error, 'PATCH /api/admin/payments/[id]')
  }
}
