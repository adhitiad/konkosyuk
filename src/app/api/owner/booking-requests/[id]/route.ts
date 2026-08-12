import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { bookingRequests, units, properties, bookings, payments, users, notifications } from '@/db/schema'
import { eq, and, desc, or } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'
import { z } from 'zod'
import type { Role } from '@/lib/auth'
import { money, generateInvoiceNumber } from '@/lib/utils'
import { calculateDp } from '@/lib/payments/calculations'
import { sendApprovalEmail } from '@/lib/notifications/email'
import { sendApprovalWhatsApp } from '@/lib/notifications/whatsapp'
import { eventEmitter } from '@/lib/notifications/event-emitter'
import { parseIcalUrl } from '@/lib/ical/ical-parser'

const reviewBookingRequestSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  agreedPrice: z.coerce.number().positive().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(['owner'] as Role[])
    const body = reviewBookingRequestSchema.parse(await req.json())
    const { id: requestId } = await params

    const [request] = await db
      .select()
      .from(bookingRequests)
      .where(eq(bookingRequests.id, requestId))
      .limit(1)

    if (!request) {
      return fail('Booking request not found', 404)
    }

    if (request.status !== 'pending') {
      return fail('Booking request has already been processed', 400)
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, request.propertyId))
      .limit(1)

    if (!property) {
      return fail('Property not found', 404)
    }

    if (property.ownerId !== session.user.id) {
      return fail('Forbidden', 403)
    }

    if (body.status === 'rejected') {
      const [unit] = await db
        .select()
        .from(units)
        .where(eq(units.id, request.unitId))
        .limit(1)

      const [updated] = await db
        .update(bookingRequests)
        .set({ status: 'rejected', updatedAt: new Date() })
        .where(eq(bookingRequests.id, requestId))
        .returning()

      const notificationId = crypto.randomUUID()
      await db.insert(notifications).values({
        id: notificationId,
        userId: request.tenantId,
        title: 'Permintaan Sewa Ditolak',
        message: `Permintaan sewa Anda untuk ${unit?.name ?? 'unit'} di ${property.name} telah ditolak oleh pemilik.`,
        type: 'booking_rejected',
        isRead: false,
      })

      eventEmitter.emit('notification', {
        userId: request.tenantId,
        id: notificationId,
        title: 'Permintaan Sewa Ditolak',
        message: `Permintaan sewa Anda untuk ${unit?.name ?? 'unit'} di ${property.name} telah ditolak oleh pemilik.`,
        type: 'booking_rejected',
        isRead: false,
        createdAt: new Date().toISOString(),
      })

      return ok(updated)
    }

    if (body.status === 'approved') {
      if (!body.agreedPrice || body.agreedPrice <= 0) {
        return fail('Agreed price is required for approval', 400)
      }

      const [unit] = await db
        .select()
        .from(units)
        .where(eq(units.id, request.unitId))
        .limit(1)

      if (!unit) {
        return fail('Unit not found', 404)
      }

      const overlapping = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.unitId, request.unitId),
            eq(bookings.status, 'confirmed'),
          ),
        )
        .limit(1)

      if (overlapping.length > 0) {
        return fail('Unit is already booked', 400)
      }

      if (property.icalImportUrl) {
        try {
          const externalDates = await parseIcalUrl(property.icalImportUrl)
          const requestStart = new Date(request.startDate)
          const requestEnd = new Date(request.startDate)
          requestEnd.setMonth(requestEnd.getMonth() + 1)

          const hasConflict = externalDates.some((date) => {
            const d = new Date(date)
            return d >= requestStart && d <= requestEnd
          })

          if (hasConflict) {
            return fail('Tanggal yang diminta bentrok dengan booking di sumber eksternal (iCal import)', 400)
          }
        } catch (icalError) {
          console.error('Failed to validate iCal import:', icalError)
        }
      }

      const [tenant] = await db
        .select({ name: users.name, email: users.email, phone: users.phone })
        .from(users)
        .where(eq(users.id, request.tenantId))
        .limit(1)

      const dpAmount = Math.round(body.agreedPrice * 0.35)

      const [updatedRequest] = await db
        .update(bookingRequests)
        .set({
          status: 'approved',
          agreedPrice: money(body.agreedPrice),
          updatedAt: new Date(),
        })
        .where(eq(bookingRequests.id, requestId))
        .returning()

      const bookingId = crypto.randomUUID()
      const endDate = new Date(request.startDate)
      endDate.setMonth(endDate.getMonth() + 1)

      const [booking] = await db
        .insert(bookings)
        .values({
          id: bookingId,
          userId: request.tenantId,
          propertyId: request.propertyId,
          unitId: request.unitId,
          bookingType: 'request',
          status: 'pending_dp',
          startDate: request.startDate,
          endDate,
          metadata: {
            totalPrice: body.agreedPrice,
            dpAmount,
            remainingAmount: body.agreedPrice - dpAmount,
          },
        })
        .returning()

      const invoiceNumber = generateInvoiceNumber('DP')
      const invoiceUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/mock-checkout/${invoiceNumber}`

      const [payment] = await db
        .insert(payments)
        .values({
          ...( { bookingId: booking.id } as any ),
          provider: 'mock',
          purpose: 'dp',
          amount: money(dpAmount),
          currency: 'IDR',
          status: 'pending',
          transactionId: invoiceNumber,
        })
        .returning()

      Promise.allSettled([
        tenant?.email
          ? sendApprovalEmail(tenant.email, tenant.name || 'Tenant', property.name, unit.name, dpAmount, invoiceUrl)
          : Promise.resolve(),
        tenant?.phone
          ? sendApprovalWhatsApp(tenant.phone, tenant.name || 'Tenant', property.name, dpAmount, invoiceUrl)
          : Promise.resolve(),
      ]).catch((notificationError) => {
        console.error('Notification error:', notificationError)
      })

      const notificationId = crypto.randomUUID()
      await db.insert(notifications).values({
        id: notificationId,
        userId: request.tenantId,
        title: 'Permintaan Sewa Disetujui',
        message: `Permintaan sewa Anda untuk ${unit.name} di ${property.name} telah disetujui. Silakan bayar DP Rp ${dpAmount.toLocaleString('id-ID')}`,
        type: 'booking_approved',
        isRead: false,
        createdAt: new Date(),
      })

      eventEmitter.emit('notification', {
        userId: request.tenantId,
        id: notificationId,
        title: 'Permintaan Sewa Disetujui',
        message: `Permintaan sewa Anda untuk ${unit.name} di ${property.name} telah disetujui. Silakan bayar DP Rp ${dpAmount.toLocaleString('id-ID')}`,
        type: 'booking_approved',
        isRead: false,
        createdAt: new Date().toISOString(),
      })

      return ok({
        request: updatedRequest,
        booking,
        payment,
        invoiceNumber,
      })
    }

    return fail('Invalid status', 400)
  } catch (error) {
    return handleApiError(error)
  }
}
