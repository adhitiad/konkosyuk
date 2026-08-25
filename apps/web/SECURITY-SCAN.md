# Security & Architecture Scan — Hasil

## 1. Webhook Validation

### Doku

- File: `src/lib/payments/doku.ts:118`
- Signature validasi: **ADA**
- Detail: HMAC-SHA256 via `verifyWebhookSignature()`, header `x-doku-signature`, divalidasi SEBELUM proses DB
- Error logging: `console.error` di `src/lib/payments/webhook.ts:62,70` — tidak menggunakan winston/Sentry

### iPaymu

- File: `src/lib/payments/ipaymu.ts:150`
- Signature validasi: **ADA**
- Detail: SHA256 via `verifyWebhookSignature()`, header `x-ipaymu-signature` atau `signature`, divalidasi SEBELUM proses DB
- Error logging: `console.error` — tidak menggunakan winston/Sentry

### Nicepay

- File: `src/lib/payments/nicepay.ts:117`
- Signature validasi: **ADA**
- Detail: HMAC-SHA256 via `verifyWebhookSignature()`, header `x-nicepay-signature`, divalidasi SEBELUM proses DB
- Error logging: `console.error` — tidak menggunakan winston/Sentry

### Didit

- File: `src/app/api/kyc/webhook/route.ts:52`
- Signature validasi: **ADA**
- Detail: HMAC-SHA256 dengan `crypto.timingSafeEqual`, header `x-signature-v2`, timestamp check (5 menit), divalidasi SEBELUM proses DB
- Error logging: `console.error` di baris 62, 70, 92, 107, 123, 166 — tidak menggunakan winston/Sentry

## 2. Middleware/proxy.ts

- Status: **ADA**
- Temuan:
  - Rate limiting: Tidak ada di middleware (namun setiap API route memiliki rate limiting individual via `enforceRateLimit`)
  - Admin protection: Tidak ada di middleware (dilakukan per-route via `requireSession` atau `validateAdminRequest`)
  - Security headers: ADA — HSTS, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, X-Permitted-Cross-Domain-Policies, X-Download-Options, COOP, Referrer-Policy, Permissions-Policy, CSP dengan nonce
  - CORS: Tidak ada konfigurasi CORS eksplisit — mengandalkan default Next.js
  - `poweredByHeader: false`: **TIDAK ADA** di `next.config.ts`

## 3. next.config.ts

- `images.remotePatterns`: ADA, whitelist spesifik (Cloudinary, Unsplash, Stadia Maps, OpenStreetMap, MapTiler) — tidak terlalu luas
- `headers()`: ADA, mengatur security headers lengkap
- `redirects()`: Tidak ada
- `poweredByHeader: false`: **TIDAK ADA** — header `X-Powered-By: Next.js` tetap muncul

## 4. instrumentation.ts

- Status: **TIDAK ADA**
- Temuan: File tidak ditemukan — tidak ada kode startup yang berisiko, tidak ada koneksi DB/Redis yang dibuka di sini

## 5. Koneksi DB

- File: `src/db/index.ts`
- Pool: **ADA** (`pg.Pool`, `max: 5`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 10000`)
- SSL: **TIDAK ADA** `ssl: true` — untuk production dengan cloud DB (Upstash, Neon, dll), SSL sebaiknya di-enable
- `rejectUnauthorized: false`: **TIDAK ADA** — bagus, tidak ada bypass verifikasi SSL

## 6. API Routes

- Jumlah route ditemukan: ~100+ route handlers
- Yang tidak punya auth check: ~35 route — **semua adalah route yang seharusnya public:**
  - Webhooks (`/api/webhooks/[provider]`, `/api/kyc/webhook`, `/api/webhooks/mock`)
  - Health checks (`/api/health`, `/api/health/db`, `/api/health/payment`, `/api/health/storage`)
  - Public data (`/api/campus-areas`, `/api/popular-areas`, `/api/properties/[id]/units`, `/api/proxy/wilayah/[...path]`)
  - Auth endpoints (`/api/auth/[...all]`, `/api/auth/ably-config`, `/api/auth/ably-token`, `/api/auth/update-profile`)
  - Newsletter (`/api/newsletter/subscribe`)
  - CSRF (`/api/csrf`)
  - Admin routes menggunakan `validateAdminRequest` atau `validateAdminOnlyRequest` (bukan `requireSession` biasa)
- Yang tidak punya input validation: **PERLU VERIFIKASI MANUAL** — beberapa route public seperti `/api/proxy/wilayah/[...path]` dan `/api/properties/[id]/units` tidak menggunakan Zod validation
- Mass assignment: Tidak ada indikasi mass assignment — admin routes menggunakan Zod schema yang eksplisit

## 7. Error Handling

- `error.tsx`: **ADA** (`src/app/error.tsx`) — client error boundary dengan UI fallback + Sentry reporting
- `not-found.tsx`: **ADA** (`src/app/not-found.tsx`) — 404 page dengan UI konsisten
- `global-error.tsx`: **ADA** (`src/app/global-error.tsx`) — root error boundary dengan Sentry reporting

## RINGKASAN

| #   | Issue                                                                           | Severity | File                                                                                         |
| --- | ------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| 1   | Webhook error logging menggunakan `console.error` bukan winston/Sentry          | MEDIUM   | `src/lib/payments/webhook.ts`, `src/app/api/kyc/webhook/route.ts`                            |
| 2   | `poweredByHeader: false` tidak di-set                                           | RENDAH   | `next.config.ts`                                                                             |
| 3   | DB connection tidak ada `ssl: true` untuk production                            | HIGH     | `src/db/index.ts`                                                                            |
| 4   | Beberapa public API routes tidak ada input validation (proxy, properties units) | MEDIUM   | `src/app/api/proxy/wilayah/[...path]/route.ts`, `src/app/api/properties/[id]/units/route.ts` |
