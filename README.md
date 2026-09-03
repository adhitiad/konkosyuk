# KonkosYuk

Monorepo **KonkosYuk** — platform booking kost & kontrakan modern dengan pembayaran aman, verifikasi KYC, dan multi-bahasa.

Aplikasi web dan mobile dibangun dari repositori yang sama, berbagi logika domain melalui package `@konkosyuk/shared`.

## Struktur Workspace

Turborepo + Bun workspaces (Bun **1.4.0**). Jangan naikkan versi Bun secara santai — di-pin di `packageManager` dan dipakai di CI.

```text
konkosyuk/
├── apps/
│   ├── web/                 # Next.js 16 (App Router) — aplikasi utama
│   │   ├── AGENTS.md        # Panduan khusus web app (wajib dibaca)
│   │   └── docs/            # OpenAPI, deployment, performance, dll.
│   └── mobile/              # Flutter app (toolchain terpisah: flutter/dart)
├── packages/
│   └── shared/              # @konkosyuk/shared — Zod schema, konstanta, tipe domain, util murni
│                           # (tidak boleh import dari apps/, tidak boleh pakai React/Next)
├── docs/                    # Dokumentasi level monorepo (jika ada)
├── CHANGELOG.md             # Catatan perubahan (wajib diperbarui setiap perubahan)
├── AGENTS.md                # Panduan monorepo (wajib dibaca)
└── turbo.json
```

Aturan khusus tiap workspace:

- `apps/web` → lihat [`apps/web/AGENTS.md`](apps/web/AGENTS.md)
- `packages/shared` → lihat [`docs/shared-packages-guideline.md`](docs/shared-packages-guideline.md) (jika ada) atau ringkasan di `AGENTS.md` root

## Perintah

Jalankan dari root repo via Turbo:

```bash
bun run dev      # Menjalankan semua apps
bun run build    # Build semua apps
bun run lint    # Lint semua apps
bun run test    # Menjalankan test tiap package
```

Per app / terfokus:

```bash
cd apps/web    && bun x tsc --noEmit          # Typecheck (ada error yang sudah diketahui, lihat apps/web/AGENTS.md)
cd apps/web    && bun run test -- --run       # Unit test satu-shot (mode CI)
cd apps/web    && bun run test:coverage       # Run dengan coverage gate
cd apps/web    && bun run test:e2e            # Playwright (otomatis start dev server)
cd apps/mobile && flutter <cmd>                # Toolchain Flutter
```

### Verifikasi Lokal & CI

Urutan lokal: `lint` → `typecheck` → `test`.

- `bun run test` di root menjalankan Vitest web dalam **watch mode** dan bisa membuat Turbo hang — gunakan `cd apps/web && bun run test -- --run` untuk satu-shot.
- CI terbagi tiga workflow: `ci-fast` (lint, typecheck, web unit tests pada PR/push ke main+develop), `ci-slow` (coverage, `next build`, Playwright E2E pada main+develop), `security` (bun audit, TruffleHog, Semgrep — mingguan).

## Bahasa & Internasionalisasi

- Bahasa kode, komentar, nama variabel/fungsi, nama file, dan entri `CHANGELOG.md` ditulis dalam **Bahasa Indonesia**.
- Aplikasi web mendukung 8 bahasa: `id` (default), `en`, `my`, `th`, `vi`, `ko`, `zh`, `ru` — konfigurasi di `apps/web/src/config.ts`.

## Environment & Secrets

- Setiap app yang butuh env mengelola file `.env.local`-nya sendiri (web: `apps/web/.env.local`).
- **Redis** menggunakan `REDIS_URL` dalam format ioredis (`rediss://...`) — bukan variabel `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`. Detail ada di `apps/web/src/lib/redis.ts`.
- `BETTER_AUTH_SECRET` minimal **32 karakter** (`openssl rand -base64 32`).
- `PAYMENT_MODE`: `mock` untuk development; build **production wajib `PAYMENT_MODE=live`** (`apps/web/src/lib/payments/mock.ts` akan throw bila sebaliknya).

## Database

- Schema web: `apps/web/src/db/schema.ts`.
- Development lokal: `cd apps/web && bun run db:push` (tanpa migration file).
- Migration: `db:generate` lalu `db:migrate`.
- Seed: gunakan script npm `bun run db:seed-*` (memuat `.env.local`); jangan invoke file `tsx scripts/seed*` langsung karena env mungkin tidak termuat.

## Arsitektur Notifikasi

- Semua logika notifikasi (email, WhatsApp, Telegram, Web Push) berada di `apps/web` lewat `apps/web/src/lib/notification-client.ts`.
- Dispatch langsung dari web app menggunakan:
  - **In-app**: disimpan di tabel `notifications`
  - **Email**: via Resend (`resend` package)
  - **Push**: via `web-push` dengan VAPID keys
  - **WhatsApp/Telegram**: via Fonnte/Telegram Bot API
- Pengaturan tersimpan langsung di database web app (`notification_settings`).

## Daftar Periksa Kontribusi

Sebelum commit / buka PR:

1. Baca `AGENTS.md` di root dan di app yang Anda sentuh.
2. Jalankan `bun run lint` + `bun x tsc --noEmit` + `bun run test -- --run` di workspace yang relevan.
3. Tambahkan entri di `CHANGELOG.md` root dengan tanggal `dd-MMM-yyyy hh:mm`.
4. Jangan expose rahasia ke klien (variabel `NEXT_PUBLIC_*` hanya untuk nilai yang aman dipublikasikan).
5. Gunakan **Bun only** (`bun add`, `bun run`, `bunx`) — `npm`/`yarn`/`pnpm` dilarang.

## Lisensi

Lihat [`LICENSE`](LICENSE).