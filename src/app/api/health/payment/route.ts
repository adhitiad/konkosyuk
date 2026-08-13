import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { monitor } from '@/lib/monitoring'

export const dynamic = 'force-dynamic'

async function probeGateway(name: string, baseUrl: string | undefined) {
  if (!baseUrl) return { name, status: 'not_configured' as const, latency: 0 }
  const started = performance.now()
  try {
    const response = await fetch(baseUrl, {
      method: 'HEAD',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    const latency = Math.round(performance.now() - started)
    return {
      name,
      status: response.status < 500 ? 'healthy' as const : 'degraded' as const,
      latency,
      httpStatus: response.status,
    }
  } catch (error) {
    const latency = Math.round(performance.now() - started)
    return { name, status: 'down' as const, latency, error: error instanceof Error ? error.message : 'Connection failed' }
  }
}

export async function GET() {
  const providers = await Promise.all([
    monitor('health.payment.doku', () => probeGateway('Doku', env.DOKU_BASE_URL)),
    monitor('health.payment.ipaymu', () => probeGateway('iPaymu', env.IPAYMU_BASE_URL)),
    monitor('health.payment.nicepay', () => probeGateway('NicePay', env.NICEPAY_BASE_URL)),
  ])
  const configured = providers.filter((provider) => provider.status !== 'not_configured')
  const status = configured.some((provider) => provider.status === 'down')
    ? 'down'
    : configured.some((provider) => provider.status === 'degraded')
      ? 'degraded'
      : 'healthy'

  return NextResponse.json({
    status,
    mode: env.PAYMENT_MODE,
    providers,
    message: configured.length ? 'Payment gateway connectivity checked' : 'No payment gateway configured',
  }, { status: status === 'down' ? 503 : 200 })
}
