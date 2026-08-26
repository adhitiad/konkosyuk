# Plan: Extract BullMQ Cron/Worker dari `apps/web` ke `apps/cronJob`

## Goal

Memisahkan seluruh komponen cron dan background worker BullMQ dari `apps/web` menjadi aplikasi standalone `apps/cronJob` agar web app hanya fokus pada HTTP layer (Next.js), sementara worker berjalan sebagai service terpisah di Render.

## Current State

- `apps/web` menampung **seluruh** worker subsystem:
  - `src/workers/` — entry point, worker registration, scheduler, processors, tests
  - `src/lib/queue/queues.ts` — definisi BullMQ Queue
  - `src/lib/redis.ts` — koneksi Redis shared untuk BullMQ
  - `src/lib/cron/*.ts` — business logic yang dipanggil processor
  - `src/actions/cron/process-expired-refunds.ts` — business logic refund
  - `src/lib/referrals/verification.ts` — dipakai processor referral sweep
  - `src/lib/notifications/` — dipakai processor cleanup, saved-search, churn-prediction
  - `src/lib/audit-log.ts` — dipakai process-expired-refunds
  - `src/lib/logger.ts` — Winston logger
  - `Dockerfile.worker` + `render.yaml` — deployment worker
  - `scripts/sync-worker-env.ts` — sinkronisasi env untuk Render
- Worker dijalankan via `bun run worker:start` → `bun src/workers/index.ts`
- Web app **tidak** melakukan enqueue job ke queue manapun; semua job dijadwalkan melalui BullMQ repeatable job scheduler
- `packages/shared` sudah menyediakan schema DB dan helper `createDb`

## Proposed Architecture

```
apps/
  web/          → Next.js 16 (Vercel) — hanya HTTP layer
  cronJob/      → Standalone Bun service (Render Background Worker)
    src/
      workers/      → index.ts, main.worker.ts, scheduler.ts, processors/
      lib/
        queue/      → queues.ts, dead-letter queue list
        redis.ts    → koneksi BullMQ Redis
        cron/       → cleanup-bookings, complete-bookings, saved-search-matcher, update-area-counts
        logger.ts   → Winston logger (sama dengan web)
        notifications/ → email.ts, notification-service.ts (subset untuk worker)
        referrals/  → verification.ts
        audit-log.ts
      db/
        index.ts    → createDb instance via @konkosyuk/shared
  grpc/         → existing standalone gRPC service (tidak berubah)
  mobile/       → Flutter (tidak berubah)

packages/
  shared/       → DB schema, types, constants, API schemas, createDb
```

### Dependency Flow

- `apps/cronJob` → `packages/shared` (DB schema, createDb, types)
- `apps/cronJob` tidak bergantung pada `apps/web`
- `apps/web` tidak lagi mengandung worker code
- Kedua aplikasi connect ke **Redis instance yang sama** (BullMQ requirement)

## Implementation Steps

### 1. Scaffold `apps/cronJob`

Buat struktur dasar package `apps/cronJob`:

- `apps/cronJob/package.json` — depends: `bullmq`, `ioredis`, `drizzle-orm`, `pg`, `@konkosyuk/shared`, `winston`, `resend`, `@sentry/node` (jika churn prediction butuh), `web-push`, `zod`
- `apps/cronJob/tsconfig.json` — path alias `@/*` → `./src/*`
- `apps/cronJob/.gitignore` — `.env.worker`, `node_modules/`, `.turbo/`
- `apps/cronJob/README.md` — cara menjalankan worker

### 2. Salin Worker Infrastructure ke `apps/cronJob`

Pindahkan file worker dari `apps/web` ke `apps/cronJob`:

| Dari | Ke |
|------|-----|
| `apps/web/src/workers/index.ts` | `apps/cronJob/src/workers/index.ts` |
| `apps/web/src/workers/main.worker.ts` | `apps/cronJob/src/workers/main.worker.ts` |
| `apps/web/src/workers/scheduler.ts` | `apps/cronJob/src/workers/scheduler.ts` |
| `apps/web/src/workers/processors/*.ts` | `apps/cronJob/src/workers/processors/*.ts` |
| `apps/web/src/workers/__tests__/*` | `apps/cronJob/src/workers/__tests__/*` |
| `apps/web/src/workers/processors/__tests__/*` | `apps/cronJob/src/workers/processors/__tests__/*` |
| `apps/web/src/lib/queue/queues.ts` | `apps/cronJob/src/lib/queue/queues.ts` |
| `apps/web/src/lib/queue/__tests__/queues.test.ts` | `apps/cronJob/src/lib/queue/__tests__/queues.test.ts` |
| `apps/web/src/lib/redis.ts` | `apps/cronJob/src/lib/redis.ts` |

Update imports di file-file di atas agar mengacu ke path lokal `apps/cronJob` (misal `@/lib/redis` tetap sama karena path alias, tapi `@/workers/...` dan `@/lib/cron/...` perlu disesuaikan).

### 3. Salin Business Logic yang Dibutuhkan Processor

Processor memanggil fungsi-fungsi business logic berikut. Pindahkan ke `apps/cronJob` dan update path import:

| Dari | Ke | Catatan |
|------|-----|---------|
| `apps/web/src/lib/cron/cleanup-bookings.ts` | `apps/cronJob/src/lib/cron/cleanup-bookings.ts` | Pakai `@/db`, `@/db/schema`, `@/lib/notifications` |
| `apps/web/src/lib/cron/complete-bookings.ts` | `apps/cronJob/src/lib/cron/complete-bookings.ts` | Pakai `@/db`, `@/db/schema` |
| `apps/web/src/lib/cron/saved-search-matcher.ts` | `apps/cronJob/src/lib/cron/saved-search-matcher.ts` | Pakai `@/db`, `@/db/schema`, `@/lib/notifications`, `@/lib/redis` |
| `apps/web/src/lib/cron/update-area-counts.ts` | `apps/cronJob/src/lib/cron/update-area-counts.ts` | Pakai `@/db`, `@/db/schema` |
| `apps/web/src/actions/cron/process-expired-refunds.ts` | `apps/cronJob/src/lib/cron/process-expired-refunds.ts` | Ubah dari server action menjadi plain async function; pakai `@/db`, `@/db/schema`, `@/lib/audit-log`, `@/lib/referrals/verification` |
| `apps/web/src/lib/referrals/verification.ts` | `apps/cronJob/src/lib/referrals/verification.ts` | Dipakai oleh `process-expired-refunds` dan processor referral |
| `apps/web/src/lib/notifications/email.ts` | `apps/cronJob/src/lib/notifications/email.ts` | Dipakai oleh churn-prediction |
| `apps/web/src/lib/notifications/notification-service.ts` | `apps/cronJob/src/lib/notifications/notification-service.ts` | Dipakai oleh referrals |
| `apps/web/src/lib/audit-log.ts` | `apps/cronJob/src/lib/audit-log.ts` | Dipakai process-expired-refunds |

Juga pindahkan test terkait:
- `apps/web/src/lib/cron/__tests__/*`
- `apps/web/src/actions/cron/__tests__/*` (jika ada)

### 4. Setup DB Connection di `apps/cronJob`

Buat `apps/cronJob/src/db/index.ts`:

```ts
import { createDb } from "@konkosyuk/shared/db";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const db = createDb(DATABASE_URL, {
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
```

Update semua import `@/db` di `apps/cronJob` untuk merujuk ke module lokal ini.

### 5. Extract `logger.ts` ke `packages/shared` (Recommended)

`apps/web/src/lib/logger.ts` adalah modul murni (hanya winston, tanpa Next.js dependency). Ekstrak ke `packages/shared/src/lib/logger.ts` agar kedua aplikasi bisa berbagi:

- Pindahkan isi `apps/web/src/lib/logger.ts` ke `packages/shared/src/lib/logger.ts`
- Update export di `packages/shared/src/index.ts` agar include `./lib/logger`
- Update import di `apps/web/src/lib/logger.ts` → `import { ... } from "@konkosyuk/shared/lib/logger"`
- Update import di `apps/cronJob/src/lib/logger.ts` → `import { ... } from "@konkosyuk/shared/lib/logger"`

### 6. Bersihkan `apps/web`

Hapus file berikut dari `apps/web`:

```
src/workers/
src/lib/queue/
src/lib/cron/
src/actions/cron/
src/lib/referrals/verification.ts  (jika dipakai HANYA oleh worker; cek dulu)
src/lib/notifications/email.ts      (jika dipakai HANYA oleh worker; cek dulu)
src/lib/notifications/notification-service.ts  (jika dipakai HANYA oleh worker)
src/lib/audit-log.ts               (jika dipakai HANYA oleh worker)
```

**Penting**: Sebelum menghapus, jalankan `grep` untuk memastikan file tersebut tidak dipakai oleh web app lain. Jika dipakai oleh web app, **jangan dihapus** — biarkan tetap di `apps/web` dan buat versi di `apps/cronJob` (duplikasi minimal untuk worker).

Update `apps/web/package.json`:
- Hapus script: `worker:start`, `worker:dev`, `dev:all`
- Hapus dependency: `bullmq` (jika tidak ada usage lain)
- Hapus devDependency: `concurrently` (jika tidak ada usage lain)

### 7. Update Deployment Configuration

- Pindah `apps/web/Dockerfile.worker` → `apps/cronJob/Dockerfile`
- Pindah `apps/web/render.yaml` → `apps/cronJob/render.yaml`
- Update `apps/cronJob/Dockerfile` agar build dari root context monorepo (sama pattern dengan `apps/grpc/Dockerfile.grpc`):
  ```dockerfile
  FROM oven/bun:1-alpine AS builder
  WORKDIR /app
  COPY package.json bun.lock turbo.json ./
  COPY apps/cronJob/package.json ./apps/cronJob/package.json
  COPY packages/shared/package.json ./packages/shared/package.json
  RUN bun install --frozen-lockfile
  COPY apps/cronJob ./apps/cronJob
  COPY packages/shared ./packages/shared
  RUN bun run --filter @konkosyuk/shared build
  FROM oven/bun:1-alpine
  WORKDIR /app
  COPY --from=builder /app/node_modules ./node_modules
  COPY --from=builder /app/apps/cronJob ./apps/cronJob
  COPY --from=builder /app/packages/shared ./packages/shared
  WORKDIR /app/apps/cronJob
  CMD ["bun", "src/workers/index.ts"]
  ```
- Update `apps/web/vercel.json` — hapus reference ke worker jika ada
- Update `turbo.json` jika perlu menambahkan `apps/cronJob` ke pipeline build/dev

### 8. Update Dokumentasi

- `apps/web/DEPLOYMENT.md` — hapus section Render Worker, update note tentang cron
- `docs/DEPLOYMENT.md` — update section Render untuk menunjuk ke `apps/cronJob`
- `apps/web/CHANGELOG.md` — catat perubahan: ekstraksi worker ke `apps/cronJob`

### 9. Update Root Monorepo

- `package.json` — workspaces sudah include `apps/*`, jadi `apps/cronJob` otomatis terdaftar
- `turbo.json` — pastikan `apps/cronJob` ikut di `build`, `dev`, `lint`, `test` pipeline

### 10. Migrasi Render Deployment

- Di Render, ubah Worker service:
  - **Root Directory**: `apps/cronJob`
  - **Dockerfile Path**: `apps/cronJob/Dockerfile`
  - **Start Command**: `bun src/workers/index.ts`
- Atau import ulang `apps/cronJob/render.yaml`

## Validation Plan

Setelah migration, jalankan:

```powershell
echo "=== LINT ==="; bun run lint; echo "=== TYPECHECK ==="; bunx tsc --noEmit; echo "=== TESTS ==="; bun run test -- --run
```

Validasi spesifik:
1. `apps/cronJob` bisa dijalankan: `cd apps/cronJob && bun run dev` (atau `bun src/workers/index.ts`)
2. Semua processor terdaftar tanpa error
3. QueueEvents listener aktif
4. Repeat jobs terdaftar di BullMQ
5. `apps/web` build dan test tetap passing
6. `packages/shared` build dan test tetap passing
7. Tidak ada import `@/workers` atau `@/lib/queue` tersisa di `apps/web`

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Processor tidak bisa import business logic setelah dipindah | Verifikasi semua path import sebelum migrasi; gunakan grep |
| Web app kehilangan fungsi yang seharusnya shared | Sebelum menghapus file dari `apps/web`, cek semua importers dengan `grep` |
| Redis instance berbeda antara web dan worker | Dokumentasikan requirement Redis yang sama; tambahkan health check |
| Render deployment break | Test Dockerfile locally dengan `docker build` sebelum deploy |
| `packages/shared` perlu update versi TypeScript | `packages/shared` saat ini pakai TS 6, konsisten dengan web |

## Open Questions / Decisions

1. **Should `apps/cronJob` bisa menerima enqueue dari web app di masa depan?**
   - Rekomendasi: **Ya, desain untuk itu**. Tambahkan API HTTP minimal (Hono/Express) di `apps/cronJob` untuk expose endpoint trigger job jika nanti web app perlu enqueue. Saat ini tidak dibutuhkan karena semua job scheduled via BullMQ repeatable jobs.

2. **Apakah `src/lib/notifications/*`, `src/lib/referrals/verification.ts`, `src/lib/audit-log.ts` harus di-share via `packages/shared` atau diduplikasi?**
   - Rekomendasi: **Diduplikasi untuk sementara** di `apps/cronJob` untuk migrasi cepat. Refactor ke `packages/shared` bisa dilakukan di sprint berikutnya jika keduanya berkembang bersama.

3. **Apakah `apps/cronJob` perlu test coverage yang sama dengan web?**
   - Rekomendasi: **Ya**, minimal unit test untuk processors dan scheduler (sama seperti yang ada di `apps/web/src/workers/__tests__/`).

## File Changes Summary

### Create (apps/cronJob)
- `package.json`
- `tsconfig.json`
- `.gitignore`
- `README.md`
- `src/workers/index.ts`
- `src/workers/main.worker.ts`
- `src/workers/scheduler.ts`
- `src/workers/processors/*.ts` (7 files)
- `src/workers/__tests__/*.ts`
- `src/workers/processors/__tests__/*.ts`
- `src/lib/queue/queues.ts`
- `src/lib/queue/__tests__/queues.test.ts`
- `src/lib/redis.ts`
- `src/lib/logger.ts` (jika tidak diekstrak ke shared)
- `src/lib/cron/*.ts` (4 files)
- `src/lib/cron/__tests__/*.ts`
- `src/lib/notifications/email.ts`
- `src/lib/notifications/notification-service.ts`
- `src/lib/referrals/verification.ts`
- `src/lib/audit-log.ts`
- `src/db/index.ts`
- `Dockerfile`
- `render.yaml`

### Update (packages/shared)
- `src/lib/logger.ts` (new)
- `src/index.ts` (export logger)

### Update (apps/web)
- `package.json` (hapus worker scripts & bullmq dependency)
- Hapus: `src/workers/`, `src/lib/queue/`, `src/lib/cron/`, `src/actions/cron/`
- Hapus: `Dockerfile.worker`, `render.yaml`, `scripts/sync-worker-env.ts`
- Update: `DEPLOYMENT.md`, dokumentasi internal

### Delete (apps/web)
- `src/workers/**`
- `src/lib/queue/**`
- `src/lib/cron/**`
- `src/actions/cron/**`
- `scripts/sync-worker-env.ts`
- `scripts/__tests__/sync-worker-env.test.ts`
- `Dockerfile.worker`
- `render.yaml`
