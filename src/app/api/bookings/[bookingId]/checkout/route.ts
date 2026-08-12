import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { bookings, payments, users } from '@/db/schema'
import { eq, and, or, gte } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'
import { checkoutBookingSchema } from '@/lib/zod'
import { getPaymentProvider } from '@/lib/payments'
import { generateInvoiceNumber, money } from '@/lib/utils'
import { checkFraudFlags } from '@/lib/fraud-check'
import type { Role } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const { bookingId } = await params
    const session = await requireSession(['cust'] as Role[])
    const body = checkoutBookingSchema.parse(await req.json())

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1)

    if (!booking) {
      return fail('Booking not found', 404)
    }

    if (booking.userId !== session.user.id) {
      return fail('Forbidden', 403)
    }

    let purpose: 'dp' | 'full_payment'
    let amount: number

    if (booking.status === 'pending_dp') {
      purpose = 'dp'
      amount = booking.metadata?.dpAmount ? Number(booking.metadata.dpAmount) : 0
    } else if (booking.status === 'awaiting_full_payment') {
      purpose = 'full_payment'
      amount = booking.metadata?.remainingAmount ? Number(booking.metadata.remainingAmount) : 0
    } else {
      return fail('Booking is not ready for payment', 400)
    }

    if (amount <= 0) {
      return fail('Invalid payment amount', 400)
    }

    const adapter = getPaymentProvider(body.paymentProvider)
    if (!adapter) {
      return fail('Invalid payment provider', 400)
    }

    const [user] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, booking.userId))
      .limit(1)

    if (!user?.name || !user?.email) {
      return fail('Nama di profil harus sesuai dengan rekening untuk keamanan', 403)
    }

    const fraudResult = await checkFraudFlags(booking.userId, amount)
    if (fraudResult.isBlocked) {
      return fail(fraudResult.reason ?? 'Akses diblokir karena aktivitas mencurigakan', 403)
    }

    const customerIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    const invoiceNumber = generateInvoiceNumber(purpose.toUpperCase() as 'DP' | 'FULL')

    const paymentMetadata: Record<string, unknown> = {
      invoiceNumber,
      bookingCode: booking.metadata?.bookingCode,
      customerIp,
      userAgent,
    }

    if (fraudResult.requiresManualReview) {
      paymentMetadata.fraudReview = true
      paymentMetadata.fraudReason = 'amount_exceeds_10m'
    }

    const [payment] = await db
      .insert(payments)
      .values({
        ...( { bookingId: booking.id } as any ),
        provider: body.paymentProvider as any,
        purpose,
        amount: money(amount),
        currency: 'IDR',
        status: 'pending',
        transactionId: invoiceNumber,
        metadata: paymentMetadata,
      })
      .returning()

    try {
      const result = await adapter.createPayment({
        bookingId: booking.id,
        provider: body.paymentProvider,
        purpose,
        amount,
        currency: 'IDR',
        expiresIn: 21600,
        metadata: {
          invoiceNumber,
          bookingCode: booking.metadata?.bookingCode,
          customerName: user.name,
          customerEmail: user.email,
          customerIp,
          userAgent,
        },
      })

      await db
        .update(payments)
        .set({
          transactionId: result.transactionId,
          rawResponse: result.rawResponse,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id))

      return ok({
        paymentId: payment.id,
        invoiceNumber,
        redirectUrl: result.redirectUrl,
        qrCode: result.qrCode,
        vaNumber: result.vaNumber,
        expiresAt: result.expiresAt,
      })
    } catch (error) {
      await db
        .update(payments)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(eq(payments.id, payment.id))

      throw error
    }
  } catch (error) {
    return handleApiError(error)
  }
}
