import { z } from "zod";

const envSchema = z.object({
  // Database Configuration
  DATABASE_URL: z.string().url(),

  // Redis Configuration
  REDIS_URL: z.string().url(),

  // Authentication Configuration
  BETTER_AUTH_URL: z.string().url(),
  BETTER_AUTH_URL_SECONDARY: z.string().url().optional(),
  BETTER_AUTH_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL_SECONDARY: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Payment Configuration
  PAYMENT_MODE: z.enum(["mock", "live"]).default("mock"),
  PAYMENT_CONFIG_ENCRYPTION_KEY: z.string().min(44),

  // Storage Configuration
  STORAGE_PRIMARY: z.enum(["uploadthing", "cloudinary"]).default("uploadthing"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  UPLOADTHING_TOKEN: z.string().optional(),

  // Notifications
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  META_ACCESS_TOKEN: z.string().optional(),
  META_PHONE_NUMBER_ID: z.string().optional(),
  META_MAINTENANCE_CREATED_TEMPLATE: z
    .string()
    .default("maintenance_report_created"),
  META_MAINTENANCE_UPDATED_TEMPLATE: z
    .string()
    .default("maintenance_report_updated"),
  NOTIFICATION_ENCRYPTION_KEY: z.string().min(44),
  VAPID_SUBJECT: z.string().default("mailto:admin@konkosyuk.app"),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().min(1),

  // Real-time Chat (Ably)
  ABLY_API_KEY: z.string().min(1),
  NEXT_PUBLIC_ABLY_KEY: z.string().min(1),

  // KYC Verification (Didit)
  DIDIT_API_KEY: z.string().min(1),
  DIDIT_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_DIDIT_API_URL: z.string().url().optional(),

  // Payment Gateway - Otto Digital (Optional)
  OTTO_BASE_URL: z.string().url().optional(),
  OTTO_CLIENT_ID: z.string().optional(),
  OTTO_SECRET_KEY: z.string().min(1).optional(),
  OTTO_WEBHOOK_SECRET: z.string().min(1).optional(),

  // Maps
  NEXT_PUBLIC_STADIA_MAPS_API_KEY: z.string().optional(),

  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Cron Jobs
  CRON_SECRET: z.string().min(32),
});

function fallbackEnv(): z.infer<typeof envSchema> {
  return process.env as unknown as z.infer<typeof envSchema>;
}

export const env: z.infer<typeof envSchema> = (() => {
  try {
    return envSchema.parse(process.env);
  } catch {
    return fallbackEnv();
  }
})();

export function validateEnv(): z.infer<typeof envSchema> {
  return envSchema.parse(process.env);
}

export type Env = z.infer<typeof envSchema>;
