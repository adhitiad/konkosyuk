# Aturan Pengembangan Cron Job Service (Bun + BullMQ)

## 1. Konteks dan Peran

Ini adalah service standalone BullMQ worker untuk KonkosYuk yang di-deploy sebagai
Background Worker di Render. Worker ini menjalankan background jobs untuk cleanup,
referral verification, churn prediction, dan notifikasi terjadwal. Berbagi `REDIS_URL`
dan `DATABASE_URL` yang sama dengan `apps/web` karena BullMQ membutuhkan akses ke queue yang sama.

## 2. Teknologi

- **Runtime & Package Manager**: Bun 1.4.0 (jangan pakai `npm`/`yarn`/`pnpm`)
- **Framework**: Bun (native) + BullMQ v6 untuk job queue
- **Database**: PostgreSQL via Drizzle ORM (`@konkosyuk/shared/db`)
- **Cache/Queue**: Redis via ioredis (`REDIS_URL` dalam format ioredis)
- **Email**: Resend (`resend` package)
- **Push Notification**: `web-push`
- **Logger**: Winston via `@konkosyuk/shared/lib/logger` (`logInfo`, `logError`, `logWarn`)
- **Testing**: Vitest

## 3. Arsitektur

### Struktur Folder

```text
src/
├── workers/
│   ├── index.ts              # Entry point — startWorkers() + registerRepeatJobs()
│   ├── main.worker.ts        # Worker registration + graceful shutdown
│   ├── scheduler.ts          # BullMQ repeat job scheduler (cron patterns)
│   └── processors/           # Job processors (1 file per queue)
├── lib/
│   ├── queue/
│   │   └── queues.ts         # Definisi BullMQ queue + QueueEvents listeners
│   ├── redis.ts              # Shared Redis singleton
│   ├── cron/                 # Business logic untuk cron jobs
│   │   └── __tests__/        # Unit tests untuk cron logic
│   ├── notifications/        # Email templates (Resend)
│   │   └── email.ts
│   ├── notifications.ts      # Web push + in-app notification helpers
│   ├── notification-service.ts  # Dispatch engine (multi-channel)
│   ├── notification-settings.ts # DB-backed notification settings (encrypted)
│   ├── notification-crypto.ts  # AES-256-GCM encryption for credentials
│   ├── referrals/            # Referral verification logic
│   ├── audit-log.ts          # Audit logging
│   └── index.ts
└── db/
    └── index.ts              # Database connection (createDb factory)
```

### Worker Registration

- Setiap queue memiliki **1 processor file** di `src/workers/processors/`
- Gunakan `concurrency: 1` untuk semua worker agar tidak ada race condition pada data
- `stalledInterval: 600000` (10 menit) dan `maxStalledCount: 2` untuk semua worker
- `removeOnFail: { count: 0 }` — jangan hapus failed jobs, simpan untuk inspeksi
- Register `QueueEvents` listener untuk setiap queue: `failed`, `completed`, `stalled`

### Scheduler

- Semua repeat job didaftarkan di `src/workers/scheduler.ts` via `upsertJobScheduler`
- Pola cron menggunakan format BullMQ (5 field: `minute hour day month dayOfWeek`)
- Idempotency: gunakan `upsertJobScheduler` (bukan `add`) agar tidak duplikat saat restart

## 4. Redis

- **WAJIB** pakai `REDIS_URL` dalam format ioredis (`rediss://...`), sama dengan `apps/web`
- Pakai `getSharedRedisConnection()` singleton — jangan create koneksi baru per worker
- Graceful shutdown: panggil `closeSharedRedisConnection()` di `stopWorkers()`
- Redis error listener wajib terpasang (`attachErrorHandler`) agar tidak muncul
  "Unhandled error event"

## 5. Database

- Pakai `createDb()` dari `@konkosyuk/shared/db` (factory pattern)
- `DATABASE_URL` wajib di environment variables
- Pool config: `max: 5`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 10000`
- Gunakan transaksi (`db.transaction()`) untuk operasi yang melibatkan multiple writes
- Untuk cron job berulang: tambahkan idempotency guard (cek payload hash sebelum proses)

## 6. Notifikasi

### Channel
- **In-app**: simpan ke tabel `notifications` di database
- **Email**: kirim via Resend (gunakan `getResendClient()` yang cek settings dulu)
- **Push**: kirim via `web-push` (VAPID keys dari env)

### Notification Service
- Pakai `dispatchNotification()` di `notification-service.ts` untuk routing otomatis
- User preferences disimpan di `user_notification_preferences` (per-event channel toggles)
- Default preferences: `DEFAULT_PREFERENCES` map (lihat `notification-service.ts`)
- Quiet hours: cek sebelum kirim push/email (kecuali priority = "urgent")
- Email digest: `immediate` = kirim langsung, `daily`/`weekly` = batch

### Enkripsi
- Kredensial (API keys) disimpan encrypted di tabel `notification_settings`
- Pakai AES-256-GCM via `notification-crypto.ts`
- `NOTIFICATION_ENCRYPTION_KEY` wajib base64-encoded 32-byte key

### Template
- Semua email template pakai HTML inline styles (font-family: Arial, color #333, link #2563eb)
- Escape HTML pada user input via `escapeHtml()`
- Subject dan heading pakai bahasa Indonesia

## 7. Cron Job yang Tersedia

| Job | Queue | Pattern | Deskripsi |
|-----|-------|---------|-----------|
| cleanup-expired-bookings | `cleanup-expired-bookings` | `0 * * * *` | Batal booking tidak dibayar dalam 6 jam |
| complete-expired-bookings | `complete-expired-bookings` | `0 2 * * *` | Selesaikan booking lewat endDate |
| saved-search-matcher | `saved-search-matcher` | `0 3 * * *` | Cocokkan properti baru dengan pencarian |
| update-area-counts | `update-area-counts` | `0 4 * * *` | Update jumlah properti per area |
| process-expired-refunds | `process-expired-refunds` | `0 5 * * *` | Auto-refund booking expired |
| referral-eligibility-sweep | `referral-eligibility-sweep` | `0 * * * *` | Verifikasi referral setelah 5 hari |
| churn-prediction | `churn-prediction` | `0 6 * * *` | Kirim email re-engagement |

## 8. Logging & Error Handling

- JANGAN pakai `console.log` / `console.error` — pakai `logInfo()`, `logError()`, `logWarn()` dari `@konkosyuk/shared/lib/logger`
- `logError(error, context, metadata)` untuk semua error yang tertangkap
- Logger otomatis mensanitize sensitive keys (password, token, apiKey, dll)
- Production mode: JSON format; Development: colored format

## 9. Graceful Shutdown

- Tangkap `SIGINT` dan `SIGTERM`
- Di handler: panggil `await worker.close(true)` untuk tunggu in-flight jobs selesai
- Tutup `QueueEvents` sebelum `closeSharedRedisConnection()`
- Log shutdown steps via `logInfo()`

## 10. Environment Variables

| Variable | Wajib | Deskripsi |
|----------|-------|-----------|
| `DATABASE_URL` | Ya | PostgreSQL connection string |
| `REDIS_URL` | Ya | Redis ioredis format |
| `BETTER_AUTH_SECRET` | Ya | Min 32 chars |
| `CRON_SECRET` | Ya | Min 32 chars |
| `PAYMENT_CONFIG_ENCRYPTION_KEY` | Ya | Payment config encryption |
| `RESEND_API_KEY` | Opsional | Resend API key (dari DB settings juga bisa) |
| `RESEND_FROM_EMAIL` | Opsional | Default from email |
| `NOTIFICATION_ENCRYPTION_KEY` | Ya | Base64-encoded 32-byte key |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Opsional | VAPID public key |
| `VAPID_PRIVATE_KEY` | Opsional | VAPID private key |

## 11. Verification & Commands

```bash
cd apps/cronJob
bun install          # install dependencies
bun run dev          # development (hot reload)
bun run start        # production
bun run lint         # eslint
bun run typecheck    # tsc --noEmit
bun run test         # vitest (one-shot, run mode)
```

## 12. Deploy

- Deploy ke Render sebagai **Background Worker** (`render.yaml` sudah dikonfigurasi)
- `buildCommand: bun install`
- `startCommand: bun run start`
- Env vars dikonfigurasi di Render Environment Group
- WAJIB share `REDIS_URL` dan `DATABASE_URL` yang sama dengan `apps/web`

## 13. Catatan Tambahan

- Semua perubahan wajib dicatat di `CHANGELOG.md` (di root monorepo)
- Path alias: `@/*` → `./src/*`, `@konkosyuk/shared/*` → `../../packages/shared/src/*`
- Gunakan `z.unknown()` bukan `z.any()` untuk schema validation
- Ekstrak magic numbers ke named constants
