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
