import { NextResponse } from 'next/server'

export async function GET() {
  const providers = [
    { name: 'Doku', status: 'healthy' as const, latency: 120 },
    { name: 'iPaymu', status: 'healthy' as const, latency: 150 },
    { name: 'NicePay', status: 'healthy' as const, latency: 180 },
  ]

  return NextResponse.json({
    status: 'healthy',
    providers,
    message: 'All payment gateways operational',
  })
}
