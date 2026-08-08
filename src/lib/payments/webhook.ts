import { db } from '@/db'
import { payments, bookings, units, properties, webhookEvents } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getPaymentProvider } from './index'
import type { WebhookContext, NormalizedWebhook } from './types'

export async function handleWebhookRequest(providerName: string, ctx: WebhookContext) {
  const adapter = getPaymentProvider(providerName)
  if (!adapter) {
    return new Response('Unknown provider', { status: 400 })
  }

  const isValid = await adapter.verifyWebhookSignature(ctx)
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 })
  }

  let normalized: NormalizedWebhook
  try {
    normalized = await adapter.normalizeWebhook(ctx)
  } catch (error) {
    return new Response('Invalid webhook payload', { status: 400 })
  }

  const [event] = await db
    .insert(webhookEvents)
    .values({
      provider: normalized.provider,
      eventId: normalized.eventId,
      payload: Object.fromEntries(ctx.headers.entries()),
    })
    .onConflictDoNothing({
      target: [webhookEvents.provider, webhookEvents.eventId],
    })
    .returning()

  if (!event) {
    return new Response('Event already processed', { status: 200 })
  }

  const newStatus = normalized.status === 'success' ? 'success' : normalized.status === 'failed' ? 'failed' : normalized.status === 'expired' ? 'expired' : 'pending'

  await db.transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.transactionId, normalized.transactionId))
      .for('update')
      .limit(1)

    if (!payment) {
      return new Response('Payment not found', { status: 404 })
    }

    if (payment.status === 'success') {
      await tx
        .update(webhookEvents)
        .set({ processedAt: new Date() })
        .where(eq(webhookEvents.id, event.id))

      return new Response('Already processed', { status: 200 })
    }

    await tx
      .update(payments)
      .set({
        status: newStatus,
        paidAt: normalized.paidAt,
        rawResponse: normalized.metadata,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id))

    if (newStatus === 'success') {
      if (payment.purpose === 'featured_listing' && payment.propertyId) {
        const featuredUntil = new Date()
        featuredUntil.setDate(featuredUntil.getDate() + 30)

        await tx
          .update(properties)
          .set({
            isFeatured: true,
            featuredUntil,
            updatedAt: new Date(),
          })
          .where(eq(properties.id, payment.propertyId))
      } else if (payment.purpose === 'full_payment') {
        const [booking] = await tx
          .select()
          .from(bookings)
          .where(eq(bookings.id, payment.bookingId))
          .for('update')
          .limit(1)

        if (!booking) return

        await tx
          .update(bookings)
          .set({ status: 'confirmed', updatedAt: new Date() })
          .where(eq(bookings.id, booking.id))

        await tx
          .update(units)
          .set({ status: 'booked', updatedAt: new Date() })
          .where(eq(units.id, booking.unitId))
      } else if (payment.purpose === 'dp') {
        const [booking] = await tx
          .select()
          .from(bookings)
          .where(eq(bookings.id, payment.bookingId))
          .for('update')
          .limit(1)

        if (!booking) return

        const nextStatus =
          booking.bookingType === 'request'
            ? 'awaiting_owner_approval'
            : 'awaiting_full_payment'

        await tx
          .update(bookings)
          .set({ status: nextStatus, updatedAt: new Date() })
          .where(eq(bookings.id, booking.id))
      }
    }

    if (newStatus === 'failed' || newStatus === 'expired') {
      if (payment.purpose !== 'featured_listing') {
        const [booking] = await tx
          .select()
          .from(bookings)
          .where(eq(bookings.id, payment.bookingId))
          .for('update')
          .limit(1)

        if (booking) {
          await tx
            .update(bookings)
            .set({ status: 'cancelled', updatedAt: new Date() })
            .where(eq(bookings.id, booking.id))
        }
      }
    }

    await tx
      .update(webhookEvents)
      .set({ processedAt: new Date() })
      .where(eq(webhookEvents.id, event.id))
  })

  return new Response('Webhook processed', { status: 200 })
}
