import { db } from '@/db'
import { paymentGatewayConfigs, paymentGatewayCredentials } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { decryptPaymentConfig } from '@/lib/payment-config-crypto'

export type PaymentGatewayConfigData = Record<string, unknown>

export async function getPaymentGatewayConfig(provider: string): Promise<PaymentGatewayConfigData> {
  const [config] = await db
    .select()
    .from(paymentGatewayConfigs)
    .where(eq(paymentGatewayConfigs.provider, provider as any))
    .limit(1)

  if (!config) {
    return {}
  }

  let publicConfig = decryptPaymentConfig(config.config)
  let secretConfig: Record<string, unknown> = {}

  const [credential] = await db
    .select()
    .from(paymentGatewayCredentials)
    .where(eq(paymentGatewayCredentials.gatewayId, config.id))
    .limit(1)

  if (credential) {
    secretConfig = decryptPaymentConfig(credential.encryptedConfig)
  }

  return { ...publicConfig, ...secretConfig }
}

export async function getDokuConfig() {
  return getPaymentGatewayConfig('doku')
}

export async function getNicepayConfig() {
  return getPaymentGatewayConfig('nicepay')
}

export async function getIpaymuConfig() {
  return getPaymentGatewayConfig('ipaymu')
}
