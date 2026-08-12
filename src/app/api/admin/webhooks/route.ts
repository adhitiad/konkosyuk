import { NextRequest } from 'next/server'
import { db } from '@/db'
import { webhookEvents } from '@/db/schema'
import { eq, desc, sql, and } from 'drizzle-orm'
import { validateAdminRequest, validateAdminOnlyRequest } from '@/lib/api-auth'
import { ok, fail, handleApiError } from '@/lib/api'
import type { Role } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit-log'

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateAdminRequest(req)
    if (authResult instanceof Response) return authResult
    const { session } = authResult
    const { searchParams } = new URL(req.url)
    const provider = searchParams.get('provider')
    const status = searchParams.get('status')

    const conditions = []
    if (provider) {
      conditions.push(eq(webhookEvents.provider, provider))
    }
    if (status === 'processed') {
      conditions.push(sql`${webhookEvents.processedAt} IS NOT NULL`)
    } else if (status === 'pending') {
      conditions.push(sql`${webhookEvents.processedAt} IS NULL`)
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const data = await db
      .select()
      .from(webhookEvents)
      .where(where)
      .orderBy(desc(webhookEvents.createdAt))
      .limit(100)

    return ok({ data, meta: { total: data.length } })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await validateAdminOnlyRequest(req)
    if (authResult instanceof Response) return authResult
    const { session, ipAddress, userAgent } = authResult
    const body = await req.json()
    const webhookId = body.id as string

    if (!webhookId) {
      return fail('Webhook ID is required', 400)
    }

    const [webhook] = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.id, webhookId))
      .limit(1)

    if (!webhook) {
      return fail('Webhook not found', 404)
    }

    if (webhook.processedAt) {
      return fail('Webhook has already been processed', 400)
    }

    await db
      .update(webhookEvents)
      .set({
        processedAt: new Date(),
        signatureValid: true,
      })
      .where(eq(webhookEvents.id, webhookId))

    await createAuditLog({
      action: 'update',
      targetType: 'webhook',
      targetId: webhookId,
      adminId: session.user.id,
      details: {
        provider: webhook.provider,
        eventId: webhook.eventId,
        action: 'reprocess',
      },
    })

    return ok({ success: true })
  } catch (error) {
    return handleApiError(error, 'PATCH /api/admin/webhooks')
  }
}
