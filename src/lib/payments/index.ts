import { ipaymuAdapter } from './ipaymu'
import { dokuAdapter } from './doku'
import { nicepayAdapter } from './nicepay'
import { mockAdapter } from './mock'
import type { PaymentProviderAdapter, PaymentProviderName } from './types'
import { env } from '@/lib/env'

const isMockMode = env.PAYMENT_MODE === 'mock'

const providers: Record<PaymentProviderName, PaymentProviderAdapter> = {
  ipaymu: isMockMode ? mockAdapter : ipaymuAdapter,
  doku: isMockMode ? mockAdapter : dokuAdapter,
  nicepay: isMockMode ? mockAdapter : nicepayAdapter,
  mock: mockAdapter,
}

export function getPaymentProvider(name: string): PaymentProviderAdapter | null {
  if (isPaymentProviderName(name)) {
    return providers[name]
  }
  return null
}

export function isPaymentProviderName(value: string): value is PaymentProviderName {
  return value === 'ipaymu' || value === 'doku' || value === 'nicepay'
}
