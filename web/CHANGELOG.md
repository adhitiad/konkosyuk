# Changelog

Semua perubahan penting pada proyek ini akan didokumentasikan di file ini.

Format berbasis [Keep a Changelog](https://keepachangelog.com/ID/1.0.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [Unreleased]

### Added

- Sistem security event logging untuk auth flows
- Webhook IP allowlist untuk Doku, iPaymu, dan Nicepay
- Payment amount tampering protection di webhook handler
- Webhook replay protection via payload hash storage
- Testing infrastructure: Vitest + React Testing Library
- E2E testing dengan Playwright
- Code coverage reporting dengan threshold minimum

### Changed

- Migrasi iPaymu signature dari MD5 ke HMAC-SHA256
- Session configuration: `expiresIn` 7 hari, `updateAge` 1 hari
- Password policy: minimum 8 karakter
- Email verification required untuk semua user

### Fixed

- CSRF protection dengan httpOnly + strict cookie
- Admin webhook reprocess dengan signature re-verification
- Account linking memerlukan email terverifikasi
- Error message sanitization untuk menghindari information leakage
- Mass assignment protection di admin user update

### Security

- TwoFactor plugin dengan TOTP + account lockout
- Security headers: COOP, COEP, X-Permitted-Cross-Domain-Policies, X-Download-Options
- Trusted origins expansion untuk production
- Public rate limiting (60 req/min) pada endpoint properties

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
