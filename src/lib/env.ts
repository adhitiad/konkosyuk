import { z } from "zod";

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
  DOKU_BASE_URL: z.string().url().optional(),
  DOKU_CLIENT_ID: z.string().optional(),
  DOKU_SECRET_KEY: z.string().optional(),
  DOKU_WEBHOOK_SECRET: z.string().optional(),
  IPAYMU_BASE_URL: z.string().url().optional(),
  IPAYMU_VA: z.string().optional(),
  IPAYMU_API_KEY: z.string().optional(),
  IPAYMU_WEBHOOK_SECRET: z.string().optional(),
  NICEPAY_BASE_URL: z.string().url().optional(),
  NICEPAY_MERCHANT_ID: z.string().optional(),
  NICEPAY_MERCHANT_KEY: z.string().optional(),
  NICEPAY_WEBHOOK_SECRET: z.string().optional(),
  PAYMENT_MODE: z.enum(["mock", "live"]).default("mock"),

  // storage Configuration Application ID for UploadThing, Cloudinary configuration, and primary storage selection
  UPLOADTHING_SECRET: z.string().optional(),
  UPLOADTHING_APP_ID: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  STORAGE_PRIMARY: z.enum(["uploadthing", "cloudinary"]).default("uploadthing"),

  // Notifications
  RESEND_API_KEY: z.string().optional(),
  META_ACCESS_TOKEN: z.string().optional(),
  META_PHONE_NUMBER_ID: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
