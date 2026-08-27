# Aturan Pengembangan Notification Service (Go)

## 1. Konteks dan Peran

`apps/notifications/` adalah layanan notifikasi mandiri yang ditulis dalam **Go**
(modul: `notif`). Layanan ini menggantikan logika notifikasi yang sebelumnya
terdistribusi di `apps/cronJob` dan `apps/web`. Empat channel utama yang didukong:

- **Email** — via Resend (`github.com/resend/resend-go/v3`)
- **WhatsApp** — via `go.mau.fi/whatsmeow` (bukan Baileys/Node.js)
- **Telegram** — via `gopkg.in/telegram-bot-api/telegram-bot-api.v5`
- **Web Push** — ke browser subscribers via VAPID
- **In-App** — database PostgreSQL (schema di `packages/shared/src/db/schema.ts`)

## 2. Teknologi

| Layer          | Library                                         |
| -------------- | ----------------------------------------------- |
| Runtime        | Go 1.26+                                        |
| HTTP/WebSocket | `github.com/coder/websocket`                    |
| Email          | `github.com/resend/resend-go/v3`                |
| WhatsApp       | `go.mau.fi/whatsmeow`                           |
| Telegram       | `gopkg.in/telegram-bot-api/telegram-bot-api.v5` |
| AI/Template    | `github.com/openai/openai-go/v3`                |
| Logger         | `github.com/rs/zerolog`                         |
| Database       | `github.com/jack/pgx/v5` (PostgreSQL driver)    |
| Cache/Queue    | `github.com/redis/go-redis/v9` (Redis client)   |
| UUID           | `github.com/google/uuid`                        |
| JSON           | `github.com/tidwall/gjson` / `sjson`            |

## 3. Arsitektur

### Folder Structure yang Wajib

```
apps/notifications/
├── cmd/
│   └── server/              # main.go — gRPC server entry point
├── internal/
│   ├── delivery/            # gRPC handler + DTO (protobuf-generated)
│   ├── service/             # business logic (dispatch, routing, preferences)
│   ├── repository/          # DB access (notifications, push_subscriptions, settings)
│   ├── infra/
│   │   ├── resend/          # Resend email client
│   │   ├── whatsapp/        # WhatsApp client (whatsmeow session)
│   │   ├── telegram/        # Telegram Bot API client
│   │   ├── push/            # Web Push (VAPID)
│   │   └── crypto/          # AES-256-GCM enkripsi kredensial
│   ├── domain/              # entity dan interface
│   └── config/              # env config + viper
├── proto/                   # proto definitions (ikonik: notification.proto)
├── go.mod
└── go.sum
```

### Design Pattern

- Gunakan **repository pattern** — `repository/` interface dipakai `service/`, implement di `infra/`
- Gunakan **dependency injection** — service menerima interface, bukan concrete struct
- Gunakan **domain-driven** — entity di `domain/`, usecase di `service/`
- Gunakan **Redis** untuk message queue (pub/sub) dan rate limiting per channel
- Ekspor gRPC service — semua layanan lain (web, gRPC server, cronJob) terhubung via gRPC
- Semua error wrapping pakai `fmt.Errorf("...: %w", err)` (Go 1.13+ style)
- Semua error wrapping pakai `fmt.Errorf("...: %w", err)` (Go 1.13+ style)

## 4. Logger (zerolog)

```go
import "github.com/rs/zerolog"

var log = zerolog.New(os.Stderr).With().Timestamp().Logger()

log.Info().Str("user_id", userId).Msg("notifikasi terkirim")
log.Error().Err(err).Str("channel", "email").Msg("gagal kirim email")
```

- **Wajib** log semua send attempt dan failure
- JANGAN log kredensial (API key, token, VAPID private key) — zerolog otomatis akan
  menampilkan string, jadi pastikan filter sebelum log
- Gunakan structured logging — jangan pakai `fmt.Printf` di production

## 5. Environment Variables

| Variable                       | Wajib    | Deskripsi                                                          |
| ------------------------------ | -------- | ------------------------------------------------------------------ |
| `DATABASE_URL`                 | Ya       | PostgreSQL connection string (gunakan pgx driver)                  |
| `REDIS_URL`                    | Ya       | Redis connection string (gunakan go-redis/v9)                      |
| `NOTIFICATION_ENCRYPTION_KEY`  | Ya       | Base64-encoded 32-byte key (AES-256-GCM) untuk enkripsi kredensiel |
| `GRPC_PORT`                    | Opsional | gRPC server port. Default `50052`                                  |
| `RESEND_API_KEY`               | Opsional | Resend API key (fallback jika DB settings kosong)                  |
| `RESEND_FROM_EMAIL`            | Opsional | Default from email                                                 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Opsional | VAPID public key                                                   |
| `VAPID_PRIVATE_KEY`            | Opsional | VAPID private key (server-only)                                    |
| `WHATSAPP_DEVICE_ID`           | Opsional | WhatsApp device/session identifier                                 |
| `TELEGRAM_BOT_TOKEN`           | Opsional | Telegram Bot API token                                             |
| `PORT`                         | Opsional | Default `8080`                                                     |

## 6. Notification Event

```go
type NotificationEvent struct {
    UserID       string            `json:"userId"`
    Type         string            `json:"type"`           // lihat NOTIFICATION_TYPES
    Category     string            `json:"category"`       // booking, payment, maintenance, dll
    Priority     string            `json:"priority"`       // low, normal, high, urgent
    Title        string            `json:"title"`
    Message      string            `json:"message"`
    ActionURL    string            `json:"actionUrl,omitempty"`
    ActionLabel  string            `json:"actionLabel,omitempty"`
    ReferenceID  string            `json:"referenceId,omitempty"`
    ReferenceType string           `json:"referenceType,omitempty"`
    Metadata     map[string]any    `json:"metadata,omitempty"`
}
```

### Categories

`booking`, `payment`, `maintenance`, `inspection`, `chat`, `review`, `system`

### Priority

`low`, `normal`, `high`, `urgent` — `urgent` melewati quiet hours

## 7. Dispatch Flow

```
dispatchNotification(event)
  1. Ambil user_notification_preferences dari DB
  2. Cek quiet hours (kecuali urgent)
  3. Cek email digest (immediate/daily/weekly/never)
  4. Routing ke channel yang di-enable:
     - in-app → simpan ke tabel notifications
     - email → kirim via Resend
     - push → kirim via webpush
     - whatsapp → kirim via whatsmeow
     - telegram → kirim via Telegram Bot API
  5. Log semua hasil (success/failure) di masing-masing channel
  6. Return summary
```

### Error Handling

- Gunakan `sync.WaitGroup` untuk kirim ke banyak channel paralel
- Tangkap panic di setiap goroutine dengan `defer func() { recover() }()`
- Jika satu channel gagal, channel lain tetap dikirim
- Web Push error 410 (subscription expired) → hapus dari DB
- WhatsApp/Telegram jika belum terhubung → log warning, skip kirim, jangan crash

## 8. Email (Resend)

### Client Initialization

```go
resendClient := resend.New(os.Getenv("RESEND_API_KEY"))
```

### Template Rules

- Semua HTML email pakai inline CSS
- Warna brand: link biru `#2563eb`, heading merah `#dc2626` untuk rejection
- Escape HTML pada semua user input
- Footer standar: "Email ini dikirim secara otomatis oleh sistem KonkosYuk."

### Email Functions

| Function                       | Untuk                           |
| ------------------------------ | ------------------------------- |
| `SendMaintenanceReportCreated` | Owner — laporan masalah baru    |
| `SendMaintenanceReportUpdated` | Owner — status laporan diupdate |
| `SendApprovalEmail`            | Tenant — booking disetujui      |
| `SendBookingRequestEmail`      | Owner — booking baru            |
| `SendBookingRejectionEmail`    | Tenant — booking ditolak        |
| `SendChatNotificationEmail`    | User — pesan chat baru          |
| `SendPaymentReceivedEmail`     | Owner — pembayaran diterima     |

## 9. WhatsApp (whatsmeow)

### Session Management

- whatsmeow session persistent — simpan OTP/auth file di filesystem atau database
- Auto-reconnect pada koneksi terputus
- Jika belum terhubung, skip kirim WhatsApp dan log warning

### Kirim Pesan

```go
msg := &waE2PAGraphQL.Text{Text: "Pesan notifikasi..."}
reply, err := client.Send(ctx, msg, waCommon.JID{...})
```

### Error Handling

- Jika nomor belum terdaftar di WhatsApp → log error, jangan crash
- Rate limit: WhatsApp membatasi kecepatan kirim — queue pesan dan rate-limit

## 10. Telegram (Bot API)

### Inisialisasi

```go
bot, err := tgbotapi.NewBotAPI(os.Getenv("TELEGRAM_BOT_TOKEN"))
```

### Kirim Pesan

```go
msg := tgbotapi.NewMessage(chatID, "Pesan notifikasi...")
msg.ParseMode = tgbotapi.ModeHTML
_, err := bot.Send(msg)
```

### Error Handling

- Jika token tidak valid → log error, jangan crash
- Jika user belum start bot → log warning, skip kirim
- Rate limit: Telegram membatasi 30 pesan/detik per bot — gunakan Redis untuk rate limiting

## 11. Web Push

### Flow

1. Client subscribe via `PushManager.subscribe()` di browser
2. Browser kirim subscription ke web/gRPC server → forward ke notification service via gRPC `SubscribePush`
3. Simpan subscription ke tabel `push_subscriptions`
4. Kirim via webpush dengan VAPID keys
5. Handle error 410 → hapus subscription dari DB

### Payload Format

```json
{ "title": "Judul", "message": "Isi pesan", "icon": "/icon-192.png" }
```

## 12. Database Schema

Schema didefinisikan di `packages/shared/src/db/schema.ts`:

| Tabel                           | Deskripsi                                                       |
| ------------------------------- | --------------------------------------------------------------- |
| `notifications`                 | In-app notification records                                     |
| `push_subscriptions`            | Browser push subscription                                       |
| `notification_settings`         | Global settings (Resend API key ter-enkripsi, WhatsApp session) |
| `user_notification_preferences` | Per-user channel toggles + quiet hours + digest                 |

- Gunakan connection pool (max 20 connection)
- Semua query gunakan prepared statements
- `ON DELETE CASCADE` pada FK user

## 13. Enkripsi

### Kredensial

- Resend API key, Meta access token, VAPID private key, Telegram Bot Token — **WAJIB** enkripsi
  sebelum disimpan ke `notification_settings`
- Enkripsi via AES-256-GCM
- `NOTIFICATION_ENCRYPTION_KEY` = base64-encoded 32-byte key

### VAPID Keys

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — boleh expose ke client
- `VAPID_PRIVATE_KEY` — **WAJIB** server-side only

## 14. gRPC Service

### Proto Definition

Proto file didefinisikan di `proto/konkosyuk/v1/notification.proto`. Jangan edit
di `src/gen/` — generate ulang via `bun run proto:gen` dari repo root.

### Service Definition

```protobuf
service NotificationService {
  rpc Dispatch(NotificationEvent) returns (DispatchResponse);
  rpc DispatchBatch(DispatchBatchRequest) returns (stream DispatchResponse);
  rpc GetUnreadCount(GetUnreadCountRequest) returns (GetUnreadCountResponse);
  rpc MarkRead(MarkReadRequest) returns (MarkReadResponse);
  rpc SubscribePush(SubscribePushRequest) returns (SubscribePushResponse);
  rpc GetSettings(google.protobuf.Empty) returns (NotificationSettingsResponse);
  rpc UpdateSettings(UpdateNotificationSettingsRequest) returns (NotificationSettingsResponse);
}
```

### Client Connection

- Semua layanan lain (web, gRPC server, cronJob) connect ke notification service via gRPC
- Gunakan connection pooling — reuse `grpc.Dial` connection
- Interceptor untuk auth: Bearer token via Better Auth session
- TLS: non-TLS untuk development, TLS untuk production

### Dispatch Flow (gRPC)

```
client (web/grpc/cronJob) → gRPC Dispatch(event)
  1. Validasi input (protobuf schema)
  2. Auth check via interceptor
  3. dispatchNotification(event)
  4. Return DispatchResponse { success, channel_results, errors }
```

### Response Shape

```go
message DispatchResponse {
  bool success = 1;
  map<string, bool> channel_results = 2;  // email: true, push: false, dll
  string error = 3;
}
```

### Endpoints

| Method | gRPC Service                         | Auth               | Deskripsi                      |
| ------ | ------------------------------------ | ------------------ | ------------------------------ |
| POST   | `NotificationService.Dispatch`       | service-to-service | Dispatch satu notifikasi       |
| POST   | `NotificationService.DispatchBatch`  | service-to-service | Dispatch batch (streaming)     |
| POST   | `NotificationService.SubscribePush`  | user token         | Simpan push subscription       |
| GET    | `NotificationService.GetSettings`    | admin              | Get notification settings      |
| PUT    | `NotificationService.UpdateSettings` | admin              | Update notification settings   |
| GET    | `NotificationService.GetUnreadCount` | user token         | Hitung notifikasi belum dibaca |
| POST   | `NotificationService.MarkRead`       | user token         | Tandai notifikasi dibaca       |

## 15. Security

- Kredensial **WAJIB** enkripsi sebelum disimpan — jangan pernah plaintext
- VAPID private key **WAJIB** di env, jangan expose ke client
- Admin endpoints butuh validasi role admin
- Semua input escapd (HTML untuk email, JSON untuk API)
- Gunakan `constant-time` comparison untuk token/verification kode
- Jangan pernah log kredensial — filter sebelum logger

## 16. Concurrency & Performance

- Gunakan goroutine untuk kirim ke banyak channel paralel
- Gunakan worker pool (`runtime.NumCPU`) untuk batch dispatch
- Gunakan **Redis** untuk message queue (pub/sub) dan rate limiting per channel
- gRPC server: set `MaxRecvMsgSize` dan `MaxSendMsgSize` ke 16MB untuk batch payload
- Rate limit per channel:
  - Email (Resend): 10 req/s
  - WhatsApp: 5 req/s per nomor
  - Telegram: 30 pesan/detik per bot
  - Push: burst 100/s
- Quiet hours cek berdasarkan timezone user (`user_notification_preferences.timezone`)

## 17. Catatan Tambahan

- Semua perubahan wajib dicatat di `CHANGELOG.md` pakai Tanggal `dd-MMM-yyyy hh:mm` (di root monorepo)
- Notification types dan enum didefinisikan di `packages/shared/src/db/schema.ts` — jangan redefine di sini
- Database connection string harus sama dengan `apps/cronJob` dan `apps/web`
- Jika mengganti sistem notifikasi yang ada, pastikan backward compatibility dengan cronJob yang masih mengirim ke web push / email
- Wajib menulis unit test untuk setiap service function, gunakan `testing` package dan mock DB/Redis
- Gunakan `golangci-lint` untuk linting, dan `go test -race` untuk race condition detection
