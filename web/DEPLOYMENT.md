# Deployment Guide

## Vercel (Web App)

### Environment Variables
Set these di Vercel Dashboard → Settings → Environment Variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Supabase PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis Labs connection string (sudah ada di `.env.local`) |
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash Redis REST Token |
| `BETTER_AUTH_SECRET` | Yes | Min 32 karakter random |
| `BETTER_AUTH_URL` | Yes | `https://<your-domain>` |
| `CRON_SECRET` | Yes | Min 32 karakter random |
| `PAYMENT_CONFIG_ENCRYPTION_KEY` | Yes | Base64 32 byte |
| `RESEND_API_KEY` | Yes | Resend API key |
| `RESEND_FROM_EMAIL` | Yes | `KonkosYuk <noreply@domain-anda.com>` |
| `DIDIT_API_KEY` | Yes | Didit API key |
| `DIDIT_WEBHOOK_SECRET` | Yes | Didit webhook secret |
| `NEXT_PUBLIC_APP_URL` | Yes | `https://<your-domain>` |
| `NEXT_PUBLIC_MAPTILER_API_KEY` | Yes | MapTiler API key |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Yes | Web Push VAPID public key |
| `VAPID_PRIVATE_KEY` | Yes | Web Push VAPID private key |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `DOKU_BASE_URL` | No | Doku payment gateway URL |
| `DOKU_CLIENT_ID` | No | Doku client ID |
| `DOKU_SECRET_KEY` | No | Doku secret key |
| `DOKU_WEBHOOK_SECRET` | No | Doku webhook secret |
| `NICEPAY_BASE_URL` | No | Nicepay URL |
| `NICEPAY_MERCHANT_ID` | No | Nicepay merchant ID |
| `NICEPAY_MERCHANT_KEY` | No | Nicepay merchant key |
| `NICEPAY_WEBHOOK_SECRET` | No | Nicepay webhook secret |
| `UPLOADTHING_TOKEN` | No | Uploadthing token |
| `CLOUDINARY_CLOUD_NAME` | No | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | No | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | Cloudinary API secret |
| `META_ACCESS_TOKEN` | No | Meta WhatsApp access token |
| `META_PHONE_NUMBER_ID` | No | Meta WhatsApp phone number ID |
| `META_MAINTENANCE_CREATED_TEMPLATE` | No | Template name |
| `META_MAINTENANCE_UPDATED_TEMPLATE` | No | Template name |

### Project Settings
- **Root Directory**: `web`
- **Build Command**: `bun run build`
- **Output Directory**: `.next`
- **Install Command**: `bun install`
- **Framework**: Next.js
- **Node.js Version**: >= 18.x (Bun handles this)

### Notes
- `poweredByHeader` sudah di-set `false` di `next.config.ts`
- Security headers (HSTS, CSP, X-Frame-Options, dll) sudah dikonfigurasi
- Cron jobs tidak di-deploy ke Vercel — handled oleh worker di Render

---

## Render (Worker)

### Setup
1. Buat Worker service di Render
2. Set **Root Directory** ke `web`
3. Set **Runtime** ke `Bun`
4. Set **Build Command** ke `bun install`
5. Set **Start Command** ke `bun run worker:start`

### Environment Variables
Set these di Render Dashboard → Environment:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Supabase PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis Labs connection string |
| `BETTER_AUTH_SECRET` | Yes | Min 32 karakter random |
| `CRON_SECRET` | Yes | Min 32 karakter random |
| `PAYMENT_CONFIG_ENCRYPTION_KEY` | Yes | Base64 32 byte |
| `RESEND_API_KEY` | Yes | Resend API key |
| `RESEND_FROM_EMAIL` | Yes | `KonkosYuk <noreply@domain-anda.com>` |
| `DIDIT_API_KEY` | Yes | Didit API key |
| `DIDIT_WEBHOOK_SECRET` | Yes | Didit webhook secret |
| `NODE_ENV` | Yes | `production` |

### Alternative: render.yaml
File `render.yaml` sudah disediakan di root `web/`. Import langsung ke Render untuk setup otomatis.

### Notes
- Worker menggunakan BullMQ dengan 4 queue (cleanup, complete, saved-search, update-area-counts)
- Semua job dijadwalkan dengan cron pattern (setiap jam, jam 2, 3, 4 pagi)
- Graceful shutdown di-handle pada SIGINT/SIGTERM

---

## Pre-Deployment Checklist

- [ ] `bun run build` passes tanpa error
- [ ] `bun run lint` passes tanpa error
- [ ] `bun run test -- --run` passes
- [ ] Semua env variables required sudah di-set di Vercel dan Render
- [ ] `REDIS_URL` menggunakan instance Redis yang aktif
- [ ] `DATABASE_URL` menggunakan Supabase pooler (IPv4-only)
- [ ] `BETTER_AUTH_SECRET` dan `CRON_SECRET` minimal 32 karakter
- [ ] `vercel.json` tidak memiliki cron path yang tidak ada
