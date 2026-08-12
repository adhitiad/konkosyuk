import { NextRequest } from 'next/server'
import { and, desc, eq, inArray, lte, gte } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { bookings, maintenanceReports, notifications, properties, units, users, maintenanceReportCategory, maintenanceReportStatus } from '@/db/schema'
import { requireSession, type Role } from '@/lib/auth'
import { fail, handleApiError, ok } from '@/lib/api'
import { sendMaintenanceReportCreatedEmail } from '@/lib/notifications/email'
import { sendMaintenanceWhatsApp } from '@/lib/notifications/whatsapp'

const createReportSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().nullable().optional(),
  category: z.enum(maintenanceReportCategory),
  description: z.string().trim().min(10).max(2000),
  images: z.array(z.string().url()).max(5).default([]),
})

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession(['cust'] as Role[])
    const body = createReportSchema.parse(await req.json())
    const now = new Date()

    const [property] = await db.select({ id: properties.id, ownerId: properties.ownerId, name: properties.name })
      .from(properties).where(eq(properties.id, body.propertyId)).limit(1)
    if (!property) return fail('Properti tidak ditemukan', 404)

    const [booking] = await db.select({ id: bookings.id }).from(bookings).where(and(
      eq(bookings.userId, session.user.id), eq(bookings.propertyId, body.propertyId),
      inArray(bookings.status, ['confirmed', 'completed']), lte(bookings.startDate, now), gte(bookings.endDate, now),
    )).limit(1)
    if (!booking) return fail('Anda tidak sedang menyewa properti ini', 403)

    if (body.unitId) {
      const [unit] = await db.select({ id: units.id }).from(units).where(and(eq(units.id, body.unitId), eq(units.propertyId, body.propertyId))).limit(1)
      if (!unit) return fail('Unit tidak valid untuk properti ini', 400)
    }

    const [report] = await db.insert(maintenanceReports).values({
      tenantId: session.user.id, propertyId: body.propertyId, unitId: body.unitId ?? null,
      category: body.category, description: body.description, images: body.images,
    }).returning()

    const [owner] = await db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, whatsapp: users.whatsapp }).from(users).where(eq(users.id, property.ownerId)).limit(1)
    const admins = await db.select({ id: users.id, name: users.name, email: users.email, phone: users.phone, whatsapp: users.whatsapp }).from(users).where(eq(users.role, 'admin'))
    await db.insert(notifications).values([
      { userId: property.ownerId, title: 'Laporan Masalah Baru', message: `Ada laporan "${body.category}" di properti ${property.name}. Mohon ditindaklanjuti.`, type: 'report', referenceId: report.id },
      ...admins.map((admin) => ({ userId: admin.id, title: 'Laporan Masalah Perlu Dipantau', message: `Tenant mengirim laporan "${body.category}" di properti ${property.name}. Buka laporan untuk memantau tindak lanjut owner.`, type: 'report' as const, referenceId: report.id })),
    ])

    const recipients = [owner, ...admins].filter((recipient): recipient is NonNullable<typeof recipient> => Boolean(recipient))
    await Promise.allSettled(recipients.flatMap((recipient) => [
      recipient.email ? sendMaintenanceReportCreatedEmail(recipient.email, recipient.name, property.name, body.category, body.description) : Promise.resolve(),
      (recipient.phone || recipient.whatsapp) ? sendMaintenanceWhatsApp(recipient.phone || recipient.whatsapp || '', process.env.META_MAINTENANCE_CREATED_TEMPLATE || 'maintenance_report_created', [recipient.name, property.name, body.category, body.description]) : Promise.resolve(),
    ]))

    return ok(report, 201)
  } catch (error) {
    return handleApiError(error, 'POST /api/reports')
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(['owner', 'admin'] as Role[])
    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')
    const status = searchParams.get('status')
    const conditions = []
    if (propertyId) conditions.push(eq(maintenanceReports.propertyId, propertyId))
    if (status && maintenanceReportStatus.includes(status as typeof maintenanceReportStatus[number])) conditions.push(eq(maintenanceReports.status, status as typeof maintenanceReportStatus[number]))
    if (session.user.role === 'owner') conditions.push(eq(properties.ownerId, session.user.id))

    const data = await db.select({
      id: maintenanceReports.id, tenantId: maintenanceReports.tenantId, propertyId: maintenanceReports.propertyId,
      unitId: maintenanceReports.unitId, category: maintenanceReports.category, description: maintenanceReports.description,
      images: maintenanceReports.images, status: maintenanceReports.status, resolutionNote: maintenanceReports.resolutionNote,
      createdAt: maintenanceReports.createdAt, updatedAt: maintenanceReports.updatedAt,
      propertyName: properties.name, unitName: units.name, tenantName: users.name,
    }).from(maintenanceReports)
      .innerJoin(properties, eq(maintenanceReports.propertyId, properties.id))
      .leftJoin(units, eq(maintenanceReports.unitId, units.id))
      .leftJoin(users, eq(maintenanceReports.tenantId, users.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(maintenanceReports.createdAt))

    return ok({ data, meta: { total: data.length } })
  } catch (error) {
    return handleApiError(error, 'GET /api/reports')
  }
}
