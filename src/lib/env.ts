import { z } from "zod";

const optionalUrl = z
  .preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().url().optional(),
  )
  .catch(undefined);

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

  // Payment Configuration
  PAYMENT_MODE: z.enum(["mock", "live"]).default("mock"),
  PAYMENT_CONFIG_ENCRYPTION_KEY: z.string().optional(),

  // Storage Configuration
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
  META_MAINTENANCE_CREATED_TEMPLATE: z
    .string()
    .default("maintenance_report_created"),
  META_MAINTENANCE_UPDATED_TEMPLATE: z
    .string()
    .default("maintenance_report_updated"),

  // Redis: prioritas Upstash -> Redis Cloud -> lokal
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  REDIS_CLOUD_URL: optionalUrl,
  REDIS_URL: z.string().default("redis://localhost:6379"),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
