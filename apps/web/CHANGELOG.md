# Changelog

Semua perubahan penting pada proyek ini akan didokumentasikan di file ini.

Format berbasis [Keep a Changelog](https://keepachangelog.com/ID/1.0.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [Unreleased]

### Added

- Referral system P0: commission calculation, eligibility sweep, voucher redemption
- `voucher_redeemed_at` column pada tabel `referrals` untuk mencegah double-spend voucher
- Server action `linkReferralCode` untuk capture referral code saat signup
- Cron job `referral-eligibility-sweep` (tiap jam) untuk memproses referral yang sudah eligible
- Voucher redemption di featured listing checkout (max 50% potongan)
- Duplicate-guard untuk kategori tenant (one-time commission per referee)
- Sistem security event logging untuk auth flows
- Webhook IP allowlist untuk Doku, iPaymu, dan Nicepay
- Payment amount tampering protection di webhook handler
- Webhook replay protection via payload hash storage
- Testing infrastructure: Vitest + React Testing Library
- E2E testing dengan Playwright
- Code coverage reporting dengan threshold minimum
- `/api/health/live` endpoint untuk liveness probe (K8s/Docker)
- Shared Redis connection singleton untuk BullMQ workers dan queues

### Changed

- `total_referrals` di tabel `users` kini di-increment saat referral completed (convert_voucher / apply_offset)
- Referral verification dimulai otomatis saat `full_payment` webhook sukses
- Referral gagal otomatis saat payment di-refund (4 titik integrasi)
- Featured listing checkout mendukung parameter `voucherCode` opsional
- Migrasi iPaymu signature dari MD5 ke HMAC-SHA256
- Session configuration: `expiresIn` 7 hari, `updateAge` 1 hari
- Password policy: minimum 8 karakter
- Email verification required untuk semua user
- Semua Server Actions kini memiliki validasi CSRF via `validateActionCsrf(formData)`
- Rate limiter kini fail-closed (mengembalikan 503 saat Redis tidak tersedia, bukan unlimited access)
- Payment gateway URLs menggunakan `NEXT_PUBLIC_APP_URL_SECONDARY` fallback (menggantikan `NEXT_PUBLIC_APP_URL1`)
- Docker healthcheck menggunakan `curl -f` ke `/api/health/live`

### Security

- TwoFactor plugin dengan TOTP + account lockout
- Security headers: COOP, COEP, X-Permitted-Cross-Domain-Policies, X-Download-Options
- Trusted origins expansion untuk production
- Public rate limiting (60 req/min) pada endpoint properties
- Webhook signature verification diprioritaskan sebelum rate limiting
- `PAYMENT_MODE=mock` mengeluarkan error di production

### Security

- Audit 80+ API endpoint: identifikasi 20 finding (6 High, 9 Medium, 5 Low)
- Admin ads mutations missing CSRF validation (approve/reject/cancel)
- KYC endpoint SSRF via `diditApiUrl` — ditambahkan validasi URL allowlist
- Referral double-spend race condition — ditambahkan `db.transaction()` + `FOR UPDATE`
- Staff authorization bypass: `/api/users/[id]` dan `/api/properties/[id]` ditambahkan ownership check untuk staff
- `/api/admin/kyc/requests` kini hanya admin, KTP number masked, gambar via presigned URL
- `/api/users/me` menghapus eksposur `ktpNumber` dan `ktpImageUrl`
- `/api/properties` GET `ids` filter sekarang dibatasi 100 records
- `/api/reviews` GET kini memiliki pagination (limit 50, max 200)
- `/api/referrals` PUT wrapped in transaction dengan row-level lock
- `/api/admin/payments/[id]` PATCH wrapped in transaction
- `/api/admin/ads/[id]` approve/reject menggunakan conditional update untuk mencegah race condition
- Input validation: ad mutations, KYC session, referrals menggunakan Zod schema
- CSV injection protection di `/api/admin/bookings/export`
- Error logging: mengganti `console.error` dengan `logError` di KYC dan webhook handlers
- CSP: menghapus `dangerouslyAllowSVG`, menambahkan `report-uri` untuk violation monitoring
- CSRF cookie `sameSite` diubah ke `strict` di production
- SQL injection fixes: `/admin/reports/demographics`, `/api/properties`, `/api/properties/[id]/units`
- Staff field restriction: admin users list dan detail kini menyaring field sensitif (KTP, balance, reputation) untuk role staff
- Pagination added: `/admin/users`, `/admin/payments`, `/admin/properties/export`, `/admin/bookings/export`, `/admin/analytics/revenue`
- XSS sanitization: user-generated content (reviews, chat, maintenance, properties, profile) disanitasi via `sanitizeString()` sebelum disimpan
- SVG upload blocked di `/api/user/upload-avatar` + magic bytes validation + size limit 5MB
- Password reset configured di Better Auth dengan token delivery
- Rate limiting configured di Better Auth: 100 req/60s default, 5 req/10s untuk sign-in/email dan sign-up/email, 3 req/10s untuk forgot-password dan two-factor
- Error handling: removed silent catch blocks, menggunakan `handleApiError` untuk konsistensi
- Pre-existing TypeScript fixes: `referrals` schema `updatedAt` column removed dari library yang tidak tersedia di schema

### Removed

- `CRON_SECRET` dari seluruh codebase, CI, dokumentasi, dan security checklist
- Dependency `@upstash/redis` dan `node-cron`
- API route cron lama (`/api/cron/process-expired-refunds`, `/api/cron/saved-search-match`)

### Fixed

- DB connection pooling: `max` diturunkan dari 10 ke 5, ditambahkan `connectionTimeoutMillis: 10000` untuk Render worker
- Konsistensi Redis: seluruh aplikasi menggunakan ioredis (`REDIS_URL`), bukan REST client
- `force-dynamic` dihapus dari locale layout (`src/app/[locale]/layout.tsx`), halaman protected tetap dynamic di layout group-nya
- Metadata halaman utama (`src/app/[locale]/page.tsx`) kini mengambil locale dari route params, bukan hardcode

### Added

- Fondasi Zustand store: `src/stores/auth.store.ts` dan `src/stores/filter.store.ts`
- Unit test untuk BullMQ worker processors dan scheduler (`src/workers/__tests__/`)

### Changed

- Semua seed script mendapatkan graceful shutdown handler (SIGINT/SIGTERM)
- Format `REDIS_URL` di `.env.example` ditambah komentar contoh format ioredis dan peringatan tidak pakai REST format
- `axios` dipertahankan dengan komentar alasan di `src/lib/axios.ts` (interceptor CSRF, 401 handling, payment gateway modules)

### Security

- Tidak ada `dotenv` di runtime Next.js (`src/app/`, middleware, instrumentation); hanya dipakai di CLI scripts dan worker yang berjalan di luar Vercel

### Added

- Idempotency guard pada 4 job cron: cleanup-bookings, complete-bookings, saved-search-matcher, update-area-counts
- Job cron ke-5: `process-expired-refunds` untuk auto-refund booking expired sebelum start date
- Webhook IP allowlist kini fail-closed: provider tanpa entry di `ALLOWED_WEBHOOK_IPS` otomatis ditolak dan dilaporkan via `logSecurityEvent`
- Seluruh `console.*` di `src/actions/` dan komponen client terpilih diganti `logError`/`captureException` sesuai konteks
- Route admin demographics kini menggunakan `validateAdminOnlyRequest` konsisten dengan 30+ route admin lainnya
- 14 lokasi `as any` untuk typed routes diganti helper `localeHref()` di `src/lib/i18n.ts`
- `generateMetadata` pada halaman detail properti untuk SEO
- Komponen `<JsonLd>` dan schema structured data (Organization, LodgingBusiness, BreadcrumbList)

### Fixed

- Hapus dead code `src/lib/audit-logger.ts` (nol call site, fungsi `logAudit()` diganti `createAuditLog()` di `src/lib/audit-log.ts`)
- `sitemap.ts` kini generate URL untuk semua 8 locale, bukan cuma `id`; hapus fallback env var `NEXT_PUBLIC_APP_URL1` yang typo
- Hapus `apps/web/bun.lock` stale; sekarang hanya ada `bun.lock` di root monorepo
- Rewrite `Dockerfile.worker` agar build dari root context monorepo (bukan `apps/web`), dengan copy workspace manifests terpisah dan install dependencies via root lockfile
- Tambah `output: "standalone"` ke `next.config.ts` agar `Dockerfile` dan `Dockerfile.worker` konsisten
- Perbaiki instruksi Redis di `AGENTS.md`: ganti `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` → `REDIS_URL` (format ioredis/TCP)
- Tambah section "Deployment Worker ke Render" di `docs/DEPLOYMENT.md`

> **Catatan environment:** Full `bun run build` tidak dapat diselesaikan di sandbox karena masalah dependency pre-existing (moduleNotFound pada `zod` locales dan `recharts`/`es-toolkit`). `tsc --noEmit` dan `bun run lint` berhasil hijau. Test suite menjalankan 207 test lolos, 1 gagal timeout (pre-existing di `idempotency.test.ts`), dan 17 suite gagal load module (pre-existing dependency resolution issues). Jalankan `bun install && bun run build` di environment lokal sebelum deploy.

---

## [0.1.0] - 2026-08-14

### Added

- Inisialisasi proyek dengan Next.js 16 App Router
- Autentikasi dengan Better Auth (Email + Google OAuth)
- Manajemen properti (CRUD) untuk Owner
- Sistem booking dengan DP 35% dan pelunasan 65%
- Integrasi payment gateway: Doku, iPaymu, Nicepay
- Verifikasi KYC untuk Owner
- Sistem review dan rating dua arah
- Multi-bahasa: ID, EN, MY, TH, VI, KO, ZH, RU
- Pencarian properti dengan filter dan peta interaktif (Leaflet)
- Upload gambar dengan kompresi otomatis (Uploadthing + Cloudinary)
- Notifikasi real-time (In-app + Web Push)
- AI Assistant chatbot (OpenRouter)
- Dashboard Owner dengan analitik
- Dashboard Admin dengan manajemen user, properties, dan payments
- Maintenance ticketing system
- PWA support dan push notifications
- Redis-backed rate limiting
- Audit logging untuk aksi sensitif
- CSRF protection untuk API mutations
- Webhook signature verification (HMAC-SHA256)
- Encryption untuk payment gateway credentials
- Security audit dan hardening

### Changed

- Refactor route structure dan konsolidasi page components
- Implementasi server-side route protection untuk admin
- Penyederhanaan global error page ke plain HTML

### Security

- Hardcoded auth secret fallback dipertimbangkan untuk removal
- Staff role restriction pada payment gateway endpoints
- Zod validation pada admin endpoints
- SQL injection mitigation pada properties search
- Sensitive data exposure mitigation

---

## [0.0.1] - 2026-08-01

### Added

- Initial commit dari Create Next App
- Setup dasar project structure
- Konfigurasi TypeScript, Tailwind CSS, dan ESLint
- Konfigurasi Drizzle ORM dengan PostgreSQL
- Setup Better Auth dengan Drizzle adapter
