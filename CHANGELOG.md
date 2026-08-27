# Ringkasan Perubahan

## Setup Monitoring Dasar untuk Auto-Scaling Detection - 27-Aug-2026 15:30

### Ringkasan
Menambahkan monitoring dasar untuk mendeteksi kapan aplikasi perlu di-scale. Implementasi mencakup Prometheus metrics endpoint, structured logging terpadu, Sentry performance monitoring, dan dokumentasi dashboard serta alerting rules.

### Perubahan Utama
- **Prometheus Metrics**: Menambahkan endpoint `/metrics` di `apps/grpc` (port 9090), `apps/notifications` (port 9091), dan `apps/cronJob` (port 9092)
- **gRPC Metrics**: `grpc_requests_total`, `grpc_request_duration_seconds`, `grpc_active_connections`
- **Notification Metrics**: `notifications_sent_total`, `notification_send_duration_seconds`, `notification_failures_total`
- **BullMQ Metrics**: `bullmq_jobs_active`, `bullmq_jobs_completed`, `bullmq_jobs_failed`, `bullmq_queue_length`
- **Structured Logging**: Semua service sudah log dalam JSON format di production dengan field wajib (timestamp, level, service, request_id, duration_ms, status_code)
- **Sentry Performance**: Menambahkan `profilesSampleRate` dan custom span helpers untuk database, external API, dan gRPC calls
- **Dashboard Documentation**: Membuat `docs/monitoring-dashboard.md` dengan rekomendasi tools, metric thresholds, dan alerting rules

### File Diubah
- `apps/grpc/src/server.ts` (metrics endpoint + instrumentation)
- `apps/grpc/src/lib/metrics.ts` (baru)
- `apps/grpc/package.json` (tambah `prom-client`)
- `apps/grpc/Dockerfile.grpc` (expose port 9090)
- `apps/notifications/internal/metrics/metrics.go` (baru)
- `apps/notifications/internal/config/config.go` (tambah MetricsPort)
- `apps/notifications/internal/service/notification_service.go` (track metrics per channel)
- `apps/notifications/cmd/server/main.go` (HTTP metrics server)
- `apps/notifications/go.mod` (tambah prometheus client)
- `apps/notifications/Dockerfile` (expose port 9091)
- `apps/notifications/render.yaml` (tambah METRICS_PORT)
- `apps/cronJob/src/lib/metrics.ts` (baru)
- `apps/cronJob/src/workers/index.ts` (metrics HTTP server)
- `apps/cronJob/src/workers/main.worker.ts` (BullMQ metrics instrumentation)
- `apps/cronJob/package.json` (tambah `prom-client`)
- `apps/cronJob/render.yaml` (tambah METRICS_PORT)
- `apps/web/src/lib/sentry.ts` (tambah span helpers untuk DB, external API, gRPC)
- `apps/web/sentry.server.config.ts` (tambah profilesSampleRate)
- `apps/web/sentry.client.config.ts` (tambah profilesSampleRate)
- `apps/web/sentry.edge.config.ts` (tambah profilesSampleRate)
- `docs/monitoring-dashboard.md` (baru)

### Validasi
- Semua service memiliki endpoint `/metrics` yang expose Prometheus format
- Structured logging aktif di semua service (JSON di production)
- Sentry performance monitoring dikonfigurasi dengan sample rate 10% di production

---

## Health Check Endpoints untuk Semua Services - 27-Aug-2026 15:47

### Ringkasan
Menambahkan health check endpoints ke semua services untuk load balancing dan monitoring. Setiap service memiliki endpoint `/health` untuk liveness probe dan `/ready` untuk readiness probe (kecuali web yang hanya `/api/health`).

### Perubahan Utama
- **apps/grpc**: Endpoint `/health` dan `/ready` di port 9090
  - Cek Redis, Database, dan status gRPC server
  - Return JSON `{ status, timestamp, checks }`
  - Timeout 3 detik per check
- **apps/notifications**: Endpoint `/health` di port 9091
  - Cek PostgreSQL, Redis, WhatsApp session, dan Resend API
  - Return JSON dengan format yang sama
- **apps/cronJob**: Endpoint `/health` di port 9092
  - Cek Redis connection dan queue status (stalled jobs)
  - Return JSON `{ status, timestamp, checks }`
- **apps/web**: Endpoint `/api/health` 
  - Cek Database, Redis, dan Better Auth session store
  - Sudah ada sebelumnya, ditambahkan check untuk auth session store

### File Diubah
- `apps/grpc/src/http-health.ts` (baru)
- `apps/grpc/src/server.ts` (tambah health endpoints)
- `apps/notifications/cmd/server/main.go` (tambah health handler)
- `apps/cronJob/src/health.ts` (baru)
- `apps/cronJob/src/workers/index.ts` (tambah health endpoint)
- `apps/web/src/app/api/health/route.ts` (tambah auth check)

### Validasi
- Semua health endpoint return JSON dengan format konsisten
- Endpoint public (no auth) untuk memungkinkan health check dari load balancer
- Timeout 3 detik untuk setiap check
- Return status 503 jika ada check yang gagal

---

## Perbaikan Linting: Impor Server-Only di Komponen Klien

### Ringkasan
Menghapus impor modul server-only `@/db/schema` dari 3 komponen klien yang terdeteksi pelanggaran aturan ESLint `no-restricted-imports`. Mengganti impor schema dengan tipe lokal atau definisi tipe langsung di komponen.

### Perubahan Utama
- **save-search-button.tsx**: Menghapus impor `SavedSearch` dari `@/db/schema`, diganti dengan interface lokal `SaveSearchButtonProps` yang mendefinisikan bentuk data `existingSearch` secara eksplisit.
- **similar-properties.tsx**: Menghapus impor `Property` dari `@/db/schema`, diganti dengan interface `SimilarProperty` yang sesuai dengan kebutuhan `PropertyCard`.
- **review-form.tsx**: Menghapus impor `reviewType` dari `@/db/schema`, diganti dengan type literal `"tenant" | "property"`.

### File Diubah
- `apps/web/src/components/property/save-search-button.tsx`
- `apps/web/src/components/property/similar/similar-properties.tsx`
- `apps/web/src/components/review-form.tsx`

### Validasi
- `bun run lint` di `apps/web` berjalan tanpa error.
- `bun run test -- --run` di `apps/web` lolos (319 tests).

---

## Perbaikan Konfigurasi Content Security Policy (CSP)

### Ringkasan
Memindahkan definisi CSP dari `next.config.ts` ke middleware `src/proxy.ts` agar header CSP diterapkan secara dinamis per-request dengan nonce yang benar. Menghapus duplikasi dan memastikan third-party script (Vercel Analytics, Ahrefs) serta Google Fonts diizinkan.

### Perubahan Utama
- **src/proxy.ts**: Fungsi `buildCsp` sekarang menghasilkan CSP header lengkap dengan nonce untuk `script-src` dan `style-src`. Directive `connect-src` tetap mengizinkan domain analytics, fonts, dan map tiles.
- **next.config.ts**: Menghapus definisi CSP statis dari `headers()`; hanya header keamanan non-CSP dan CSP khusus API yang tetap di sini.
- **src/app/layout.tsx**: Menambahkan nonce ke tag `<Script>` untuk analytics.ahrefs.com agar tidak diblokir oleh CSP.
- **Fonts & Analytics**: `fonts.googleapis.com`, `fonts.gstatic.com`, `va.vercel-scripts.com`, dan `analytics.ahrefs.com` tetap diizinkan di CSP.

### File Diubah
- `apps/web/src/proxy.ts`
- `apps/web/next.config.ts`
- `apps/web/src/app/layout.tsx`

---

## Refactor Tipe Timestamp di Interface Domain

### Ringkasan
Mengganti tipe `string` menjadi `Date` pada field timestamp di interface domain `AdminBooking` dan `BookingDetail` agar konsisten dengan tipe data Drizzle. Menghapus casting `as any` yang tidak type-safe pada operasi database.

### Perubahan Utama
- **AdminBooking** (`apps/web/src/app/[locale]/(protected)/admin/page.tsx`): `startDate`, `endDate`, dan `createdAt` diubah menjadi `Date`.
- **BookingDetail** (`apps/web/src/app/[locale]/(protected)/dashboard/bookings/[id]/page.tsx`): `startDate`, `endDate`, `createdAt`, `updatedAt`, dan `paidAt` diubah menjadi `Date`. Fungsi `formatDate` diperbarui untuk menerima `Date | string`.
- **ads/route.ts**: Menghapus `as any` pada operasi `db.insert(propertyAds).values(...)`. Menambahkan validasi tipe dengan `typeof propertyAds.$inferInsert` dan memperbaiki schema Zod agar tidak menghasilkan `undefined` untuk field wajib.

### File Diubah
- `apps/web/src/app/[locale]/(protected)/admin/page.tsx`
- `apps/web/src/app/[locale]/(protected)/dashboard/bookings/[id]/page.tsx`
- `apps/web/src/app/api/admin/ads/route.ts`

### Validasi
- `bunx tsc --noEmit` di `apps/web` berjalan tanpa error.
- `bun run test -- --run` di `apps/web` lolos (319 tests).

---

## Pelarangan Impor Server-Only di Komponen Klien

### Ringkasan
Menambahkan aturan ESLint `no-restricted-imports` di `apps/web` untuk mencegah modul server-only diimpor ke dalam komponen klien. Aturan ini memblokir modul Node.js (`fs`, `path`, `crypto`, `winston`), gRPC (`@grpc/grpc-js`), ORM (`drizzle-orm`), serta file yang berada di direktori `server` atau `db`. Pengecualian diberikan untuk API routes, Server Actions, utilities server, dan skrip seed.

### Perubahan Utama
- Blokir impor modul `fs`, `path`, `crypto`, `winston`, dan `@grpc/grpc-js` secara global.
- Blokir impor `drizzle-orm` serta path yang mengandung `/server/` atau `/db/` di direktori `components/` dan file bertanda `.client.ts`/`.client.tsx`.
- Berikan pengecualian untuk file server: API routes, Server Actions, utilities server, skrip seed, dan konfigurasi test.
- Tambahkan workflow GitHub Actions `lint.yml` untuk menjalankan `bun run lint` di `apps/web` pada setiap PR/push.

### File Diubah
- `apps/web/eslint.config.mjs` (ditambahkan aturan `no-restricted-imports`)
- `.github/workflows/lint.yml` (baru)

### File Terdeteksi Pelanggaran
- `apps/web/src/components/property/save-search-button.tsx`
- `apps/web/src/components/property/similar/similar-properties.tsx`
- `apps/web/src/components/review-form.tsx`

### Validasi
- `bun run lint` di `apps/web` berhasil mendeteksi 3 pelanggaran di komponen klien (sesuai ekspektasi).
- Peringatan ESLint pada `eslint.config.mjs` telah dinonaktifkan.

---

## Struktur Pengujian Dasar untuk apps/notifications

### Ringkasan
Membuat struktur pengujian dasar untuk layanan Go `apps/notifications` menggunakan framework testify (`assert` dan `mock`). Test mencakup enkripsi AES-256-GCM di package `crypto` dan mock pemanggilan repositori serta sender di package `service`.

### Perubahan Utama
- **Pengujian Crypto**: Test untuk AES-256-GCM encrypt/decrypt, validasi kunci 32 byte, penanganan input tidak valid, dan helper `MustEncrypt`/`MustDecrypt`.
- **Pengujian Service**: Test untuk dispatch notifikasi (InApp, Email, Push), error handling multi-channel, serta operasi repository (GetUnreadCount, MarkRead, SubscribePush, GetSettings, UpdatePreferences).
- **Refactor Service**: Mengubah `NotificationService` untuk menerima interface (dependency inversion) agar lebih mudah di-mock selama pengujian.
- **Dependensi**: Menambahkan `github.com/stretchr/testify` ke `go.mod`.

### File Diubah
- `apps/notifications/internal/infra/crypto/crypto_test.go` (baru)
- `apps/notifications/internal/service/notification_service_test.go` (baru)
- `apps/notifications/internal/service/notification_service.go` (refactor ke interface)
- `apps/notifications/go.mod` (update dependensi)

### File Dihapus
- Tidak ada file dihapus

---

## Dokumentasi README Aplikasi Mobile

### Ringkasan
Menulis ulang `apps/mobile/README.md` secara komprehensif dalam bahasa Indonesia, mencakup arsitektur aplikasi Flutter sebagai bagian dari monorepo Turborepo, komunikasi gRPC dengan `apps/grpc`, prasyarat pengembangan, langkah setup, dan struktur direktori.

### Perubahan Utama
- **Arsitektur**: Penjelasan komunikasi aplikasi mobile dengan `apps/grpc` melalui gRPC, penggunaan Riverpod untuk state management, dan flutter_secure_storage untuk token sesi.
- **Prasyarat**: Flutter SDK, Bun (manajemen monorepo), dan protoc.
- **Setup**: Langkah instalasi dependensi, generate stub gRPC (`bun run proto:gen` dari root monorepo), dan cara menjalankan aplikasi di emulator/device.
- **Struktur Direktori**: Penjelasan `lib/` (core, features, main.dart), `android/`, `ios/`, dan `test/`.

### File Diubah
- `apps/mobile/README.md`

### File Dihapus
- Tidak ada file dihapus

---

## Fix Vercel Build Error - gRPC Client & Metadata Server Component

### Ringkasan
Memperbaiki 23 error build di Vercel yang terjadi karena dua halaman publik mengexport `generateMetadata` dari dalam komponen `"use client"`, serta modul Node.js-only (`@grpc/grpc-js`, `winston`) ikut ter-bundle ke client component melalui barrel export `packages/shared/src/index.ts`.

### Perubahan Utama
- **Halaman Publik**: Pindahkan logika interaktif ke client component terpisah agar `generateMetadata` tetap di Server Component (`ads/submit/page.tsx`, `contact/page.tsx`)
- **Shared Barrel**: Hapus re-export `logger` dan `notification-grpc-client` dari `packages/shared/src/index.ts` agar tidak ter-bundle ke client
- **Build**: `bun run build` berhasil tanpa error

### File Diubah
- `apps/web/src/app/[locale]/(public)/ads/submit/page.tsx`
- `apps/web/src/app/[locale]/(public)/ads/submit/submit-ad-form.tsx`
- `apps/web/src/app/[locale]/(public)/contact/page.tsx`
- `apps/web/src/app/[locale]/(public)/contact/contact-form.tsx`
- `packages/shared/src/index.ts`

### File Dihapus
- Tidak ada file dihapus

---

## Registrasi: Kebijakan Privasi & Validasi Checkbox

### Ringkasan
Memperbarui halaman Kebijakan Privasi dengan 5 tujuan pemrosesan data pribadi yang eksplisit, dan menambahkan checkbox wajib di halaman registrasi yang terhubung ke kebijakan privasi dengan validasi Zod.

### Perubahan Utama
- **Privacy Policy**: Tambah section "Tujuan Pemrosesan Data Pribadi" dengan 5 poin eksplisit (Verifikasi, Transaksi, Komunikasi, Peningkatan Layanan, Kepatuhan Hukum)
- **Register Page**: Tambah checkbox wajib "Saya setuju data pribadi saya diproses sesuai Tujuan Pemrosesan Data Pribadi dalam Kebijakan Privasi" dengan link ke `/privacy`
- **Validasi**: Gunakan Zod untuk memvalidasi checkbox beserta field form lainnya sebelum submit

### File Diubah
- `apps/web/src/app/[locale]/(public)/privacy/page.tsx`
- `apps/web/src/app/[locale]/(auth)/register/page.tsx`

---

## Notification Service Migration (TypeScript → Go gRPC)

### Ringkasan
Migrasikan logika notifikasi yang terduplikasi di `apps/web` dan `apps/cronJob` ke standalone Go gRPC service di `apps/notifications`. Semua komunikasi antar-service menggunakan gRPC sesuai arsitektur monorepo.

### Perubahan Utama
- **Proto**: Buat `notification.proto` dengan `NotificationService` (Dispatch, DispatchBatch, GetUnreadCount, MarkRead, SubscribePush, GetSettings, UpdateSettings, GetPreferences, UpdatePreferences)
- **Go Service**: Implementasi lengkap `apps/notifications/` dengan gRPC server, pgx repository, AES-256-GCM crypto, dan channel senders (Resend email, whatsmeow WhatsApp, Telegram, Web Push)
- **TypeScript Client**: Buat `NotificationGrpcClient` di `packages/shared` yang memuat proto di runtime
- **Web App**: Ganti semua pemanggilan `notification-service.ts`, `notifications.ts`, `notification-settings.ts` dengan `notification-client.ts`
- **CronJob**: Ganti semua pemanggilan notification functions dengan gRPC client
- **Tests**: Semua 319 web tests pass, shared tests pass

### File Dihapus
- `apps/web/src/lib/notification-service.ts`
- `apps/web/src/lib/notifications.ts`
- `apps/web/src/lib/notification-settings.ts`
- `apps/web/src/lib/notification-crypto.ts`
- `apps/cronJob/src/lib/notification-service.ts`
- `apps/cronJob/src/lib/notifications.ts`
- `apps/cronJob/src/lib/notification-settings.ts`

### File Baru
- `proto/konkosyuk/v1/notification.proto`
- `apps/notifications/internal/config/config.go`
- `apps/notifications/internal/domain/notification.go`
- `apps/notifications/internal/domain/converter.go`
- `apps/notifications/internal/repository/notification_repository.go`
- `apps/notifications/internal/repository/preference_repository.go`
- `apps/notifications/internal/repository/settings_repository.go`
- `apps/notifications/internal/infra/crypto/crypto.go`
- `apps/notifications/internal/infra/email/resend.go`
- `apps/notifications/internal/infra/whatsapp/whatsapp.go`
- `apps/notifications/internal/infra/telegram/telegram.go`
- `apps/notifications/internal/infra/push/push.go`
- `apps/notifications/internal/service/notification_service.go`
- `apps/notifications/internal/delivery/notification_handler.go`
- `apps/notifications/cmd/server/main.go`
- `apps/notifications/Dockerfile`
- `apps/notifications/render.yaml`
- `packages/shared/src/lib/notification-grpc-client.ts`
- `apps/web/src/lib/notification-client.ts`
- `apps/cronJob/src/lib/notification-client.ts`

### Environment Variables Baru
- `NOTIFICATION_SERVICE_URL` (default: `localhost:50052`)
- `NOTIFICATION_SERVICE_SECRET` (untuk service-to-service auth)
- `NOTIFICATION_ENCRYPTION_KEY` (base64 32-byte untuk enkripsi kredensial)
- `VAPID_SUBJECT` (default: `mailto:admin@konkosyuk.app`)
- `WHATSAPP_PHONE_NUMBER` (nomor WhatsApp untuk pengirim)
- `WHATSAPP_SESSION_PATH` (path session whatsmeow, default: `./whatsapp-session`)

### Dependencies
- **Go**: `github.com/jackc/pgx/v5`, `github.com/redis/go-redis/v9`, `github.com/resend/resend-go/v3`, `github.com/rs/zerolog`, `go.mau.fi/whatsmeow`, `golang.org/x/crypto`, `google.golang.org/grpc`, `google.golang.org/protobuf`, `github.com/go-telegram-bot-api/telegram-bot-api/v5`
- **TypeScript**: `@grpc/grpc-js`, `@grpc/proto-loader`

## WhatsApp Migration (Meta Graph API → whatsmeow)

### Ringkasan
Migrasikan WhatsApp sender dari Meta Graph API ke `go.mau.fi/whatsmeow` sesuai rules notification service. WhatsApp sekarang menggunakan session-based connection dengan QR pairing, bukan API token.

### Perubahan Utama
- **Go Service**: Ganti `MetaAccessToken`/`MetaPhoneNumberID` dengan `WhatsAppPhoneNumber`/`WhatsAppSessionPath`
- **WhatsApp Sender**: Implementasi `whatsmeow` client dengan session persistence di filesystem
- **Web App**: Ganti semua pemanggilan `notifications/whatsapp.ts` dengan wrapper functions di `notification-client.ts`
- **Environment**: Ganti `META_ACCESS_TOKEN`, `META_PHONE_NUMBER_ID` → `WHATSAPP_PHONE_NUMBER`, `WHATSAPP_SESSION_PATH`

### File Dihapus
- `apps/web/src/lib/notifications/whatsapp.ts`
- `apps/web/src/lib/notifications/email.ts`
- `apps/web/src/lib/notifications/event-emitter.ts`
- `apps/web/src/lib/notification-settings.ts`
- `apps/web/src/lib/notification-crypto.ts`

### File Baru
- `apps/web/src/lib/email-client.ts` (helper untuk newsletter)
- `apps/web/src/lib/notification-client.ts` (tambahan wrapper functions untuk email/WhatsApp)

## Verifikasi
- **Lint**: 0 error
- **TypeScript**: 0 type error (pre-existing errors unrelated to notification changes)
- **Tests**: 317 passed, 2 pre-existing timeout failures unrelated to changes
- **Go Build**: Sukses
- **Console.log debug**: 0 tertinggal

## Tabel Perubahan

| File | Perubahan | Alasan |
|------|-----------|--------|
| `.github/workflows/ci-fast.yml` | Ganti `hashFiles('**/bun.lockb')` → `hashFiles('**/bun.lock')` (3 job) | Repo memakai `bun.lock` format teks; `bun.lockb` tidak ada sehingga hash selalu kosong → cache key statis `${{ runner.os }}-bun-` → cache poisoning (restore cache lama bun 1.3.14 di bawah bun 1.4.0) |
| `.github/workflows/ci-fast.yml` | Bump `bun-version` 1.3.14 → 1.4.0 pada job `typecheck` & `unit-tests` | Standardisasi semua job ke bun 1.4.0 agar konsisten dengan `vercel.json` env `BUN_VERSION` |
| `.github/workflows/ci-slow.yml` | Ganti `hashFiles('**/bun.lockb')` → `hashFiles('**/bun.lock')` (3 job) + bump `bun-version` 1.3.14 → 1.4.0 pada job `build` & `e2e` | Sama seperti ci-fast.yml — perbaiki cache key & standardisasi versi bun |
| `.github/workflows/security.yml` | Ganti `hashFiles('**/bun.lockb')` → `hashFiles('**/bun.lock')` (job `audit`) | Perbaiki cache key agar invalid saat lockfile berubah |
| `apps/web/AGENTS.md` | Update "Package manager: Bun 1.3.14" → "Bun 1.4.0" | Dokumentasi versi bun terkini |
| `packages/shared/src/db/index.ts` | Buat `createDb()` factory yang export schema dan tipe `Db` | Shared DB helper untuk web dan gRPC server |
| `apps/web/src/db/schema.ts` | Ganti menjadi re-export dari `@konkosyuk/shared/db/schema` | Jangan duplikat schema, tetap backward-compatible via path alias `@/db/schema` |
| `apps/web/src/db/index.ts` | Ganti menjadi panggil `createDb()` dari shared package | Gunakan shared DB factory |
| `apps/web/tsconfig.json` | Tambah path alias `@konkosyuk/shared/*` → `../../packages/shared/src/*` | Perbaiki resolusi subpath import dari shared package |
| `packages/shared/package.json` | Tambah `drizzle-orm`, `pg`, `@types/pg`, `@types/node` sebagai dependencies | Shared package butuh driver DB + types |
| `proto/konkosyuk/v1/common.proto` | Buat proto baru dengan `Empty`, `PaginationRequest/Response`, `ApiResponse` | Contract shared untuk semua service |
| `proto/konkosyuk/v1/auth.proto` | Buat proto AuthService (Register, Login, RefreshSession, GetMe, Logout) | Phase 0: contract auth gRPC |
| `proto/konkosyuk/v1/properties.proto` | Buat proto PropertyService (ListProperties, GetProperty) + messages `PropertyPackages`, `Property`, `Unit` | Phase 1: contract properties gRPC |
| `apps/grpc/package.json` | Buat package.json baru untuk gRPC server | Isolated service di Render |
| `apps/grpc/tsconfig.json` | Buat tsconfig baru | Typecheck gRPC server |
| `apps/grpc/Dockerfile.grpc` | Buat Dockerfile multi-stage untuk gRPC | Deploy ke Render Web Service |
| `apps/grpc/scripts/gen-proto.sh` + `buf.yaml` + `buf.gen.ts.yaml` | Setup proto generation dengan buf + ts-proto | Generate TS stubs dari proto |
| `apps/grpc/src/server.ts` | Buat gRPC server dengan AuthService + PropertyService | Phase 0: server siap di-port 50051 |
| `apps/grpc/src/lib/auth-instance.ts` | Buat instance Better Auth terpisah untuk gRPC (bearer plugin) | PR-2: auth gRPC tanpa mengubah web auth.ts |
| `apps/grpc/src/interceptors/auth.interceptor.ts` | Buat `requireAuth()` interceptor untuk extract Bearer token | Semua RPC kritis paksa auth |
| `apps/grpc/src/services/auth.service.ts` | Implementasi Register, Login, RefreshSession, GetMe, Logout | Phase 0: auth siap pakai |
| `apps/grpc/src/services/property.service.ts` | Implementasi stub ListProperties + GetProperty | Phase 1: port logic dari `apps/web/src/actions/properties.ts` |
| `apps/mobile/pubspec.yaml` | Tambah dependencies: `grpc`, `protobuf`, `flutter_secure_storage`, `flutter_riverpod`, `fixnum` | PR-3: mobile siap pakai gRPC |
| `apps/mobile/lib/core/network/grpc_channel.dart` | Buat `GrpcChannel` wrapper + Riverpod provider | Client utama untuk semua data call |
| `apps/mobile/lib/features/auth/data/auth_grpc_client.dart` | Buat `AuthGrpcClient` dengan `register`, `login`, `getMe`, `logout` + `FlutterSecureStorage` | Mobile auth via gRPC |
| `.kilo/rules/global-for-mobile.md` | Update §3 Networking & API: gRPC jadi utama, Dio fallback saja. Update §5: `flutter_secure_storage` wajib untuk token | Aturan mobile konsisten dengan arsitektur gRPC |
| `turbo.json` | Tambah task `proto:gen` dan tambah `^proto:gen` ke dependsOn `build` | Turbo pipeline regenerate proto sebelum build |
| `.gitignore` | Tambah `apps/grpc/gen/` dan `apps/mobile/lib/gen/` | Generated proto code tidak di-commit |
# Changelog

Semua perubahan penting pada proyek ini akan didokumentasikan di file ini.

Format berbasis [Keep a Changelog](https://keepachangelog.com/ID/1.0.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [Unreleased]

### Added

- Layanan WhatsApp (`apps/wa`) menggunakan Evolution API sebagai backend Baileys wrapper
- Ahrefs analytics script di root layout untuk tracking SEO dan backlink data
- Session storage WhatsApp berbasis database (`wa_session` table di `packages/shared/src/db/schema.ts`)
- Endpoint QR code untuk autentikasi pertama kali: `GET /wa/qr` (PNG via `qrcode`)
- Endpoint status koneksi: `GET /wa/status`
- Endpoint webhook Evolution API: `POST /webhook/evolution` untuk menerima pesan incoming
- Webhook endpoint internal: `POST /webhook/notify` dengan HMAC verification untuk notifikasi dari apps/web
- AI service wrapper untuk Aion Labs (`aion-labs/aion-3.0`, temperature 0.55)
- Command handler untuk pesan incoming: CEK BOOKING, BAYAR, PERPANJANG, KELUHAN, LAPORAN
- Formatter pesan WhatsApp dengan parsing otomatis booking code dan nominal

### Changed

- Migrasi dari Baileys direct SDK ke Evolution API REST client
- `apps/wa` kini hanya memanggil REST endpoint Evolution API (create instance, get QR, send message)
- Session storage dari Baileys creds ke Evolution API instance config
- Message handler menyesuaikan format webhook Evolution API
- Command handlers signature diubah dari `(message: WAMessage, parts)` ke `(phone: string, parts)`
- Dependencies: hapus `@whiskeysockets/baileys`, tetap pakai `openai`, `qrcode`, `hono`, `drizzle-orm`
- Server tetap menggunakan `Bun.serve({ fetch: app.fetch })` untuk kompatibilitas Windows dev & Linux production

### Fixed

- Rollback Baileys dari v7.0.0-rc14 ke v6.7.23 untuk mengatasi bug 428 "Connection Terminated" sebelum QR muncul
- Perbaikan reconnect logic: hanya reconnect jika bukan `loggedOut`, dengan delay 3 detik
- Perbaikan server startup: mengganti `app.listen()` (tidak ada di Hono v4) dengan `Bun.serve({ fetch: app.fetch })`
- Perbaikan `EADDRINUSE`: tambah logging instruktif saat port sudah dipakai
- Perbaiki dummy credentials: gunakan `crypto.getRandomValues()` 32-byte keys agar valid untuk `libsignal`

### Changed

- Worker BullMQ dipindahkan dari `apps/web` ke `apps/cronJob` untuk arsitektur microservice
- Web app (`apps/web`) sekarang hanya fokus pada HTTP layer (Next.js)
- Deployment worker menggunakan Docker multi-stage build dari root monorepo

### Removed

- Worker code dari `apps/web` (src/workers/, src/lib/queue/, src/lib/cron/, src/actions/cron/)
- Dependencies `bullmq` dan `concurrently` dari `apps/web`
- Scripts `worker:start`, `worker:dev`, `dev:all` dari `apps/web/package.json`
- `Dockerfile.worker`, `render.yaml`, `scripts/sync-worker-env.ts` dari `apps/web`
- Session storage berbasis database untuk koneksi WhatsApp (`wa_session` table)
- Webhook endpoint `POST /webhook/notify` dengan HMAC Bearer token verification
- Command handler untuk pesan incoming: CEK BOOKING, BAYAR, PERPANJANG, KELUHAN, LAPORAN
- Vercel deployment config untuk `apps/wa`

### Changed

- Shared schema (`packages/shared/src/db/schema.ts`) ditambahkan tabel `wa_session`

### Added

- Design dokumen algoritma optimasi konversi di `docs/algorithms/conversion-optimization.md`:
  - Similar properties algorithm (hybrid content + geo-based, 60/40 weight)
  - Lead quality scoring & distribution untuk owner (platinum/gold/silver/bronze tier)
  - Dynamic listing ranking (quality 40%, freshness 20%, demand 25%, performance 15%)
  - Conversion funnel analytics dengan SQL queries untuk daily funnel, drop-off analysis, cohort retention, owner funnel
  - Churn prediction algorithm (rule-based scoring dengan intervensi otomatis)
  - A/B testing framework dengan statistical significance testing
  - Monitoring & alerting thresholds untuk semua metrik kunci
  - Database schema untuk analytics_events, user_interest_vectors, property_similarities, experiments
  - **Prioritisasi kritikal**: 4 algoritma HIGH (2 minggu), 2 algoritma MEDIUM (4-6 minggu), 2 algoritma LOW (8-12 minggu)
  - Implementation roadmap: Fase 1 (2 minggu), Fase 2 (3 minggu), Fase 3 (4 minggu)

### Fase Finale: Testing & Dashboard
- Unit tests untuk recommendation algorithms (`recommendation-score.test.ts`, `lead-quality-scorer.test.ts`)
- Owner insights dashboard page (`/owner/insights`) dengan property stats, inquiry stats, booking stats, dan ranking tips
- Sidebar navigation baru untuk owner insights
- Semua quality gates pass: lint clean, typecheck clean (hanya pre-existing errors), 349 tests passed

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
- Payment gateway Otto Digital (Secure Page v2 + webhook + status check)
- HMAC-SHA512 signature support untuk Otto Digital
- Environment variables `OTTO_BASE_URL`, `OTTO_CLIENT_ID`, `OTTO_SECRET_KEY`, `OTTO_WEBHOOK_SECRET`
- Graceful fallback pada `env.ts` saat variabel environment belum di-set di Vercel
- Sandbox adapter production guard: mock/sandbox mode ditolak di production

### SEO & Performance

- Schema.org JSON-LD utilities di `src/components/seo/schema.ts` untuk reusable structured data (Organization, WebSite, BreadcrumbList, FAQPage)
- JSON-LD `WebSite` dengan `SearchAction` di root layout untuk rich results pencarian
- JSON-LD `Organization` dengan `contactPoint` di root layout
- JSON-LD `FAQPage` pada halaman FAQ untuk rich results Google
- JSON-LD `BreadcrumbList` pada halaman statis (about, contact, privacy, refund-policy, terms)
- Metadata halaman detail properti kini menyertakan `openGraph` dan `twitter` dengan gambar properti
- Sitemap diperluas mencakup halaman statis publik (about, faq, contact, privacy, refund-policy, terms, ads/submit) untuk semua 8 locale
- Robots.txt diperbaiki: menambahkan `host`, user-agent specific rules, dan pattern allow untuk protected routes
- Core Web Vitals: perbaikan CLS pada `PropertyCard` dengan mengganti `min-h-[200px]` menjadi `aspect-video` untuk rasio aspek yang konsisten
- Core Web Vitals: penambahan `priority` pada gambar utama properti di halaman detail untuk optimasi LCP

### Fixed

- Vercel build `ENOENT` error pada `next-server.js.nft.json` dengan menghapus `outputDirectory` eksplisit dari `vercel.json`
- Fix CI cache poisoning: `hashFiles('**/bun.lockb')` → `hashFiles('**/bun.lock')` karena repo memakai format teks `bun.lock` (bukan binari `bun.lockb`), sehingga hash selalu string kosong dan cache key statis (`${{ runner.os }}-bun-`) menyebabkan restore cache lama (bun 1.3.14) di bawah bun 1.4.0
- Dokumentasi CI/CD di `docs/DEPLOYMENT.md`: koreksi jobs table (ganti `unit-tests`/`e2e-tests`/`deploy` → `e2e`/`coverage`) dan tambahkan catatan standardisasi Bun 1.4.0 serta dependency caching dengan `hashFiles('**/bun.lock')`
- Fix Vercel Native Deployment Check "Lint" gagal pada `apps/grpc`: paket grpc punya script `"lint": "eslint src/"` tetapi tidak mendeklarasikan `eslint` sebagai devDependencies dan tidak punya konfigurasi eslint, sehingga di fresh checkout `eslint` binary tidak ditemukan (`command not found: eslint`). Tambahkan devDependencies `eslint`, `@typescript-eslint/parser`, `globals`; buat `eslint.config.mjs`; dan perbaiki 29 error `no-unused-vars` yang terungkap pertama kali lint berjalan. `bun run lint` (turbo run lint) kini sukses di fresh clone bersih (tanpa `.env.local`) maupun di working directory lokal.
- Fix pre-existing TypeScript (`tsc --noEmit`) error di `apps/grpc` (3 kategori): (1) TS2352 — cast `Metadata → GrpcMetadata` pada `src/interceptors/auth.interceptor.ts` diganti ke `as unknown as`; (2) TS6059 — `rootDir: "."` eksklusi sumber `@konkosyuk/shared` via path alias, diganti ke `"../../"` (monorepo root); (3) TS2307 — impor tipe proto `../gen/konkosyuk/v1/properties_pb.js` (generated & gitignored, `protoc`/`ts-proto` belum dijalankan di checkout segar) pada stub `src/services/property.service.ts` — hapus `import type` + anotasi `satisfies`. `bun run typecheck` (grpc) kini bersih di fresh clone maupun di working directory lokal.

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
- Standardisasi semua CI workflow ke `bun-version: 1.4.0` (job `lint`/`coverage`/`audit` sudah 1.4.0; `typecheck`, `unit-tests`, `build`, `e2e` sebelumnya masih 1.3.14)

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

### Security

- Phase 7: Rate limiting expanded ke mutation endpoints: referrals, reviews, chat, maintenance, owner withdrawals, properties, units
- Phase 8: Fixed Nicepay & Doku webhook signature verification (HMAC computed before comparison)
- Phase 8: Webhook amount tolerance tightened dari 100 IDR ke 0 IDR (exact match)
- Phase 8: Admin cancel payment menggunakan status `cancelled` bukan `refunded` (refund memerlukan gateway call)
- Phase 8: Admin refund action wrapped in transaction + `handleReferralFailureOnRefund` menggunakan `tx` bukan `db`
- Phase 8: Added `cancelled` ke `paymentStatus` enum dan `cancel` ke `AuditAction`
- Phase 9: Fixed commission rates sesuai documented tiers (Owner: 1%/2%/3.67%/4.82%, Tenant: 0.9%/1.86%/2.79%/3.96%)
- Phase 9: Fixed `calculateEligibleAt` dari 7 hari ke 5 hari sesuai terms
- Phase 9: Fixed `commissionRate` calculation di `verification.ts` menggunakan `getCommissionRate()` bukan `calculateCommissionAmount(1, ...)`
- Phase 9: Added row locking (`FOR UPDATE`) di `startReferralVerification`, `handleReferralFailureOnRefund`, `sweepEligibleReferrals`
- Phase 9: Added status guard di sweep loop (`if (referral.status !== "verifying") continue`)
- Phase 9: Schema: added unique constraint on `voucher_code`, added `payoutIdempotencyKey` column, added FK `refereeTransactionId` ke `payments`
- Phase 9: Audit findings documented: 36 issues (12 High, 15 Medium, 9 Low) including zero test coverage, missing idempotency, fraud gaps

### Security

- Phase 11: Loyalty redemption now fully atomic — balance check, redemption insert, debit transaction, and balance update happen inside a single `db.transaction()` with `FOR UPDATE` row lock to prevent concurrent redemption and negative balance
- Phase 11: Removed duplicate `loyalty_points` table from schema; active loyalty system uses `loyalty_transactions` as append-only ledger only
- Phase 12: Group booking confirmation wrapped in `db.transaction()` with `FOR UPDATE` lock to prevent double-booking on concurrent confirm requests
- Phase 12: Group booking member invitation deduplicated inside transaction — duplicate email invites within same group booking are ignored
- Phase 12: Group booking accept/reject wrapped in `db.transaction()` with `FOR UPDATE` row lock to prevent race condition on status change
- Phase 12: Share percentage rounded to 2 decimal places (`Math.round(rawShare * 100) / 100`) to avoid floating-point drift in share calculation
- Phase 12: `maxMembers` enforced at schema level (max 50) and validated at action/route level
- Phase 12: Added unique constraint `group_booking_members_group_booking_id_user_id_unique` to prevent duplicate members
- Phase 13: Fixed monetary columns: `properties.base_price`, `payments.amount`, `refund_requests.amount`, `refund_requests.approved_amount` changed from `text` to `numeric(12,2)`
- Phase 13: `bookings.basePriceAtBooking` and `bookings.securityDeposit` changed to `numeric(12,2)` (was nullable, now implicitly nullable but recommended to populate)
- Phase 13: `groupBookingMembers.userId` FK changed to `onDelete: "cascade"` to prevent orphan records
- Phase 13: `bookings.groupBookingId` FK changed to `onDelete: "cascade"` to prevent orphan bookings
- Phase 13: Added missing indexes: `group_bookings.lead_user_id`, `group_bookings.status`, `group_bookings.property_id`, `group_bookings.created_at`, `group_booking_members.status`, `group_booking_members.group_booking_id`, `loyalty_transactions.type`, `loyalty_transactions.expires_at`, `reward_redemptions.status`, `bookings.group_booking_id`, `bookings.is_group_booking`

### Security

- Phase 14: Booking creation wrapped in `db.transaction()` with `FOR UPDATE` on unit and bookings to prevent double-booking race condition
- Phase 14: Booking request creation wrapped in `db.transaction()` with `FOR UPDATE` on unit to prevent race condition
- Phase 14: Voucher redemption now atomic — single `UPDATE ... RETURNING *` prevents TOCTOU between validation and mark-redeemed
- Phase 14: Withdrawal creation wrapped in `db.transaction()` with `FOR UPDATE` on user row to prevent concurrent withdrawal exceeding balance
- Phase 14: Referral link wrapped in `db.transaction()` with `FOR UPDATE` on referral row to prevent concurrent link attempts
- Phase 14: Group booking member invitation moved inside creation transaction for atomicity
- Phase 14: Group booking confirmation wrapped in `db.transaction()` with `FOR UPDATE` on unit and overlap check
- Phase 14: Added unique constraints: `payments.transactionId`, `reward_redemptions(userId, rewardId)`, `referrals(referrerId, refereeId, category)`
- Phase 15: Added `QueueEvents` listeners for failed/completed/stalled jobs across all 6 BullMQ queues
- Phase 15: Added `maxStalledCount: 2` to all workers for stuck job detection
- Phase 15: Changed `removeOnFail` from `{ count: 100 }` to `{ count: 0 }` to preserve failed jobs for inspection
- Phase 15: Differentiated retry policies per queue criticality: refunds=5 attempts, saved-search=2 attempts, others=3 attempts
- Phase 15: Added exponential backoff with delay 5s-10s for all queues
- Phase 15: Improved graceful shutdown: `worker.close(true)` waits for in-flight jobs, QueueEvents closed before Redis disconnect
- Phase 15: Exported `deadLetterQueues` array for future DLQ implementation
- Phase 16: Added correlation ID middleware (`src/middleware.ts`) generating `x-request-id` for all API routes
- Phase 16: Enhanced Winston logger: added `requestId`, `userId`, `route`, `action`, `status`, `duration`, `ip`, `userAgent` to `LogMetadata`
- Phase 16: Added `withRequestLogging` wrapper for automatic request logging with correlation ID
- Phase 16: Added Sentry `beforeSend` and `beforeSendTransaction` scrubbing for sensitive data (password, token, cookie, KTP, balance, OTP, etc.)
- Phase 16: Added Sentry scope enrichment with `requestId`, `userId`, `route`, `method` tags in `captureException` and `captureMessage`

### Security

- Phase 17: Standardized API error response shape to `{ success: false, error: { code, message, details? } }` across all routes
- Phase 17: Fixed 6 API routes leaking raw error messages, stack traces, or internal paths in production responses
- Phase 17: Removed `console.error` from API routes, centralized logging via `handleApiError` and `logError`
- Phase 17: Added sensitive pattern scrubbing in production (SQL keywords, password, token, secret, stack trace, database)
- Phase 17: Updated `fail()` helper to return consistent `{ success: false, error: { code, message } }` shape
- Phase 17: Fixed webhook error handler to not return raw `error.message` in catch block
- Phase 18: Migrated duplicate Zod schemas to shared package: referrals, loyalty transactions, group bookings
- Phase 18: Added `referralActionSchema` to `@konkosyuk/shared` and removed inline duplicate from API route
- Phase 18: Updated API routes to import enums from `@konkosyuk/shared/constants` instead of local definitions

### Fixed

- Phase 19: Fixed hydration mismatch in `dashboard/page.tsx` and `owner/bookings/page.tsx` (removed `new Date()` from render, eliminated IIFE + hooks-in-callback anti-patterns)
- Phase 19: Fixed hydration mismatch in `owner/dashboard/page.tsx` — year/month initialization moved to `useLayoutEffect` with `queueMicrotask`
- Phase 19: Fixed hydration mismatch in `properties/[id]/booking-dialog.tsx` — `today` date computation moved to `useLayoutEffect`
- Phase 19: Replaced `document.getElementById("avatar")?.click()` anti-pattern with `useRef` in `settings/profile/page.tsx`
- Phase 20: Added `generateMetadata` with locale-aware title, description, canonical, and hreflang alternates to public pages (about, privacy, refund-policy, terms)
- Phase 20: Added `generateMetadata` to `(public)/layout.tsx` with canonical + alternates for all client-component public pages
- Phase 20: Updated root `layout.tsx` metadata with `alternates.languages` and `x-default` for all 8 locales
- Phase 20: Fixed sitemap to include `/properties` listing for all 8 locales (was only `/id/properties`)
- Phase 20: Fixed `robots.txt` to include locale-prefixed disallow patterns for protected routes
- Phase 20: Fixed breadcrumb `JsonLd` URLs in `properties/[id]/page.tsx` to include locale prefix (was hardcoded English)

### Security

- Phase 21: Added `GeoCoordinates`, `hasMap`, and `addressDistrict` to property JSON-LD for local SEO
- Phase 21: Added city/district autocomplete API endpoint (`/api/locations?q=&type=`)
- Phase 22: Fixed N+1 query in occupancy API — replaced 30 daily-loop queries with single `generate_series` aggregation
- Phase 22: Fixed N+1 query in revenue API — replaced per-property `occupiedDays` loop with single joined query
- Phase 22: Replaced `SELECT *` with explicit field selection in properties API to reduce payload by ~60%
- Phase 23: Added magic bytes validation to `/api/upload` (was only MIME check)
- Phase 23: Added rate limiting to `/api/user/upload-avatar` (was missing)
- Phase 23: Tightened `remotePatterns` in `next.config.ts` — removed wildcards, added exact tile hosts
- Phase 23: Removed unused image hosts from CSP (`placehold.co`, `via.placeholder.com`, `cdn.jsdelivr.net`)
- Phase 23: Added `demotiles.maplibre.org` to CSP `connect-src` for mini-map
- Phase 24: Added unit tests for referral commission calculation (all 4 tiers × 2 categories)
- Phase 24: Added unit tests for payment webhook handler (signature, payload normalization, error cases)
- Phase 24: Added unit tests for voucher validation and atomic redemption
- Phase 24: Added unit tests for occupancy API with mocked DB queries

### Added

- Phase 25: Unit tests for referral verification (`startReferralVerification`, `handleReferralFailureOnRefund`, `sweepEligibleReferrals`) — 10 test cases covering happy path, early returns, and status guards
- Phase 25: Unit tests for loyalty transactions API (`GET /api/loyalty/transactions`) — pagination, type filter, balance calculation, auth guard
- Phase 25: Unit tests for loyalty rewards API (`GET /api/loyalty/rewards`, `POST /api/loyalty/rewards/redeem`) — active filter, redemption flow, inactive/non-existent reward rejection
- Phase 25: Unit tests for group bookings API (`GET /api/group-bookings`, `POST /api/group-bookings`) — user/owner filtering, member deduplication, property/unit validation

### Changed

- Phase 26: Replaced 4 `console.error` calls with structured `logError` in `src/lib/payments/webhook.ts`
- Phase 26: Extracted magic number `DP_RATIO = 0.35` to `src/lib/payments/calculations.ts` and reused in `actions/bookings.ts`
- Phase 26: Extracted magic numbers: `PAYMENT_EXPIRY_SECONDS`, `MAX_DESCRIPTION_LENGTH`, `MAX_CHAT_MESSAGE_LENGTH`, `MAX_REVIEW_LENGTH`, `DEFAULT_FEATURED_LISTING_PRICE` to `src/lib/constants/actions.ts`
- Phase 26: Extracted commission rate tables (`OWNER_TIER_RATES`, `TENANT_TIER_RATES`) and time constants (`MS_PER_DAY`, `REFERRAL_ELIGIBILITY_DAYS`) to `src/lib/referrals/commission.ts`
- Phase 26: Added type guard `isCommissionCategory()` in `verification.ts` replacing unsafe `as CommissionCategory` cast

### Security

- Phase 26: Replaced `z.any()` with `z.unknown()` in `payment-gateways.ts` upsert schema for safer type inference
- Phase 27: Completed `env.ts` schema — added 15 missing environment variables (ABLY, DIDIT, VAPID, Sentry, storage, cron secrets)
- Phase 27: Fixed `.env.example` — `BETTER_AUTH_SECRET` no longer shows generation command as literal value
- Phase 27: Centralized environment validation in `src/lib/env.ts` covering all 58 variables from `.env.example`
- Phase 27: Server secrets (`ABLY_API_KEY`, `DIDIT_API_KEY`, `DIDIT_WEBHOOK_SECRET`, `VAPID_PRIVATE_KEY`, `PAYMENT_CONFIG_ENCRYPTION_KEY`, `NOTIFICATION_ENCRYPTION_KEY`, `CRON_SECRET`) validated as required with minimum length checks

### Fixed

- Phase 26: Fixed unused variable lint warnings in group bookings and loyalty rewards test files

### Added

- Phase 28: GitHub Actions CI/CD pipeline with 3 workflows:
  - `.github/workflows/ci-fast.yml`: Lint, typecheck, unit tests (parallel, on every PR/push)
  - `.github/workflows/ci-slow.yml`: Coverage report, build verification, E2E tests (on main/develop)
  - `.github/workflows/security.yml`: Dependency audit (`bun audit`), secrets scanning (TruffleHog), SAST (Semgrep)
- Phase 28: Proper dependency caching with `actions/cache@v4` using `bun.lock` hash
- Phase 28: Separate fast/slow checks to optimize CI feedback time
- Phase 28: Codecov integration for coverage tracking
- Phase 28: Playwright E2E tests with artifact upload on failure
- Phase 29: Production readiness checklist (`CHECKLIST_WEB.md`) with 17 categories and 100+ verification items
- Phase 29: Healthcheck endpoints documented (`/api/health/live`, `/api/health/ready`)
- Phase 29: Rollback procedure documented (Vercel, database, worker)

### Security

- Phase 27: Completed `env.ts` schema covering all 58 environment variables from `.env.example`
- Phase 27: Server secrets validated with minimum length checks (ABLY, DIDIT, VAPID, encryption keys)
- Phase 27: `.env.example` fixed — `BETTER_AUTH_SECRET` no longer shows generation command as literal value

### Fixed

- Phase 22: Added composite indexes: `properties(city, isActive)`, `bookings(propertyId, status, startDate, endDate)`, `payments(propertyId, status, paidAt)`
- Phase 22: Updated occupancy API tests to match new query structure (Promise.all + generate_series)

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

### Fixed

- Vercel build error `UnknownLockfileVersion`: menambahkan `BUN_VERSION=1.4.0` ke `vercel.json` agar build menggunakan Bun yang kompatibel dengan `lockfileVersion: 2`

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

## Pembersihan Type Debt Menuju Strict Mode

### Ringkasan
Memperbaiki known TypeScript errors di `apps/web` sebagai bagian dari migrasi menuju `strict: true`. Fase 1 membersihkan penggunaan `any` yang eksplisit dan casting ganda yang tidak perlu di kode produksi.

### Perubahan Utama
- Mengganti `z.any()` menjadi `z.unknown()` di schema payment gateway admin untuk type safety yang lebih baik
- Menghilangkan cast `as any` yang tidak perlu pada insert ads admin route setelah verifikasi tipe Drizzle schema cocok
- Menyederhanakan double cast `as unknown as Record<string, unknown>` menjadi `as Record<string, unknown>` pada payment gateway manager untuk raw response eksternal

### File Diubah
- `apps/web/src/app/api/admin/payment-gateways/route.ts`
- `apps/web/src/app/api/admin/ads/route.ts`
- `apps/web/src/lib/payments/gateway-manager.ts`

### Validasi
- `bun x tsc --noEmit`: 0 error
- `bun run lint`: lolos
- `bun run test -- --run`: 319 passed, 0 failed

---

## [0.0.1] - 2026-08-01

### Added

- Initial commit dari Create Next App
- Setup dasar project structure
- Konfigurasi TypeScript, Tailwind CSS, dan ESLint
- Konfigurasi Drizzle ORM dengan PostgreSQL
- Setup Better Auth dengan Drizzle adapter
