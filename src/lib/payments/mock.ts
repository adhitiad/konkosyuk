import type {
  CreatePaymentInput,
  CreatePaymentResult,
  WebhookContext,
  NormalizedWebhook,
  PaymentProviderAdapter,
} from './types'

export const mockAdapter: PaymentProviderAdapter = {
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const invoiceNumber = input.bookingId

    return {
      paymentId: `mock-${Date.now()}`,
      transactionId: invoiceNumber,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/mock-checkout/${invoiceNumber}`,
      rawResponse: {
        mock: true,
        invoiceNumber,
        amount: input.amount,
      },
    }
  },

  async getPaymentStatus(_transactionId: string) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return 'success'
  },

  async verifyWebhookSignature(_context: WebhookContext): Promise<boolean> {
    return true
  },

  async normalizeWebhook(context: WebhookContext): Promise<NormalizedWebhook> {
    const body = JSON.parse(context.rawBody) as Record<string, unknown>

    return {
      provider: 'mock',
      eventId: context.eventId ?? `mock-event-${Date.now()}`,
      transactionId: String(body.transactionId ?? body.invoiceNumber ?? ''),
      status: (body.status as 'success' | 'failed' | 'expired') ?? 'pending',
      amount: typeof body.amount === 'number' ? body.amount : parseFloat(String(body.amount ?? 0)),
      currency: String(body.currency ?? 'IDR'),
      paidAt: body.paidAt ? new Date(body.paidAt as string) : undefined,
      metadata: body,
    }
  },
}