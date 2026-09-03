# KonkosYuk — Web App

<img src="public/1786091031.png" alt="KonkosYuk" width="600" height="350" />

Aplikasi web **KonkosYuk** di dalam Turborepo monorepo (`apps/web`). Bagian produk utama — menjembatani pencari hunian (Tenant) dengan pemilik properti (Owner), dengan sistem pembayaran bertahap (DP 35%), verifikasi KYC ketat, dukungan multi-bahasa, dan AI Assistant.

> Sebelum mengubah apapun, baca [`AGENTS.md`](./AGENTS.md) — versi Next.js yang dipakai (**16.3.1**) punya perubahan breaking vs dokumentasi umum. Aturan root monorepo ada di [`../AGENTS.md`](../AGENTS.md).

## Daftar Isi

- [Deskripsi](#deskripsi)
- [Fitur Lengkap](#fitur-lengkap)
- [Dokumentasi API untuk Flutter](#dokumentasi-api-untuk-flutter)
- [Tech Stack](#tech-stack)
- [Prasyarat](#prasyarat)
- [Panduan Instalasi Lokal](#panduan-instalasi-lokal)
- [Struktur Folder](#struktur-folder)
- [Testing](#testing)
- [Scripts yang Tersedia](#scripts-yang-tersedia)
- [Kontribusi](#Kontribusi)

## Deskripsi

**KonkosYuk** adalah platform web yang menjembatani pencari rumah huni (Tenant) dengan pemilik properti (Owner). Dilengkapi dengan sistem pembayaran bertahap (DP 35%), verifikasi KYC ketat, dukungan multi-bahasa, dan AI Assistant untuk rekomendasi properti.

## Fitur Lengkap

### Pencarian & Penemuan

- **Pencarian Cerdas:** Full-text search PostgreSQL dengan dukungan bahasa Indonesia
- **Peta Interaktif:** MapLibre GL + Stadia Maps dengan filter radius
- **Filter Dinamis:** Harga, tipe (kost/kontrakan), fasilitas, dan jarak
- **Privacy by Design:** Koordinat di-jitter untuk properti yang belum dibooking

### Booking & Pembayaran

- **Sistem Paket Dinamis:** Sewa per jam, harian, bulanan, hingga tahunan
- **Pembayaran Bertahap:** DP 35% untuk mengunci, pelunasan 65% sebelum check-in
- **Multi-Gateway:** Doku, iPaymu, Nicepay, Otto Digital dengan webhook signature verification (HMAC-SHA256)
- **Mode Mock/ Live:** `PAYMENT_MODE=mock` untuk development; production wajib `PAYMENT_MODE=live`
- **Booking Request:** Pre-order untuk masa depan dengan persetujuan owner

### Manajemen Owner

- **CRUD Properti & Unit:** Hierarkis (gedung → kamar/unit)
- **KYC Verification:** Verifikasi identitas pemilik via Integrasi Didit
- **Dashboard Analitik:** Tingkat hunian, pendapatan, dan statistik
- **Maintenance Ticketing:** Pelaporan kerusakan dari tenant

### Keamanan & Kepercayaan

- **Better Auth:** Session-based dengan HttpOnly cookies, Email + Google OAuth
- **2FA:** TOTP via Better Auth twoFactor plugin
- **RBAC:** Role-Based Access Control (`cust | owner | admin | staff`)
- **Webhook Security:** HMAC-SHA256 signature verification
- **CSRF Protection:** Double-submit cookie pattern (auto di `src/lib/axios.ts`)
- **Rate Limiting:** Redis-backed rate limiting untuk API
- **Audit Logging:** Immutable audit trail untuk aksi sensitif
- **CSP Dinamis:** Per-request nonce di `src/proxy.ts` (bukan `next.config.ts`)
- **Sentry:** Error tracking (server, edge, client)

### AI & Notifikasi

- **AI Assistant:** Chatbot rekomendasi properti dengan failover otomatis antara **OpenAI** dan **Groq** (`src/lib/ai-gateway.ts`)
- **Notifikasi Real-time:** In-app + Web Push (VAPID) + Ably channel
- **Email:** Via Resend (`noreply@domain-anda.com`)
- **WhatsApp & Telegram:** Via Fonnte / Telegram Bot API
- **Multi-Bahasa:** `id` (default), `en`, `my`, `th`, `vi`, `ko`, `zh`, `ru` via `next-intl`

### Infrastruktur

- **Background Jobs:** Upstash QStash untuk cron & webhook signing key rotation
- **Real-time:** Ably untuk chat dan notifikasi in-app
- **Storage:** Uploadthing + Cloudinary
- **Cost Monitoring:** Threshold usage QStash/Ably/Redis bulanan + alert ke Telegram admin

## Dokumentasi API untuk Flutter

Dokumentasi API lengkap untuk tim Flutter tersedia di:

- **[API Documentation](./docs/README.md)** — Quick start, authentication flow, real-time notifications, error handling
- **[OpenAPI Spec](./docs/openapi.yaml)** — Single source of truth untuk API specification
- **[Interactive Docs](/docs)** — Redoc interaktif yang di-host di aplikasi

## Tech Stack

| Layer         | Teknologi                                       |
| ------------- | ----------------------------------------------- |
| **Framework** | Next.js 16.3.1 (App Router), React 19.2.8, TypeScript 6 |
| **Styling**   | Tailwind CSS v4, shadcn/ui                      |
| **Database**  | PostgreSQL, Drizzle ORM                         |
| **Auth**      | Better Auth (Email + Google OAuth + 2FA TOTP)   |
| **Payment**   | Doku, iPaymu, Nicepay, Otto Digital             |
| **State**     | TanStack Query v5, Zustand                      |
| **Maps**      | MapLibre GL + Stadia Maps                       |
| **AI**        | OpenAI + Groq (failover otomatis)               |
| **Real-time**| Ably                                            |
| **Jobs**      | Upstash QStash                                  |
| **Cache**     | Upstash Redis (ioredis format)                  |
| **Media**     | Cloudinary, Uploadthing                         |
| **Push**      | web-push (VAPID)                                |
| **Email**     | Resend                                          |
| **Monitoring**| Sentry                                          |
| **Testing**   | Vitest, React Testing Library, Playwright       |
| **i18n**      | next-intl                                       |

## Prasyarat

Sebelum memulai, pastikan Anda telah menginstal:

- [Node.js](https://nodejs.org/) >= 18.18.0
- [Bun](https://bun.sh/) >= 1.4.0
- [PostgreSQL](https://www.postgresql.org/) >= 14
- [Redis](https://redis.io/) (untuk rate limiting & notifikasi)
- [Git](https://git-scm.com/)
- (Opsional) [ngrok](https://ngrok.com/) untuk development webhook QStash lokal
- (Opsional) [Flutter](https://flutter.dev/) hanya jika Anda juga mengembangkan `apps/mobile`

## Panduan Instalasi Lokal

### 1. Clone Repository

```bash
git clone https://github.com/adhitiad/konkosyuk.git
cd konkosyuk
```

### 2. Install Dependencies

Dari root monorepo:

```bash
bun install
```

### 3. Setup Environment Variables

Salin `apps/web/.env.example` menjadi `apps/web/.env.local`:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Isi variabel environment yang diperlukan (lihat bagian komentar di `.env.example` untuk penjelasan per variabel). Yang **wajib** untuk boot lokal:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/konkosyuk

# Redis (Upstash - format ioredis, BUKAN REST)
# Format: rediss://default:<token>@<endpoint>.upstash.io:<port>
REDIS_URL=rediss://default:<token>@<endpoint>.upstash.io:<port>

# Better Auth
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<min-32-chars, openssl rand -base64 32>
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Payment Mode (dev: mock; prod wajib: live)
PAYMENT_MODE=mock
PAYMENT_CONFIG_ENCRYPTION_KEY=<openssl rand -base64 32>

# Maps
NEXT_PUBLIC_STADIA_MAPS_API_KEY=<stadia-maps-key>

# Real-time
ABLY_API_KEY=<ably-key>
NEXT_PUBLIC_ABLY_KEY=<ably-key>

# Push Notification
VAPID_SUBJECT=mailto:admin@konkosyuk.app
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<vapid-public>
VAPID_PRIVATE_KEY=<vapid-private>

# Email
RESEND_API_KEY=<resend-key>
RESEND_FROM_EMAIL=KonkosYuk <noreply@domain-anda.com>

# KYC
DIDIT_API_KEY=<didit-key>
DIDIT_WEBHOOK_SECRET=<didit-webhook-secret>
NEXT_PUBLIC_DIDIT_API_URL=https://verification.didit.me

# AI (minimal salah satu)
GROQ_API_KEY=<groq-key>
# dan/atau
OPENAI_API_KEY=<openai-key>

# Background jobs
QSTASH_TOKEN=<qstash-token>
QSTASH_CURRENT_SIGNING_KEY=<signing-key>
QSTASH_NEXT_SIGNING_KEY=<signing-key>
QSTASH_WORKER_URL=https://<your-domain>/api/qstash/worker

# Monitoring
SENTRY_DSN=<sentry-dsn>
NEXT_PUBLIC_SENTRY_DSN=<sentry-dsn>
```

Detail lengkap tiap section (Doku/iPaymu/Nicepay/Otto, Google OAuth, Telegram, Fonnte, dll.) tersedia di file `apps/web/.env.example`.

### 4. Setup Database

Jalankan Drizzle push untuk membuat/menyinkronkan tabel:

```bash
cd apps/web
bun run db:push
```

### 5. Seed Data (Opsional)

Isi database dengan data contoh:

```bash
bun run db:seed
```

(Tersedia juga: `bun run db:seed-extra`, `bun run db:seed-ad-packages`, `bun run db:seed-popular-areas`, `bun run db:seed-campus-areas`, `bun run db:seed-inspections`.)

### 6. Jalankan Development Server

Kembali ke root, atau tetap di `apps/web`:

```bash
# dari apps/web (otomatis menjalankan ngrok + next dev + setup-local-ngrok.ts)
bun run dev
```

Script `bun run dev` di `apps/web` akan menjalankan tiga proses secara paralel lewat `concurrently`:

- `ngrok http 3000` (tunnel publik untuk webhook QStash lokal)
- `next dev`
- `tsx scripts/setup-local-ngrok.ts` (memperbarui konfigurasi QStash schedule & DLQ ke URL ngrok)

Pastikan ngrok berjalan di port `4040` (default) sebelum menjalankan `bun run dev`. Buka [http://localhost:3000](http://localhost:3000) di browser.

> Hanya butuh menjalankan Next.js tanpa tunnel ngrok? Jalankan langsung `next dev` atau gunakan `bunx next dev` di dalam `apps/web`.

### 7. Setup Ngrok untuk Webhook Lokal (Opsional)

Untuk menerima webhook dari Upstash QStash saat development lokal, ngrok wajib dijalankan **sebelum** `bun run dev`:

```bash
# Install ngrok jika belum ada
# https://ngrok.com/download

# Jalankan ngrok
ngrok http 3000
```

Script `setup-local-ngrok.ts` akan otomatis:

1. Mendeteksi URL publik ngrok dari API lokal (`http://127.0.0.1:4040/api/tunnels`)
2. Memperbarui konfigurasi QStash schedules dan DLQ agar menunjuk ke URL ngrok
3. Menampilkan log: `✅ QStash webhooks updated to point to: https://<ngrok-url>`

## Struktur Folder

```text
apps/web/
├── src/
│   ├── app/
│   │   ├── [locale]/              # i18n routing (id default, en/my/th/vi/ko/zh/ru)
│   │   │   ├── (auth)/            # Login, signup, forgot password, 2FA
│   │   │   ├── (protected)/       # Halaman yang butuh login
│   │   │   │   ├── customer/      # Dashboard tenant
│   │   │   │   ├── owner/         # Dashboard owner
│   │   │   │   ├── admin/         # Dashboard admin
│   │   │   │   └── ...
│   │   │   ├── properties/        # Pencarian & detail properti
│   │   │   ├── bookings/          # Manajemen booking
│   │   │   └── ...
│   │   ├── api/                   # API Route Handlers
│   │   │   ├── auth/[...all]/     # Better Auth endpoints
│   │   │   ├── properties/        # CRUD properti
│   │   │   ├── bookings/          # CRUD booking
│   │   │   ├── payments/          # Payment gateway integration + webhook
│   │   │   ├── admin/             # Admin-only endpoints
│   │   │   ├── qstash/            # QStash webhook receiver & worker
│   │   │   └── ...
│   ├── actions/                   # Server Actions (mutasi)
│   ├── components/
│   │   ├── ui/                    # Shadcn UI components
│   │   ├── features/              # Feature-specific components
│   │   └── layouts/               # Layout components
│   ├── lib/
│   │   ├── auth.ts                # Better Auth server config
│   │   ├── auth-client.ts         # Better Auth client config
│   │   ├── ai-gateway.ts          # OpenAI + Groq failover
│   │   ├── notification-client.ts # Email / Push / Fonnte / Telegram
│   │   ├── payments/              # Doku, iPaymu, Nicepay, Otto adapter
│   │   ├── redis.ts               # Upstash Redis (ioredis format)
│   │   ├── rate-limiter.ts        # Redis-backed rate limit
│   │   ├── axios.ts               # apiClient (CSRF + 401 redirect)
│   │   ├── proxy.ts               # Auth/headers/CSP dengan nonce
│   │   └── utils/                 # Helper functions
│   ├── db/                        # Schema Drizzle + koneksi
│   ├── i18n/                      # next-intl + messages per locale
│   ├── messages/                  # JSON terjemahan per locale
│   ├── stores/                    # Zustand stores
│   ├── hooks/                     # Custom React hooks
│   ├── providers/                 # React context providers
│   ├── scripts/                   # Seed/CLI scripts
│   ├── types/                     # Domain types (11 file + barrel)
│   └── __tests__/                 # Unit & integration tests
├── e2e/                           # Playwright E2E tests
├── docs/                          # OpenAPI, deployment, performance, dll.
├── drizzle/                       # Drizzle metadata (push, bukan migration)
├── public/                        # Static assets
├── scripts/                       # scripts/setup-local-ngrok.ts, seed, dll.
├── .github/                       # GitHub Actions workflows
├── drizzle.config.ts
├── next.config.ts                 # Header non-CSP (CSP dinamis di src/proxy.ts)
├── playwright.config.ts
├── vitest.config.ts
└── package.json
```

## Testing

```bash
# Unit tests (watch mode) — hanya di apps/web
bun run test

# Unit tests (CI mode, satu-shot)
bun run test -- --run

# Unit tests untuk unit/integration saja
bun run test:unit
bun run test:integration

# Coverage report (gate 70% global, 90% untuk payments/utils)
bun run test:coverage

# E2E tests (Playwright, auto-start dev server di http://localhost:3000)
bun run test:e2e
bun run test:e2e:ui
```

## Scripts yang Tersedia

| Script                  | Deskripsi                                       |
| ----------------------- | ----------------------------------------------- |
| `bun run dev`           | Jalankan ngrok + Next.js dev + setup-local-ngrok |
| `bun run build`         | Build untuk production                          |
| `bun run start`         | Jalankan production server                      |
| `bun run lint`          | Jalankan ESLint                                 |
| `bun run test`          | Unit tests (watch mode)                         |
| `bun run test:unit`     | Unit tests (satu-shot)                          |
| `bun run test:integration` | Integration tests (satu-shot)                |
| `bun run test:coverage` | Unit + coverage gate                            |
| `bun run test:e2e`      | Playwright E2E                                  |
| `bun run db:push`       | Push schema ke database (Drizzle, tanpa file migration) |
| `bun run db:generate`   | Generate migration file                         |
| `bun run db:migrate`    | Jalankan migration                              |
| `bun run db:seed`       | Seed database dengan data contoh                |
| `bun x tsc --noEmit`    | Type check                                      |

> Perintah lengkap ada di `package.json` (`apps/web/package.json`).

## Kontribusi

Kontribusi sangat diterima! Silakan baca [CONTRIBUTING.md](CONTRIBUTING.md) untuk pedoman kontribusi dan [`AGENTS.md`](./AGENTS.md) untuk aturan spesifik web app.

## Lisensi

Proyek ini dilisensikan under MIT License — lihat file [LICENSE](LICENSE) untuk detail.

## Author

**Adhitia Dwima**

- GitHub: [@adhitiad](https://github.com/adhitiad)

## Ucapan Terima Kasih

- [Next.js](https://nextjs.org/)
- [Better Auth](https://better-auth.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [shadcn/ui](https://ui.shadcn.com/)

---

<p align="center">
  Dibuat dengan ❤️ oleh Adhitia Dwima
  <span>
    <a href="https://nextjs.org/">
      <img src="https://nextjs.org/logo.svg" alt="Next.js" width="48" height="48" />
    </a>
  </span>
</p>