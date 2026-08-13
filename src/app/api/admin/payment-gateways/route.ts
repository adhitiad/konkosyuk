import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { paymentGatewayConfigs } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateAdminOnlyRequest } from '@/lib/api-auth'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { ok, fail, handleApiError } from '@/lib/api'
import { z } from 'zod'
import { createAuditLog } from '@/lib/audit-log'

const dokuConfigSchema = z.object({
  merchantCode: z.string().min(1, 'Merchant code wajib diisi'),
  clientId: z.string().min(1, 'Client ID wajib diisi'),
  secretKey: z.string().min(1, 'Secret key wajib diisi'),
  webhookSecret: z.string().optional(),
})

const ipaymuConfigSchema = z.object({
  va: z.string().min(1, 'VA number wajib diisi'),
  apiKey: z.string().min(1, 'API key wajib diisi'),
  webhookSecret: z.string().optional(),
})

const nicepayConfigSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID wajib diisi'),
  merchantKey: z.string().min(1, 'Merchant key wajib diisi'),
  webhookSecret: z.string().optional(),
})

const providerConfigSchemas: Record<string, z.ZodType<Record<string, unknown>>> = {
  doku: dokuConfigSchema,
  ipaymu: ipaymuConfigSchema,
  nicepay: nicepayConfigSchema,
}

const upsertGatewaySchema = z.object({
  provider: z.enum(['doku', 'ipaymu', 'nicepay']),
  config: z.record(z.string(), z.any()),
  environment: z.enum(['sandbox', 'production']).default('sandbox'),
  isActive: z.boolean().default(false),
}).superRefine((data, ctx) => {
  const schema = providerConfigSchemas[data.provider]
  if (!schema) return

  const result = schema.safeParse(data.config)
  if (!result.success) {
    result.error.issues.forEach((issue) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['config', issue.path.join('.')],
        message: issue.message,
      })
    })
  }
})

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const data = await db.select().from(paymentGatewayConfigs)
    const sanitized = data.map((config) => ({
      ...config,
      config: {
        ...config.config,
        secretKey: config.config.secretKey ? '••••••••' : undefined,
        webhookSecret: config.config.webhookSecret ? '••••••••' : undefined,
      },
    }))
    return ok({ data: sanitized })
  } catch (error) {
    return handleApiError(error, 'GET /api/admin/payment-gateways')
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await validateAdminOnlyRequest(req)
    if (authResult instanceof Response) return authResult
    const { session } = authResult

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    const body = upsertGatewaySchema.parse(await req.json())

    const providerConfig = body.config as Record<string, unknown>

    const [existing] = await db
      .select()
      .from(paymentGatewayConfigs)
      .where(eq(paymentGatewayConfigs.id, body.provider))
      .limit(1)

    const mergedConfig = existing
      ? { ...(existing.config as Record<string, unknown>), ...providerConfig }
      : providerConfig

    const [config] = await db
      .insert(paymentGatewayConfigs)
      .values({
        id: body.provider,
        provider: body.provider,
        config: mergedConfig,
        environment: body.environment,
        isActive: body.isActive,
      })
      .onConflictDoUpdate({
        target: paymentGatewayConfigs.id,
        set: {
          config: mergedConfig,
          environment: body.environment,
          isActive: body.isActive,
          updatedAt: new Date(),
        },
      })
      .returning()

    const safeConfig = {
      ...config,
      config: {
        ...config.config,
        secretKey: config.config.secretKey ? '••••••••' : undefined,
        webhookSecret: config.config.webhookSecret ? '••••••••' : undefined,
      },
    }

    await createAuditLog({
      action: 'create',
      targetType: 'payment_gateway',
      targetId: body.provider,
      adminId: session.user.id,
      details: {
        provider: body.provider,
        environment: body.environment,
        isActive: body.isActive,
      },
    })

    return ok(safeConfig, 201)
  } catch (error) {
    return handleApiError(error, 'POST /api/admin/payment-gateways')
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await validateAdminOnlyRequest(req)
    if (authResult instanceof Response) return authResult
    const { session } = authResult

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    const { searchParams } = new URL(req.url)
    const provider = searchParams.get('provider')

    if (!provider || !['doku', 'ipaymu', 'nicepay'].includes(provider)) {
      return fail('Invalid provider', 400)
    }

    const providerValue = provider as 'doku' | 'ipaymu' | 'nicepay'
    await db.delete(paymentGatewayConfigs).where(eq(paymentGatewayConfigs.provider, providerValue))

    await createAuditLog({
      action: 'delete',
      targetType: 'payment_gateway',
      targetId: providerValue,
      adminId: session.user.id,
      details: {
        provider: providerValue,
      },
    })

    return ok({ success: true })
  } catch (error) {
    return handleApiError(error, 'DELETE /api/admin/payment-gateways')
  }
}
