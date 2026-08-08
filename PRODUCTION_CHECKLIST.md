# Production Deployment Checklist

## 1. Pre-Deployment

- [ ] Set `NODE_ENV=production` di environment hosting
- [ ] Jalankan `bun run build` dan pastikan tidak ada error TypeScript
- [ ] Jalankan `bun run db:generate` untuk memastikan migration terbaru
- [ ] Jalankan `bun run db:migrate` di environment produksi
- [ ] Jalankan `bun run db:seed` (opsional, hanya untuk data awal)
- [ ] Verifikasi semua test passing: `bun run test`

## 2. Environment Variables

### Wajib (Required)

| Variable | Deskripsi | Contoh |
|----------|-----------|--------|
| `DATABASE_URL` | Connection string PostgreSQL | `postgresql://user:pass@host:5432/dbname` |
| `BETTER_AUTH_URL` | Base URL aplikasi | `https://app.konkosyuk.com` |
| `BETTER_AUTH_SECRET` | Secret key minimal 32 karakter | `random_string_minimal_32_karakter` |
| `NEXT_PUBLIC_APP_URL` | Public URL aplikasi | `https://app.konkosyuk.com` |
| `PAYMENT_MODE` | Mode pembayaran | `live` untuk production |

### Payment Gateway (Opsional, tapi wajib jika menggunakan fitur pembayaran)

| Variable | Deskripsi |
|----------|-----------|
| `SAKUKU_BASE_URL` | Base URL Sakuku API |
| `SAKUKU_CLIENT_ID` | Client ID Sakuku |
| `SAKUKU_SECRET_KEY` | Secret Key Sakuku |
| `SAKUKU_WEBHOOK_SECRET` | Webhook Secret Sakuku |
| `DOKU_BASE_URL` | Base URL Doku API |
| `DOKU_MERCHANT_CODE` | Merchant Code Doku |
| `DOKU_SHARED_KEY` | Shared Key Doku |
| `DOKU_WEBHOOK_SECRET` | Webhook Secret Doku |
| `NICEPAY_BASE_URL` | Base URL Nicepay API |
| `NICEPAY_MERCHANT_ID` | Merchant ID Nicepay |
| `NICEPAY_MERCHANT_KEY` | Merchant Key Nicepay |
| `NICEPAY_WEBHOOK_SECRET` | Webhook Secret Nicepay |

### Cron Job

| Variable | Deskripsi |
|----------|-----------|
| `CRON_SECRET` | Secret string minimal 32 karakter untuk auth cron |

### Web Push Notification (Opsional)

| Variable | Deskripsi |
|----------|-----------|
| `VAPID_SUBJECT` | Email admin untuk VAPID | 
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key |
| `VAPID_PRIVATE_KEY` | VAPID private key |

### Google OAuth (Opsional)

| Variable | Deskripsi |
|----------|-----------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |

## 3. Database Migration

- [ ] Backup database sebelum migration
- [ ] Jalankan `bun run db:migrate` di produksi
- [ ] Verifikasi tabel dan kolom baru sudah ter-create
- [ ] Jalankan `bun run db:seed` jika diperlukan

## 4. Platform-Specific Setup

### Vercel
1. Import repository ke Vercel
2. Set environment variables di Vercel Dashboard → Settings → Environment Variables
3. Deploy branch `main` atau manual trigger deploy
4. Set custom domain jika diperlukan

### Render
1. Create new Web Service
2. Set Build Command: `bun run build`
3. Set Start Command: `bun start`
4. Set environment variables
5. Add PostgreSQL database dan set `DATABASE_URL`

### Railway
1. Create new project dari GitHub repo
2. Add PostgreSQL plugin
3. Set environment variables
4. Deploy

## 5. Post-Deployment

- [ ] Verifikasi aplikasi bisa di-access di production URL
- [ ] Test login dengan email/password
- [ ] Test Google OAuth (jika dikonfigurasi)
- [ ] Test create booking flow
- [ ] Test payment webhook endpoint
- [ ] Test cron job: `curl -H "Authorization: Bearer $CRON_SECRET" https://app.konkosyuk.com/api/cron/cleanup`
- [ ] Monitor logs untuk error

## 6. Security Checklist

- [ ] `BETTER_AUTH_SECRET` minimal 32 karakter dan random
- [ ] `CRON_SECRET` minimal 32 karakter dan random
- [ ] Semua `*_WEBHOOK_SECRET` sudah diisi
- [ ] `NODE_ENV=production`
- [ ] HTTPS enforced (tidak ada HTTP)
- [ ] Database tidak public-exposed
- [ ] VAPID keys generated dengan `npx web-push generate-vapid-keys`

## 7. Monitoring

- Setup error tracking (Sentry, LogRocket, dsb)
- Setup Uptime monitoring (UptimeRobot, Pingdom, dsb)
- Monitor database connection pool
- Monitor disk usage untuk file uploads
