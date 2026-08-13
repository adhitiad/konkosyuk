import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, webhookEvents, generalLedger } from '@/db/schema'
import { eq, desc, sql, and, gte, lt } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'
import type { Role } from '@/lib/auth'
import { getMetricsSnapshot } from '@/lib/monitoring'

export async function GET(req: NextRequest) {
  try {
    await requireSession(['admin'] as Role[])

    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [{ count: totalUsers }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)

    const [{ count: activeUsers }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(gte(users.updatedAt, last24h))

    const [{ count: failedWebhooks24h }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(webhookEvents)
      .where(
        and(
          gte(webhookEvents.createdAt, last24h),
          eq(webhookEvents.signatureValid, false),
        ),
      )

    const [{ count: totalWebhooks24h }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(webhookEvents)
      .where(gte(webhookEvents.createdAt, last24h))

    const errorRate24h = totalWebhooks24h > 0 ? (failedWebhooks24h / totalWebhooks24h) * 100 : 0

    const ledgerEntries = await db
      .select()
      .from(generalLedger)
      .where(gte(generalLedger.createdAt, last24h))
      .limit(100)

    const metrics = getMetricsSnapshot()
    const metricValues = Object.values(metrics)
    const avgResponseTime = metricValues.length > 0
      ? Math.round(metricValues.reduce((sum, metric) => sum + metric.averageLatencyMs, 0) / metricValues.length)
      : 0

    return ok({
      activeUsers: Number(activeUsers),
      errorRate24h: Number(errorRate24h.toFixed(2)),
      avgResponseTime,
      totalUsers: Number(totalUsers),
      totalWebhooks24h: Number(totalWebhooks24h),
      failedWebhooks24h: Number(failedWebhooks24h),
      metrics,
    })
  } catch (error) {
    return handleApiError(error, 'GET /api/admin/health/stats')
  }
}
