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

export const nicepayAdapter: PaymentProviderAdapter = {
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const baseUrl = env.NICEPAY_BASE_URL
    if (!baseUrl || !env.NICEPAY_MERCHANT_ID || !env.NICEPAY_MERCHANT_KEY) {
      throw new Error('Nicepay credentials not configured')
    }

    const orderId = input.bookingId
    const integerAmount = toIntegerAmount(input.amount)
    const signature = generateSha256Signature(
      `${env.NICEPAY_MERCHANT_ID}${orderId}${integerAmount}${env.NICEPAY_MERCHANT_KEY}`,
      env.NICEPAY_MERCHANT_KEY,
    )

    const response = await axios.post(`${baseUrl}/api/v1/payment`, {
        merchantId: env.NICEPAY_MERCHANT_ID,
        orderId,
        amount: integerAmount,
        paymentMethod: input.metadata?.paymentMethod as string | undefined,
        callbackUrl: `${env.NEXT_PUBLIC_APP_URL1}/api/webhooks/nicepay`,
        returnUrl: `${env.NEXT_PUBLIC_APP_URL1}/payment/result?provider=nicepay&bookingId=${orderId}`,
        expiredIn: input.expiresIn ? String(input.expiresIn) : undefined,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-Nicepay-Merchant-Id': env.NICEPAY_MERCHANT_ID,
          'X-Nicepay-Signature': signature,
        },
      })

      if (response.status >= 400) {
        throw new Error(`Nicepay payment failed: ${response.status} ${response.data}`)
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
    const baseUrl = env.NICEPAY_BASE_URL
    if (!baseUrl || !env.NICEPAY_MERCHANT_ID || !env.NICEPAY_MERCHANT_KEY) {
      throw new Error('Nicepay credentials not configured')
    }

    const signature = generateSha256Signature(
      `${env.NICEPAY_MERCHANT_ID}${transactionId}${env.NICEPAY_MERCHANT_KEY}`,
      env.NICEPAY_MERCHANT_KEY,
    )

const response = await axios.get(
      `${baseUrl}/api/v1/payment/${encodeURIComponent(transactionId)}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Nicepay-Merchant-Id': env.NICEPAY_MERCHANT_ID,
          'X-Nicepay-Signature': signature,
        },
      }
    )

    if (response.status >= 400) {
      throw new Error(`Nicepay status check failed: ${response.status}`)
    }

    const raw = response.data as Record<string, unknown>
    const status = String(raw.status ?? raw.transaction_status ?? 'pending')

    return normalizeGatewayStatus(status)
  },

  async verifyWebhookSignature(context: WebhookContext): Promise<boolean> {
    const secret = env.NICEPAY_WEBHOOK_SECRET
    if (!secret) return false

    const signature = context.headers.get('x-nicepay-signature')
    return verifySignature(context.rawBody, signature, secret)
  },

  async normalizeWebhook(context: WebhookContext): Promise<NormalizedWebhook> {
    const raw = JSON.parse(context.rawBody) as Record<string, unknown>
    const rawStatus = String(raw.status ?? raw.transaction_status ?? 'pending')
    const status = normalizeGatewayStatus(rawStatus)

    const isSuccessCode = rawStatus === '00' || rawStatus === 'Success'
    const normalizedStatus: WebhookPaymentStatus = isSuccessCode ? 'success' : status

    return {
      provider: 'nicepay',
      eventId: context.eventId ?? crypto.randomUUID(),
      transactionId: String(raw.transaction_id ?? raw.orderId ?? raw.order_id ?? ''),
      status: normalizedStatus,
      amount: typeof raw.amount === 'number' ? raw.amount : parseFloat(String(raw.amount ?? 0)),
      currency: String(raw.currency ?? 'IDR'),
      paidAt: raw.payment_time ? new Date(raw.payment_time as string) : undefined,
      metadata: raw,
    }
  },
}
