import { NextRequest } from 'next/server'
import { db } from '@/db'
import { properties, payments, platformSettings } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { validateMutationCsrf } from '@/lib/api-auth'
import { ok, fail, handleApiError } from '@/lib/api'
import { getPaymentProvider, isPaymentProviderName } from '@/lib/payments'
import { generateInvoiceNumber, money } from '@/lib/utils'
import type { Role } from '@/lib/auth'
import type { PaymentProviderName } from '@/lib/payments/types'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const csrfError = validateMutationCsrf(req)
    if (csrfError) return csrfError
    const session = await requireSession(['owner', 'admin'] as Role[])
    const { id: propertyId } = await params
    const body = await req.json()

    const providerName = body?.paymentProvider as string | undefined
    if (!providerName || !isPaymentProviderName(providerName)) {
      return fail('paymentProvider is required', 400)
    }

    const adapter = getPaymentProvider(providerName)
    if (!adapter) {
      return fail('Invalid payment provider', 400)
    }

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

    const [settings] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.id, 'default'))
      .limit(1)

    const amount = parseFloat(settings?.featuredListingPrice || '50000')
    if (amount <= 0) {
      return fail('Featured listing price is not configured', 500)
    }

    const invoiceNumber = generateInvoiceNumber('FEATURED')

    const [payment] = await db
      .insert(payments)
      .values({
        ...( { bookingId: '00000000-0000-0000-0000-000000000000' } as any ),
        propertyId: property.id,
        provider: providerName as PaymentProviderName,
        purpose: 'featured_listing',
        amount: money(amount),
        currency: 'IDR',
        status: 'pending',
        transactionId: invoiceNumber,
        metadata: {
          propertyId: property.id,
          ownerId: property.ownerId,
        },
      } as any)
      .returning()

    try {
      const result = await adapter.createPayment({
        bookingId: property.id,
        provider: providerName as PaymentProviderName,
        purpose: 'featured_listing',
        amount,
        currency: 'IDR',
        metadata: {
          invoiceNumber,
          propertyId: property.id,
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
    return handleApiError(error, 'POST /api/properties/[id]/checkout-featured')
  }
}
