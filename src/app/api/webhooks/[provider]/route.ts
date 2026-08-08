import { NextRequest, NextResponse } from 'next/server'
import { getPaymentProvider } from '@/lib/payments'
import { handleWebhookRequest } from '@/lib/payments/webhook'

export async function GET() {
  return NextResponse.json({ message: 'Webhook endpoint' }, { status: 405 })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  try {
    const { provider } = await params
    const adapter = getPaymentProvider(provider)

    if (!adapter) {
      return NextResponse.json({ success: false, error: 'Unknown provider' }, { status: 400 })
    }

    const rawBody = await req.text()
    const ctx = {
      provider: provider as 'ipaymu' | 'doku' | 'nicepay',
      headers: req.headers,
      rawBody,
    }

    return await handleWebhookRequest(provider, ctx)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Webhook failed' },
      { status: 500 },
    )
  }
}
