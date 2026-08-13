import { z } from "zod";

const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().url().optional(),
).catch(undefined);

const envSchema = z.object({
  // Database Configuration
  DATABASE_URL: z.string().url(),

  // Authentication Configuration
  BETTER_AUTH_URL1: z.string().url(),
  BETTER_AUTH_URL2: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_URL1: z.string().url(),
  NEXT_PUBLIC_APP_URL2: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Payment Gateway Configuration
  DOKU_BASE_URL: optionalUrl,
  DOKU_CLIENT_ID: z.string().optional(),
  DOKU_SECRET_KEY: z.string().optional(),
  DOKU_WEBHOOK_SECRET: z.string().optional(),
  IPAYMU_BASE_URL: optionalUrl,
  IPAYMU_VA: z.string().optional(),
  IPAYMU_API_KEY: z.string().optional(),
  IPAYMU_WEBHOOK_SECRET: z.string().optional(),
  NICEPAY_BASE_URL: optionalUrl,
  NICEPAY_MERCHANT_ID: z.string().optional(),
  NICEPAY_MERCHANT_KEY: z.string().optional(),
  NICEPAY_WEBHOOK_SECRET: z.string().optional(),
  PAYMENT_MODE: z.enum(["mock", "live"]).default("mock"),

  // storage Configuration Application ID for UploadThing, Cloudinary configuration, and primary storage selection
  UPLOADTHING_SECRET: z.string().optional(),
  UPLOADTHING_APP_ID: z.string().optional(),
  UPLOADTHING_TOKEN: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  STORAGE_PRIMARY: z.enum(["uploadthing", "cloudinary"]).default("uploadthing"),

  // Notifications
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  META_ACCESS_TOKEN: z.string().optional(),
  META_PHONE_NUMBER_ID: z.string().optional(),
  META_MAINTENANCE_CREATED_TEMPLATE: z.string().default("maintenance_report_created"),
  META_MAINTENANCE_UPDATED_TEMPLATE: z.string().default("maintenance_report_updated"),

  // Redis: prioritas Upstash -> Redis Cloud -> lokal
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  REDIS_CLOUD_URL: z.string().optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
});

export const env = envSchema.parse(process.env);

type LiveGateway = {
  name: string
  fields: Record<string, string | undefined>
}

function validateLivePaymentConfig() {
  if (env.PAYMENT_MODE !== 'live') return

  const gateways: LiveGateway[] = [
    {
      name: 'DOKU',
      fields: {
        DOKU_BASE_URL: env.DOKU_BASE_URL,
        DOKU_CLIENT_ID: env.DOKU_CLIENT_ID,
        DOKU_SECRET_KEY: env.DOKU_SECRET_KEY,
        DOKU_WEBHOOK_SECRET: env.DOKU_WEBHOOK_SECRET,
      },
    },
    {
      name: 'IPAYMU',
      fields: {
        IPAYMU_BASE_URL: env.IPAYMU_BASE_URL,
        IPAYMU_VA: env.IPAYMU_VA,
        IPAYMU_API_KEY: env.IPAYMU_API_KEY,
        IPAYMU_WEBHOOK_SECRET: env.IPAYMU_WEBHOOK_SECRET,
      },
    },
    {
      name: 'NICEPAY',
      fields: {
        NICEPAY_BASE_URL: env.NICEPAY_BASE_URL,
        NICEPAY_MERCHANT_ID: env.NICEPAY_MERCHANT_ID,
        NICEPAY_MERCHANT_KEY: env.NICEPAY_MERCHANT_KEY,
        NICEPAY_WEBHOOK_SECRET: env.NICEPAY_WEBHOOK_SECRET,
      },
    },
  ]

  const configured = gateways.filter(({ fields }) => Object.values(fields).some(Boolean))
  const invalid = configured.flatMap(({ name, fields }) => {
    const missing = Object.entries(fields).filter(([, value]) => !value).map(([key]) => key)
    return missing.length ? [`${name}: missing ${missing.join(', ')}`] : []
  })

  if (configured.length === 0) {
    invalid.push('No payment gateway is configured')
  }

  if (invalid.length > 0) {
    throw new Error(`PAYMENT_MODE=live configuration is invalid. ${invalid.join('; ')}`)
  }
}

validateLivePaymentConfig()

export type Env = z.infer<typeof envSchema>;
