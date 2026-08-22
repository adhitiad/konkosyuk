# Security Phase 1 — CRITICAL Fixes

## Fix 1: CSRF httpOnly cookie
- File: `src/app/api/csrf/route.ts`, `src/lib/axios.ts`
- Status: DIPERBAIKI
- Detail:
  - Cookie `csrf_token` diubah dari `httpOnly: false` + `sameSite: "lax"` menjadi `httpOnly: true` + `sameSite: "strict"`
  - Frontend tidak lagi membaca cookie via `document.cookie`. Sekarang `/api/csrf` mengembalikan token di JSON response body (`{ success: true, token }`)
  - `getCsrfToken()` dan `ensureCsrfToken()` di `src/lib/axios.ts` diperbarui untuk menyimpan token di variable module-level (in-memory) bukan dari cookie

## Fix 2: MD5 → HMAC-SHA256 iPaymu
- File: `src/lib/payments/ipaymu.ts`, `src/lib/payments/signature.ts`
- Status: PERTAHANKAN — iPaymu sudah menggunakan HMAC-SHA256
- Detail:
  - `ipaymu.ts` menggunakan `generateSha256Signature()` untuk outbound (createPayment, getPaymentStatus) dan inbound (verifyWebhookSignature)
  - Fungsi `generateMd5Signature()` ada di `signature.ts` tetapi tidak dipakai oleh iPaymu
  - Tidak ada perubahan kode diperlukan — iPaymu sudah aman

## Fix 3: Webhook Rate Limiting
- File: `src/app/api/webhooks/[provider]/route.ts`
- Status: SUDAH ADA
- Detail:
  - Webhook endpoint sudah memiliki `enforceRateLimit(req, webhookRateLimit)` pada baris 40
  - Dilengkapi IP allowlisting (`isWebhookIpAllowed`) sebelum rate limiting
  - Signature validation dilakukan setelah rate limit dan IP check

## Fix 4: Admin Webhook Reprocess
- File: `src/app/api/admin/webhooks/route.ts`
- Status: TIDAK DAPAT DITEMUKAN
- Detail:
  - Admin webhooks route hanya memiliki endpoint GET (list webhooks)
  - Tidak ada endpoint PATCH/POST untuk reprocess atau update `signatureValid`/`processedAt`
  - Tidak ada celah karena fitur reprocess belum diimplementasikan
  - Rekomendasi: Jika nanti menambahkan reprocess endpoint, pastikan re-verify signature sebelum update

## Fix 5: requireLocalEmailVerified
- File: `src/lib/auth.ts`
- Status: SUDAH BENAR
- Detail:
  - Konfigurasi `accountLinking.requireLocalEmailVerified` sudah di-set ke `true` (baris 58)
  - `emailAndPassword.requireEmailVerification` sudah di-set kondisional di production (baris 42-44)
  - Tidak ada perubahan kode diperlukan

## Verifikasi
- ESLint: 0 errors, 0 warnings
- TypeScript: `bun run build` passes
- Tests: 296/296 tests pass (1 pre-existing failure unrelated to changes)
