# KonkosYuk

<img src="public\1786091031.png" alt="KonkosYuk" width="600" height="350" />

Platform booking kost & kontrakan modern dengan pembayaran aman, verifikasi KYC, dan multi-bahasa.

[Demo](#) • [Dokumentasi](#) • [Pelaporan Bug](#) • [Diskusi](#)

---

## 📋 Deskripsi

**KonkosYuk** adalah platform web yang menjembatani pencari hunian (Tenant) dengan pemilik properti (Owner). Dilengkapi dengan sistem pembayaran bertahap (DP 35%), verifikasi KYC ketat, dukungan multi-bahasa, dan AI Assistant untuk rekomendasi properti.

## ✨ Fitur Lengkap

### 🏠 Pencarian & Penemuan

- **Pencarian Cerdas:** Full-text search PostgreSQL dengan dukungan bahasa Indonesia
- **Peta Interaktif:** Leaflet + OpenStreetMap dengan filter radius
- **Filter Dinamis:** Harga, tipe (kost/kontrakan), fasilitas, dan jarak
- **Privacy by Design:** Koordinat di-jitter untuk properti yang belum dibooking

### 💰 Booking & Pembayaran

- **Sistem Paket Dinamis:** Sewa per jam, harian, bulanan, hingga tahunan
- **Pembayaran Bertahap:** DP 35% untuk mengunci, pelunasan 65% sebelum check-in
- **Multi-Gateway:** Doku, iPaymu, Nicepay dengan webhook signature verification
- **Booking Request:** Pre-order untuk masa depan dengan persetujuan owner

### 👑 Manajemen Owner

- **CRUD Properti & Unit:** Hierarkis (gedung → kamar/unit)
- **KYC Verification:** Verifikasi identitas pemilik properti
- **Dashboard Analitik:** Tingkat hunian, pendapatan, dan statistik
- **Maintenance Ticketing:** Pelaporan kerusakan dari tenant

### 🔐 Keamanan & Kepercayaan

- **Better Auth:** Session-based dengan HttpOnly cookies
- **RBAC:** Role-Based Access Control (cust | owner | admin | staff)
- **Webhook Security:** HMAC-SHA256 signature verification
- **CSRF Protection:** Double-submit cookie pattern
- **Rate Limiting:** Redis-backed rate limiting untuk API
- **Audit Logging:** Immutable audit trail untuk aksi sensitif

### 🤖 AI & Notifikasi

- **AI Assistant:** Chatbot rekomendasi properti (OpenRouter)
- **Notifikasi Real-time:** In-app + Web Push Notification
- **Multi-Bahasa:** ID, EN, MY, TH, VI, KO, ZH, RU

## 🛠️ Tech Stack

| Layer         | Teknologi                                       |
| ------------- | ----------------------------------------------- |
| **Framework** | Next.js 16 (App Router), React 19, TypeScript 6 |
| **Styling**   | Tailwind CSS v4, shadcn/ui                      |
| **Database**  | PostgreSQL, Drizzle ORM                         |
| **Auth**      | Better Auth (Email + Google OAuth)              |
| **Payment**   | Doku, iPaymu, Nicepay                           |
| **State**     | TanStack Query v5, Zustand                      |
| **Maps**      | Leaflet, OpenStreetMap                          |
| **Media**     | Cloudinary, Uploadthing                         |
| **Testing**   | Vitest, React Testing Library, Playwright       |

## 📋 Prasyarat

Sebelum memulai, pastikan Anda telah menginstal:

- [Node.js](https://nodejs.org/) >= 18.18.0
- [Bun](https://bun.sh/) >= 1.4.0
- [PostgreSQL](https://www.postgresql.org/) >= 14
- [Redis](https://redis.io/) (untuk rate limiting & notifications)
- [Git](https://git-scm.com/)

## 🚀 Panduan Instalasi Lokal

### 1. Clone Repository

```bash
git clone https://github.com/adhitiad/konkosyuk.git
cd konkosyuk
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Setup Environment Variables

Salin file `.env.example` menjadi `.env.local`:

```bash
cp .env.example .env.local
```

Isi variabel environment yang diperlukan:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/konkosyuk

# Redis (Upstash)
REDIS_URL=rediss://default:<token>@<endpoint>.upstash.io:<port>

# Better Auth
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Monitoring
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# Maps
NEXT_PUBLIC_STADIA_MAPS_API_KEY=

# Real-time
ABLY_API_KEY=
NEXT_PUBLIC_ABLY_KEY=

# KYC
DIDIT_API_KEY=
DIDIT_WEBHOOK_SECRET=
NEXT_PUBLIC_DIDIT_API_URL=https://api.didit.me

# Google OAuth (opsional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Payment - Doku (opsional)
DOKU_BASE_URL=https://api.doku.com
DOKU_CLIENT_ID=
DOKU_SECRET_KEY=
DOKU_WEBHOOK_SECRET=

# Payment - iPaymu (opsional)
IPAYMU_BASE_URL=https://api.ipaymu.com
IPAYMU_API_KEY=
IPAYMU_WEBHOOK_SECRET=

# Payment - Nicepay (opsional)
NICEPAY_BASE_URL=https://api.nicepay.co.id
NICEPAY_MERCHANT_ID=
NICEPAY_MERCHANT_KEY=
NICEPAY_WEBHOOK_SECRET=

# Payment Mode
PAYMENT_MODE=mock
PAYMENT_CONFIG_ENCRYPTION_KEY=

# Storage
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Web Push (VAPID)
VAPID_SUBJECT=mailto:admin@konkosyuk.app
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Email
RESEND_API_KEY=
RESEND_FROM_EMAIL=KonkosYuk <noreply@domain-anda.com>
```

### 4. Setup Database

Jalankan Drizzle push untuk membuat tabel:

```bash
bun run db:push
```

### 5. Seed Data (Opsional)

Isi database dengan data contoh:

```bash
bun run db:seed
```

### 6. Jalankan Development Server

```bash
bun run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 📂 Struktur Folder

```
konkosyuk/
├── src/
│   ├── app/
│   │   ├── [locale]/              # i18n routing (ID, EN, MY, TH, VI, KO, ZH, RU)
│   │   │   ├── (auth)/            # Login, signup, forgot password
│   │   │   ├── (protected)/       # Halaman yang butuh login
│   │   │   │   ├── customer/      # Dashboard tenant
│   │   │   │   ├── owner/         # Dashboard owner
│   │   │   │   ├── admin/         # Dashboard admin
│   │   │   │   └── ...
│   │   │   ├── properties/        # Pencarian & detail properti
│   │   │   ├── bookings/          # Manajemen booking
│   │   │   └── ...
│   │   └── api/                   # API Route Handlers
│   │       ├── auth/[...all]/     # Better Auth endpoints
│   │       ├── properties/        # CRUD properti
│   │       ├── bookings/          # CRUD booking
│   │       ├── payments/          # Payment gateway integration
│   │       ├── admin/             # Admin-only endpoints
│   │       └── ...
│   ├── components/
│   │   ├── ui/                    # Shadcn UI components
│   │   ├── features/              # Feature-specific components
│   │   └── layouts/               # Layout components
│   ├── lib/
│   │   ├── auth.ts                # Better Auth server config
│   │   ├── auth-client.ts         # Better Auth client config
│   │   ├── db/                    # Database connection & schema
│   │   ├── payments/              # Payment gateway adapters
│   │   ├── utils/                 # Helper functions
│   │   └── ...
│   ├── i18n/                      # Terjemahan (next-intl)
│   └── __tests__/                 # Test setup
├── public/                        # Static assets
├── e2e/                           # Playwright E2E tests
├── docs/                          # Dokumentasi internal
├── .github/                       # GitHub Actions workflows
├── package.json
├── tsconfig.json
├── next.config.ts
├── drizzle.config.ts
└── vitest.config.ts
```

## 🧪 Testing

```bash
# Unit tests (watch mode)
bun run test

# Unit tests (CI mode)
bun run test -- --run

# Coverage report
bun run test:coverage

# E2E tests
bun run test:e2e
```

## 🔧 Scripts yang Tersedia

| Script                  | Deskripsi                         |
| ----------------------- | --------------------------------- |
| `bun run dev`           | Jalankan development server       |
| `bun run build`         | Build untuk production            |
| `bun run start`         | Jalankan production server        |
| `bun run lint`          | Jalankan ESLint                   |
| `bun run test`          | Jalankan unit tests (watch mode)  |
| `bun run test:coverage` | Jalankan tests dengan coverage    |
| `bun run test:e2e`      | Jalankan E2E tests                |
| `bun run db:push`       | Push schema ke database (Drizzle) |
| `bun run db:seed`       | Seed database dengan data contoh  |
| `bun x tsc --noEmit`    | Type check                        |

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan baca [CONTRIBUTING.md](CONTRIBUTING.md) untuk pedoman kontribusi.

## 📄 Lisensi

Proyek ini dilisensikan under MIT License - lihat file [LICENSE](LICENSE) untuk detail.

## 👨‍💻 Author

**Adhitia Dwima**

- GitHub: [@adhitiad](https://github.com/adhitiad)

## 🙏 Ucapan Terima Kasih

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
