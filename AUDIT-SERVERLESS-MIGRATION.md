# Laporan Audit: Migrasi ke Full Serverless TypeScript

**Tanggal**: 28-Aug-2026  
**Tujuan**: Mengidentifikasi seluruh artefak, dependensi, dan referensi yang terkait dengan microservice Go (gRPC) dan BullMQ worker untuk dihapus/dimodifikasi dalam migrasi ke arsitektur 100% serverless (Next.js + Upstash QStash).

---

## 1. Daftar File/Folder untuk Dihapus

### A. Folder/Files yang BELUM dihapus

| Path | Tipe | Alasan |
|------|------|--------|
| `proto/konkosyuk/v1/*.proto` | 5 file proto | Contract proto untuk gRPC yang tidak lagi digunakan |
| `proto/konkosyuk/v1/auth.proto` | File | Proto definisi Auth service |
| `proto/konkosyuk/v1/common.proto` | File | Proto definisi common messages |
| `proto/konkosyuk/v1/konkosyuk.proto` | File | Proto definisi main service |
| `proto/konkosyuk/v1/notification.proto` | File | Proto definisi notification service |
| `proto/konkosyuk/v1/properties.proto` | File | Proto definisi properties service |
| `protoc/` | Folder | Precompiled protoc binaries (tidak dibutuhkan lagi) |

### B. Folder/Files yang SUDAH dihapus

| Path | Status |
|------|--------|
| `apps/notifications/` | Dihapus |
| `apps/grpc/` | Dihapus |
| `apps/cronJob/` | Dihapus |
| `packages/shared/src/lib/notification-grpc-client.ts` | Dihapus |
| `packages/shared/dist/lib/notification-grpc-client.*` | Dihapus |

---

## 2. Dependensi untuk Di-uninstall

### A. Dependensi yang SUDAH dihapus

| Package | Dari | Alasan |
|---------|------|--------|
| `@grpc/grpc-js` | `packages/shared` | gRPC client/server |
| `@grpc/proto-loader` | `packages/shared` | Proto loader |
| `bullmq` | workspace | BullMQ worker |
| `@sentry/node` | `apps/cronJob` | Hanya dipakai di cronJob |
| `date-fns` | `apps/cronJob` | Hanya dipakai di cronJob |
| `ioredis` | `apps/cronJob` | Hanya dipakai BullMQ |
| `pg` | `apps/cronJob` | Hanya dipakai di cronJob |
| `prom-client` | `apps/cronJob`, `apps/grpc` | Metrics |
| `resend` | `apps/cronJob` | Sekarang di `apps/web` |
| `web-push` | `apps/cronJob` | Sekarang di `apps/web` |
| `winston` | `apps/cronJob` | Hanya dipakai di cronJob |
| `zod` | `apps/cronJob` | Hanya dipakai di cronJob |
| `bcryptjs` | `apps/grpc` | Hanya dipakai di gRPC auth |
| `better-auth` | `apps/grpc` | Auth instance terpisah |
| `@better-auth/drizzle-adapter` | `apps/grpc` | Auth instance terpisah |

### B. Dependensi yang TETAP dibutuhkan

| Package | Dari | Alasan |
|---------|------|--------|
| `ioredis` | `apps/web` | Rate limiting, caching, Ably |
| `resend` | `apps/web` | Email notifications |
| `web-push` | `apps/web` | Push notifications |
| `pg` | `apps/web`, `packages/shared` | Database driver |

---

## 3. File yang Perlu Dimodifikasi (Broken Imports)

### A. File dengan impor yang RUSAK (sudah diperbaiki)

| File | Status |
|------|--------|
| `apps/web/src/lib/notification-client.ts` | Sudah di-rewrite total |
| `apps/web/src/lib/email-client.ts` | Sudah diperbaiki (hapus circular dep) |
| `packages/shared/package.json` | Sudah diupdate |
| `packages/shared/dist/index.js` | Sudah diupdate |
| `packages/shared/dist/index.d.ts` | Sudah diupdate |

### B. File konfigurasi yang SUDAH diperbaiki

| File | Perubahan |
|------|-----------|
| `turbo.json` | Dihapus task `proto:gen` |
| `.gitignore` | Dihapus generated proto paths |
| `apps/web/eslint.config.mjs` | Dihapus restrict `@grpc/grpc-js` |
| `apps/web/tsconfig.json` | Sudah bersih |
| `apps/web/package.json` | Sudah diupdate |

### C. File dokumentasi yang BELUM diupdate sepenuhnya

| File | Catatan |
|------|---------|
| `AGENTS.md` | Masih ada referensi ke old files di line 66, tapi sudah mencantumkan penghapusan |
| `apps/web/TEST-AUDIT-REPORT.md` | Masih menyebut "BullMQ, Drizzle" dalam konteks historical |
| `apps/web/TEST-RESULTS.md` | Masih menyebut "Mock ioredis, BullMQ Queue" dalam konteks historical |
| `docs/monitoring-dashboard.md` | Sudah diupdate untuk menghapus grpc/bullmq metrics |
| `docs/DEPLOYMENT.md` | Sudah diupdate untuk menghapus worker sections |

---

## 4. Catatan Logika Bisnis

### A. Logika yang BERHASIL dipindahkan ke TypeScript

| Fitur | Lokasi Asal (Go) | Lokasi Baru (TS) | Status |
|-------|------------------|------------------|--------|
| Email via Resend | `apps/notifications/internal/infra/email/resend.go` | `apps/web/lib/notifications.ts` + `apps/web/src/lib/notification-client.ts` | Selesai |
| Push Notification via web-push | `apps/notifications/internal/infra/push/push.go` | `apps/web/lib/notifications.ts` | Selesai |
| In-app notification storage | `apps/notifications/internal/repository/notification_repository.go` | `apps/web/src/lib/notification-client.ts` | Selesai |
| Notification preferences | `apps/notifications/internal/repository/preference_repository.go` | `apps/web/src/lib/notification-client.ts` | Selesai |
| Notification settings CRUD | `apps/notifications/internal/repository/settings_repository.go` | `apps/web/src/lib/notification-client.ts` | Selesai |
| Email templates | Hardcoded di Go service | `buildEmailHtml()` di `apps/web/lib/notifications.ts` | Selesai |
| Telegram Bot API | `apps/notifications/internal/infra/telegram/telegram.go` | `sendTelegram()` di `apps/web/lib/notifications.ts` | Selesai |

### B. Logika yang BELUM diimplementasikan (placeholder)

| Fitur | Keterangan |
|-------|-----------|
| WhatsApp (`sendWhatsApp`) | Saat ini hanya `console.warn` placeholder. Perlu integrasi dengan WhatsApp Business API atau gateway lain. |
| Retry/backoff logic | QStash sudah menangani retry di level delivery. Tidak ada retry logic tambahan di aplikasi. |
| AES-256-GCM encryption | `apps/notifications/internal/infra/crypto/crypto.go` — logic enkripsi untuk credential. Di `apps/web` saat ini credentials disimpan sebagai plaintext di `notification_settings` table. Perlu dievaluasi apakah tetap diperlukan atau diganti dengan Vercel environment variables. |
| Rate limiting per channel | Tidak ada di implementasi baru. Dependen ke QStash rate limits. |

### C. Business Rules yang Perlu Dipertahankan

| Rule | Deskripsi |
|------|-----------|
| Default notification preferences | `DEFAULT_PREFERENCES` di `notification-client.ts` — mapping 24 jenis notifikasi ke channel preferences |
| Channel routing logic | `dispatchNotification()` — menentukan email/push/inApp berdasarkan user preferences |
| Quiet hours | `userNotificationPreferences.quietHoursStart/End` — saat ini disimpan di DB tapi belum dicek di logic dispatch |
| Email digest | `userNotificationPreferences.emailDigest` — saat ini selalu "immediate", belum ada batch digest |

---

## 5. Rekomendasi Selanjutnya

### Prioritas Tinggi
1. Hapus `proto/` dan `protoc/` — tidak lagi dibutuhkan
2. Update `AGENTS.md` untuk menghapus referensi old files
3. Bersihkan `apps/web/TEST-AUDIT-REPORT.md` dan `TEST-RESULTS.md` dari referensi BullMQ

### Prioritas Medium
4. Evaluasi kebutuhan encryption untuk `notification_settings` (meta tokens, API keys)
5. Implementasi quiet hours check di `dispatchNotification()`
6. Tambah test untuk modul `notifications.ts`

### Prioritas Rendah
7. Hapus file temporary `sementara.md` dan `p.md` jika ada
8. Implementasi WhatsApp gateway
9. Tambah analytics sync logic untuk job `SYNC_ANALYTICS`

---

## 6. Status Verifikasi Saat Ini

| Check | Status |
|-------|--------|
| `bun run lint` | 0 errors |
| `bun x tsc --noEmit` | Passed |
| `bun run test -- --run` | 319 tests passed |
| `bun install` | Clean (4 packages removed) |
| gRPC imports | 0 remaining |
| BullMQ imports | 0 remaining |
| Go files | 0 remaining |

---

*Laporan ini dibuat sebagai bagian dari Fase 1: Audit & Dekonstruksi. Menunggu instruksi selanjutnya untuk eksekusi penghapusan atau modifikasi.*