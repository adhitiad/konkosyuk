# Rencana: Notification Service gRPC (Go)

## Ringkasan

Migrasikan logika notifikasi yang saat ini terduplikasi di `apps/web` dan `apps/cronJob` (TypeScript) ke `apps/notifications` (Go) sebagai standalone gRPC service. Semua komunikasi antar-service menggunakan gRPC, sesuai arsitektur monorepo.

## Status Saat Ini

- `apps/notifications/` hanya ada `go.mod`/`go.sum` (stub), belum ada source code
- Logika notifikasi **duplikat** di `apps/web/src/lib/notification-service.ts` (514 baris) dan `apps/cronJob/src/lib/notification-service.ts` (identik)
- Belum ada `notification.proto`
- Database schema untuk notifications sudah ada di `packages/shared/src/db/schema.ts`
- Callers: `apps/web` (reviews, referrals, API routes), `apps/cronJob` (saved-search, cleanup-bookings, referrals)

## Fase 1: Proto & Go Service Foundation

### 1.1 Buat `notification.proto`

Buat `proto/konkosyuk/v1/notification.proto` dengan:

**Enums:**
- `NotificationCategory`: booking, payment, maintenance, inspection, chat, review, system
- `NotificationPriority`: low, normal, high, urgent
- `EmailDigest`: immediate, daily, weekly, never
- `Channel`: in_app, email, push

**Messages:**
- `NotificationEvent` (userId, type, category, priority, title, message, actionUrl, actionLabel, referenceId, referenceType, metadata)
- `ChannelPreferences` (inApp, email, push)
- `UserPreferences` (preferences map, emailDigest, quietHoursStart/End, timezone)
- `DispatchRequest` / `DispatchResponse` (success, channel_results map, error)
- `DispatchBatchRequest` / `DispatchBatchResponse` (streaming)
- `Notification` (id, userId, title, message, type, referenceId, isRead, createdAt)
- `PushSubscription` (id, userId, endpoint, p256dh, auth, createdAt)
- `NotificationSettings` (id, resendApiKey, resendFromEmail, metaAccessToken, metaPhoneNumberId, metaMaintenanceCreatedTemplate, metaMaintenanceUpdatedTemplate, createdAt, updatedAt)
- `UserNotificationPreferences` (id, userId, preferences, emailDigest, quietHoursStart/End, timezone, updatedAt)
- `CreateNotificationRequest` / `CreateNotificationResponse`
- `GetUnreadCountRequest` / `GetUnreadCountResponse`
- `MarkReadRequest` / `MarkReadResponse`
- `SubscribePushRequest` / `SubscribePushResponse`
- `GetSettingsRequest` / `GetSettingsResponse`
- `UpdateSettingsRequest` / `UpdateSettingsResponse`
- `GetPreferencesRequest` / `GetPreferencesResponse`
- `UpdatePreferencesRequest` / `UpdatePreferencesResponse`

**Service:**
```protobuf
service NotificationService {
  rpc Dispatch(NotificationEvent) returns (DispatchResponse);
  rpc DispatchBatch(DispatchBatchRequest) returns (stream DispatchResponse);
  rpc GetUnreadCount(GetUnreadCountRequest) returns (GetUnreadCountResponse);
  rpc MarkRead(MarkReadRequest) returns (MarkReadResponse);
  rpc SubscribePush(SubscribePushRequest) returns (SubscribePushResponse);
  rpc GetSettings(google.protobuf.Empty) returns (NotificationSettingsResponse);
  rpc UpdateSettings(UpdateNotificationSettingsRequest) returns (NotificationSettingsResponse);
  rpc GetPreferences(GetPreferencesRequest) returns (GetPreferencesResponse);
  rpc UpdatePreferences(UpdatePreferencesRequest) returns (UpdatePreferencesResponse);
}
```

### 1.2 Update `konkosyuk.proto`

Tambah import `konkosyuk/v1/notification.proto`.

### 1.3 Setup Struktur Go

Buat struktur folder di `apps/notifications/`:

```
apps/notifications/
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── delivery/
│   │   └── notification_handler.go
│   ├── service/
│   │   └── notification_service.go
│   ├── repository/
│   │   ├── notification_repository.go
│   │   ├── preference_repository.go
│   │   └── settings_repository.go
│   ├── infra/
│   │   ├── email/
│   │   │   └── resend.go
│   │   ├── whatsapp/
│   │   │   └── whatsapp.go
│   │   ├── telegram/
│   │   │   └── telegram.go
│   │   ├── push/
│   │   │   └── webpush.go
│   │   └── crypto/
│   │       └── crypto.go
│   ├── domain/
│   │   └── notification.go
│   └── config/
│       └── config.go
├── proto/
│   └── konkosyuk/v1/notification.proto
├── go.mod
├── go.sum
└── Dockerfile
```

### 1.4 Implementasi gRPC Server

- `cmd/server/main.go`: Setup gRPC server, register `NotificationService`, bind ke `GRPC_PORT` (default 50052)
- `internal/delivery/notification_handler.go`: Implementasi semua RPC handler
- `internal/config/config.go`: Load env vars (`DATABASE_URL`, `REDIS_URL`, `NOTIFICATION_ENCRYPTION_KEY`, `GRPC_PORT`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `META_ACCESS_TOKEN`, `META_PHONE_NUMBER_ID`, `TELEGRAM_BOT_TOKEN`, `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`)

### 1.5 Implementasi Repository Layer (pgx)

- `internal/repository/notification_repository.go`: CRUD untuk tabel `notifications`, `push_subscriptions`
- `internal/repository/preference_repository.go`: CRUD untuk `user_notification_preferences`
- `internal/repository/settings_repository.go`: CRUD untuk `notification_settings`

Gunakan connection pool pgx dengan max 20 connection, prepared statements.

### 1.6 Implementasi Crypto

- `internal/infra/crypto/crypto.go`: AES-256-GCM encrypt/decrypt untuk kredensial (sama seperti `apps/web/src/lib/notification-crypto.ts`)

## Fase 2: External Channel Senders

### 2.1 Email (Resend)

- `internal/infra/email/resend.go`: Implementasi sender menggunakan `github.com/resend/resend-go/v3`
- Template email inline CSS, escape HTML, brand colors
- Fungsi: `SendMaintenanceReportCreatedEmail`, `SendMaintenanceReportUpdatedEmail`, `SendApprovalEmail`, `SendBookingRequestEmail`, `SendBookingRejectionEmail`, `SendChatNotificationEmail`, `SendPaymentReceivedEmail`, `SendReEngagementEmail`

### 2.2 WhatsApp

**KEPUTUSAN YANG PERLU DISEPAKATI:** Gunakan Meta Graph API (seperti kode existing) atau `go.mau.fi/whatsmeow` (sesuai `.kilo/rules/global-for-notifications.md`)?

- Meta Graph API: sudah ada template approved, tidak perlu register device baru
- whatsmeow: perlu register phone number via QR/OTP, tidak pakai template, lebih rumit setup

Rekomendasi: Gunakan **Meta Graph API** untuk sementara karena kode existing sudah menggunakannya dan template sudah approved. Migrasi ke whatsmeow bisa dilakukan terpisah.

Implementasi `internal/infra/whatsapp/whatsapp.go`:
- `SendMaintenanceWhatsApp`
- `SendApprovalWhatsApp`
- `SendRefundApprovalWhatsApp`

### 2.3 Telegram

- `internal/infra/telegram/telegram.go`: Implementasi sender menggunakan `gopkg.in/telegram-bot-api/telegram-bot-api.v5`
- Rate limiting 30 msg/detik via Redis

### 2.4 Web Push

- `internal/infra/push/webpush.go`: Implementasi sender menggunakan library web push (Go equivalent)
- Handle error 410 → hapus subscription dari DB

### 2.5 Dispatch Logic

- `internal/service/notification_service.go`:
  - `Dispatch(event)`: Ambil preferences, cek quiet hours, route ke channel yang enabled
  - Gunakan goroutine + WaitGroup untuk kirim paralel ke banyak channel
  - Recover panic di setiap goroutine
  - Log semua hasil (success/failure)
  - Implementasi `DispatchBatch` dengan streaming response
  - Implementasi helper dispatchers: `DispatchBookingReminder`, `DispatchPricingAlert`, `DispatchReferralReward`, `DispatchReferralStatusUpdate`, `DispatchReferralVoucherConverted`, `DispatchReferralOffsetApplied`, `DispatchGroupBookingInvite`, `DispatchGroupBookingUpdated`

## Fase 3: Client Integration (TypeScript)

### 3.1 Buat gRPC Client di `packages/shared`

Buat `packages/shared/src/lib/notification-grpc-client.ts`:

```typescript
import { Client } from "@grpc/grpc-js";
import { loadPackageDefinition } from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const PROTO_PATH = path.join(__dirname, "../../../../proto/konkosyuk/v1/notification.proto");
// Load proto at runtime (same pattern as apps/grpc)

export class NotificationGrpcClient {
  private client: Client;
  
  constructor(address: string) {
    // Setup client with loadPackageDefinition
  }
  
  async dispatch(event: NotificationEvent): Promise<DispatchResponse>
  async dispatchBatch(events: NotificationEvent[]): Promise<AsyncIterator<DispatchResponse>>
  async getUnreadCount(userId: string): Promise<number>
  async markRead(notificationId: string): Promise<void>
  async subscribePush(userId: string, subscription: PushSubscription): Promise<void>
  async getSettings(): Promise<NotificationSettings>
  async updateSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings>
  async getPreferences(userId: string): Promise<UserPreferences>
  async updatePreferences(userId: string, updates: Partial<UserPreferences>): Promise<void>
}
```

**PENTING:** `apps/web` dan `apps/cronJob` perlu menambahkan dependency `@grpc/grpc-js` dan `@grpc/proto-loader`.

### 3.2 Auth Mechanism untuk gRPC

- **Web → Notification Service**: Extract Better Auth session token dari request, passing via gRPC metadata key `authorization`
- **cronJob → Notification Service**: Gunakan shared secret `NOTIFICATION_SERVICE_SECRET`, passing via gRPC metadata key `x-service-secret`
- **Go service interceptor**: Validate token/secret sebelum proses RPC

### 3.3 Update `apps/web`

Ganti semua pemanggilan notification functions dengan gRPC client:

| File Lama | Fungsi yang Dipanggil | Aksi |
|-----------|----------------------|------|
| `src/lib/notification-service.ts` | `dispatchNotification`, `dispatchBookingReminder`, dll | Hapus, ganti dengan gRPC client |
| `src/lib/notifications.ts` | `createNotification`, `getUnreadCount`, `markAsRead`, `sendWebPushNotification` | Hapus, ganti dengan gRPC client |
| `src/lib/notifications/email.ts` | Semua email functions | Hapus |
| `src/lib/notifications/whatsapp.ts` | Semua WhatsApp functions | Hapus |
| `src/lib/notification-settings.ts` | `getNotificationSettings`, `upsertNotificationSettings` | Ganti dengan gRPC client |
| `src/lib/notification-crypto.ts` | `encryptNotificationValue`, `decryptNotificationValue` | Hapus (logic pindah ke Go) |
| `src/actions/reviews.ts` | `createNotification`, `sendWebPushNotification` | Ganti dengan `notificationClient.dispatch(...)` |
| `src/lib/referrals/verification.ts` | `dispatchReferralStatusUpdate` | Ganti dengan gRPC client |
| `src/app/api/notifications/route.ts` | `db.select().from(notifications)` | Ganti dengan `notificationClient.getUnreadCount()` atau tetap DB untuk list (lihat catatan) |

**Catatan untuk API Routes:**
- `GET /api/notifications` (list notifications): Bisa tetap akses DB langsung untuk performa, atau panggil gRPC `GetNotifications` (belum ada di proto). Jika tetap DB, tidak masalah karena ini read operation.
- `PATCH /api/notifications/[id]/read`: Panggil gRPC `MarkRead`
- `GET /api/notifications/preferences`: Panggil gRPC `GetPreferences`
- `PATCH /api/notifications/preferences`: Panggil gRPC `UpdatePreferences`
- `GET /api/admin/settings/notifications`: Panggil gRPC `GetSettings`
- `PUT /api/admin/settings/notifications`: Panggil gRPC `UpdateSettings`

### 3.4 Update `apps/cronJob`

Ganti semua pemanggilan notification functions dengan gRPC client:

| File Lama | Fungsi yang Dipanggil | Aksi |
|-----------|----------------------|------|
| `src/lib/notification-service.ts` | Semua dispatch functions | Hapus, ganti dengan gRPC client |
| `src/lib/notifications.ts` | `createNotification`, `getUnreadCount`, `markAsRead`, `sendWebPushNotification` | Hapus, ganti dengan gRPC client |
| `src/lib/notifications/email.ts` | Semua email functions | Hapus |
| `src/lib/notification-settings.ts` | `getNotificationSettings` | Hapus (cronJob tidak butuh settings, tapi jika ada pemanggilan, ganti) |
| `src/lib/cron/saved-search-matcher.ts` | `createNotification`, `sendWebPushNotification` | Ganti dengan `notificationClient.dispatch(...)` |
| `src/lib/cron/cleanup-bookings.ts` | `createNotification`, `sendWebPushNotification` | Ganti dengan `notificationClient.dispatch(...)` |
| `src/lib/referrals/verification.ts` | `dispatchReferralStatusUpdate` | Ganti dengan gRPC client |

### 3.5 Hapus Duplicate Code

Setelah migration selesai dan tested:
- Hapus `apps/web/src/lib/notification-service.ts`
- Hapus `apps/web/src/lib/notifications.ts`
- Hapus `apps/web/src/lib/notifications/email.ts`
- Hapus `apps/web/src/lib/notifications/whatsapp.ts`
- Hapus `apps/web/src/lib/notification-settings.ts`
- Hapus `apps/web/src/lib/notification-crypto.ts`
- Hapus `apps/cronJob/src/lib/notification-service.ts`
- Hapus `apps/cronJob/src/lib/notifications.ts`
- Hapus `apps/cronJob/src/lib/notifications/email.ts`

## Fase 4: Testing & Validation

### 4.1 Unit Tests Go Service

Buat test untuk:
- `internal/service/notification_service_test.go`: Test dispatch logic, preferences, quiet hours
- `internal/repository/*_test.go`: Test DB operations dengan testcontainers atau sqlmock
- `internal/infra/*/*_test.go`: Test email/WhatsApp/push senders (mock external API)

### 4.2 Integration Tests

- Test end-to-end: gRPC client → Go service → DB → external channel mock
- Test dari `apps/web`: Mock gRPC client, verify API routes still work

### 4.3 Validasi

Jalankan dari repo root:
```bash
echo "=== LINT ==="; bun run lint; echo "=== TYPECHECK ==="; bunx tsc --noEmit; echo "=== TESTS ==="; bun run test -- --run
```

## Fase 5: Deployment Config

### 5.1 Dockerfile

Buat `apps/notifications/Dockerfile` untuk deployment di Render (background worker pattern seperti `apps/cronJob`).

### 5.2 Environment Variables

Pastikan `.env.local` dan deployment config include:
- `DATABASE_URL` (sama dengan web/cronJob)
- `REDIS_URL` (sama dengan web/cronJob)
- `NOTIFICATION_ENCRYPTION_KEY` (base64 32-byte)
- `GRPC_PORT=50052`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `META_ACCESS_TOKEN`
- `META_PHONE_NUMBER_ID`
- `TELEGRAM_BOT_TOKEN` (opsional)
- `VAPID_PRIVATE_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `NOTIFICATION_SERVICE_SECRET` (untuk service-to-service auth dari cronJob)

### 5.3 Render Config

Buat `apps/notifications/render.yaml` untuk deploy sebagai Background Worker.

## Catatan & Risiko

1. **WhatsApp**: Ada perbedaan antara Meta Graph API (existing) dan whatsmeow (rules). Gunakan Meta Graph API untuk sementara.
2. **gRPC dari Next.js**: Bun/Node.js gRPC client (`@grpc/grpc-js`) bekerja di Next.js server components/API routes. Pastikan tidak ada import di client components.
3. **Performance**: gRPC call adds latency (~1-5ms lokal, lebih di production). Untuk high-throughput notifications, consider batching.
4. **Dual Write**: Selama migration, maintain backward compatibility. Jangan hapus code lama sebelum semua callers sudah migrated.
5. **Error Handling**: gRPC calls bisa gagal (network, timeout). Implement retry dengan exponential backoff di client.
6. **Connection Pooling**: Reuse gRPC client connection, jangan create new connection per request.

## Dependencies yang Perlu Ditambahkan

**apps/web:**
- `@grpc/grpc-js` (sudah ada di grpc, perlu ditambahkan ke web)
- `@grpc/proto-loader` (sudah ada di grpc, perlu ditambahkan ke web)

**apps/cronJob:**
- `@grpc/grpc-js`
- `@grpc/proto-loader`

**apps/notifications (Go):**
- Semua dependencies sudah ada di go.mod

## Urutan Eksekusi

1. Fase 1.1-1.6 (Proto + Go skeleton + DB repo + crypto)
2. Fase 2.1-2.5 (Email, WhatsApp, Telegram, Web Push, dispatch logic)
3. Fase 3.1-3.4 (TypeScript client + update web + update cronJob)
4. Fase 4 (Testing)
5. Fase 5 (Deployment config)
6. Cleanup duplicate code
