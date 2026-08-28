# Deployment Guide

## Vercel (Web App)

### Environment Variables

Set these di Vercel Dashboard → Settings → Environment Variables:

| Variable                            | Required | Description                                              |
| ----------------------------------- | -------- | -------------------------------------------------------- |
| `DATABASE_URL`                      | Yes      | PostgreSQL connection string                             |
| `REDIS_URL`                         | Yes      | Upstash Redis connection string (ioredis format)          |
| `BETTER_AUTH_SECRET`                | Yes      | Min 32 karakter random                                   |
| `BETTER_AUTH_URL`                   | Yes      | `https://<your-domain>`                                  |
| `PAYMENT_CONFIG_ENCRYPTION_KEY`     | Yes      | Base64 32 byte                                           |
| `RESEND_API_KEY`                    | Yes      | Resend API key                                           |
| `RESEND_FROM_EMAIL`                 | Yes      | `KonkosYuk <noreply@domain-anda.com>`                    |
| `DIDIT_API_KEY`                     | Yes      | Didit API key                                            |
| `DIDIT_WEBHOOK_SECRET`              | Yes      | Didit webhook secret                                     |
| `NEXT_PUBLIC_APP_URL`               | Yes      | `https://<your-domain>`                                  |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`      | Yes      | Web Push VAPID public key                                |
| `VAPID_PRIVATE_KEY`                 | Yes      | Web Push VAPID private key                               |
| `GOOGLE_CLIENT_ID`                  | No       | Google OAuth client ID                                   |
| `GOOGLE_CLIENT_SECRET`              | No       | Google OAuth client secret                               |
| `DOKU_BASE_URL`                     | No       | Doku payment gateway URL                                 |
| `DOKU_CLIENT_ID`                    | No       | Doku client ID                                           |
| `DOKU_SECRET_KEY`                   | No       | Doku secret key                                          |
| `DOKU_WEBHOOK_SECRET`               | No       | Doku webhook secret                                      |
| `NICEPAY_BASE_URL`                  | No       | Nicepay URL                                              |
| `NICEPAY_MERCHANT_ID`               | No       | Nicepay merchant ID                                      |
| `NICEPAY_MERCHANT_KEY`              | No       | Nicepay merchant key                                     |
| `NICEPAY_WEBHOOK_SECRET`            | No       | Nicepay webhook secret                                   |
| `UPLOADTHING_TOKEN`                 | No       | Uploadthing token                                        |
| `CLOUDINARY_CLOUD_NAME`             | No       | Cloudinary cloud name                                    |
| `CLOUDINARY_API_KEY`                | No       | Cloudinary API key                                       |
| `CLOUDINARY_API_SECRET`             | No       | Cloudinary API secret                                    |

### Project Settings

- **Root Directory**: `apps/web`
- **Build Command**: `bun run build`
- **Output Directory**: `.next`
- **Install Command**: `bun install`
- **Framework**: Next.js
- **Node.js Version**: >= 18.x (Bun handles this)

### Notes

- `poweredByHeader` sudah di-set `false` di `next.config.ts`
- Security headers (HSTS, CSP, X-Frame-Options, dll) sudah dikonfigurasi
- Cron jobs menggunakan Vercel Cron Jobs atau Server Actions, tidak ada background worker terpisah

---

## Pre-Deployment Checklist

- [ ] `bun run build` passes tanpa error
- [ ] `bun run lint` passes tanpa error
- [ ] `bun run test -- --run` passes
- [ ] Semua env variables required sudah di-set di Vercel
- [ ] `REDIS_URL` menggunakan instance Redis yang aktif
- [ ] `DATABASE_URL` menggunakan PostgreSQL yang aktif
- [ ] `BETTER_AUTH_SECRET` minimal 32 karakter
- [ ] `vercel.json` tidak memiliki cron path yang tidak ada