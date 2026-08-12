import axios from 'axios'
import { generateSha256Signature, verifySignature } from './signature'
import { normalizeGatewayStatus } from './status'
import type {
  CreatePaymentInput,
  CreatePaymentResult,
  WebhookContext,
  NormalizedWebhook,
  PaymentProviderAdapter,
} from './types'
import { env } from '@/lib/env'
import type { WebhookPaymentStatus } from './types'

function toIntegerAmount(amount: number): number {
  return Math.round(amount)
}

export const dokuAdapter: PaymentProviderAdapter = {
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const baseUrl = env.DOKU_BASE_URL
    if (!baseUrl || !env.DOKU_CLIENT_ID || !env.DOKU_SECRET_KEY) {
      throw new Error('Doku credentials not configured')
    }

    const invoiceNumber = input.bookingId
    const integerAmount = toIntegerAmount(input.amount)
    const signature = generateSha256Signature(
      `${env.DOKU_CLIENT_ID}${invoiceNumber}${integerAmount}${env.DOKU_SECRET_KEY}`,
      env.DOKU_SECRET_KEY,
    )

    const response = await axios.post(`${baseUrl}/api/v1/payment/create`, {
        clientId: env.DOKU_CLIENT_ID,
        invoiceNumber,
        amount: integerAmount,
        customerName: input.metadata?.customerName ?? 'Customer',
        email: input.metadata?.email ?? '',
        callbackUrl: `${env.NEXT_PUBLIC_APP_URL1}/api/webhooks/doku`,
        returnUrl: `${env.NEXT_PUBLIC_APP_URL1}/payment/result?provider=doku&bookingId=${invoiceNumber}`,
        expiredIn: input.expiresIn ? String(input.expiresIn) : undefined,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Doku-Client-Id': env.DOKU_CLIENT_ID,
          'X-Doku-Signature': signature,
        },
      })

      if (response.status >= 400) {
        throw new Error(`Doku payment failed: ${response.status} ${response.data}`)
      }

      const raw = response.data as Record<string, unknown>

    return {
      paymentId: String(raw.payment_id ?? raw.id ?? crypto.randomUUID()),
      transactionId: raw.transaction_id ? String(raw.transaction_id) : undefined,
      redirectUrl: raw.redirect_url ? String(raw.redirect_url) : undefined,
      qrCode: raw.qr_code ? String(raw.qr_code) : undefined,
      vaNumber: raw.va_number ? String(raw.va_number) : undefined,
      expiresAt: raw.expires_at ? new Date(raw.expires_at as string) : undefined,
      rawResponse: raw,
    }
  },

  async getPaymentStatus(transactionId: string): Promise<WebhookPaymentStatus> {
    const baseUrl = env.DOKU_BASE_URL
    if (!baseUrl || !env.DOKU_CLIENT_ID || !env.DOKU_SECRET_KEY) {
      throw new Error('Doku credentials not configured')
    }

    const signature = generateSha256Signature(
      `${env.DOKU_CLIENT_ID}${transactionId}${env.DOKU_SECRET_KEY}`,
      env.DOKU_SECRET_KEY,
    )

    const response = await axios.get(`${baseUrl}/api/v1/payment/${encodeURIComponent(transactionId)}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Doku-Client-Id': env.DOKU_CLIENT_ID,
        'X-Doku-Signature': signature,
      },
    })

    if (response.status >= 400) {
      throw new Error(`Doku status check failed: ${response.status}`)
    }

    const raw = response.data as Record<string, unknown>
    const status = String(raw.status ?? raw.transaction_status ?? 'pending')

    return normalizeGatewayStatus(status)
  },

  async verifyWebhookSignature(context: WebhookContext): Promise<boolean> {
    const secret = env.DOKU_WEBHOOK_SECRET
    if (!secret) return false

    const signature = context.headers.get('x-doku-signature')
    return verifySignature(context.rawBody, signature, secret)
  },

  async normalizeWebhook(context: WebhookContext): Promise<NormalizedWebhook> {
    const raw = JSON.parse(context.rawBody) as Record<string, unknown>
    const status = normalizeGatewayStatus(String(raw.status ?? raw.transaction_status ?? 'pending'))

    return {
      provider: 'doku',
      eventId: context.eventId ?? crypto.randomUUID(),
      transactionId: String(raw.transaction_id ?? raw.invoice_number ?? ''),
      status,
      amount: typeof raw.amount === 'number' ? raw.amount : parseFloat(String(raw.amount ?? 0)),
      currency: String(raw.currency ?? 'IDR'),
      paidAt: raw.payment_time ? new Date(raw.payment_time as string) : undefined,
      metadata: raw,
    }
  },
}
