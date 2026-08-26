# WhatsApp Service Plan — `apps/wa`

## Tujuan

Membangun layanan WhatsApp bot & notification untuk KonkosYuk menggunakan Baileys (WhatsApp Web API) + Hono (HTTP server). Layanan ini menerima webhook dari `apps/web` untuk notifikasi outgoing dan menangani pesan incoming dari penyewa/owner.

## Arsitektur

```
apps/wa/
├── src/
│   ├── index.ts              # Entry point: Hono server + Baileys init
│   ├── config.ts             # Environment variables & constants
│   ├── wa/
│   │   ├── client.ts         # Baileys socket initialization & event handlers
│   │   ├── session.ts        # Database-backed session (load/save ke Postgres)
│   │   └── message-handler.ts # Router pesan incoming ke command handler
│   ├── commands/
│   │   ├── index.ts          # Registry semua command
│   │   ├── cek-booking.ts
│   │   ├── cek-pembayaran.ts
│   │   ├── perpanjang-sewa.ts
│   │   ├── lapor-keluhan.ts
│   │   └── laporan-keuangan.ts
│   ├── webhooks/
│   │   ├── index.ts          # Webhook receiver endpoint
│   │   └── handlers.ts       # Handler per tipe notifikasi
│   ├── services/
│   │   ├── db.ts             # Drizzle client / query helper
│   │   └── formatter.ts      # Format pesan WA (template)
│   └── lib/
│       └── logger.ts         # Logger (sesuai aturan: no console.error)
├── drizzle.config.ts         # Drizzle config untuk session storage
├── package.json
├── tsconfig.json
└── vercel.json               # Vercel deployment config
```

## Komponen Utama

### 1. Session Management (`src/wa/session.ts`)

- Gunakan `postgres` adapter untuk menyimpan session Baileys ke database KonkosYuk yang sama
- Implement custom `AuthenticationCreds` storage yang read/write ke tabel `wa_session`
- Tabel `wa_session` menyimpan: `id`, `data` (jsonb), `updated_at`
- Saat startup: load session dari DB → jika ada, skip QR scan
- Saat session update: upsert ke DB

### 2. Baileys Client (`src/wa/client.ts`)

- Initialize Baileys dengan `makeWASocket` menggunakan custom storage
- Handle events: `messages.upsert` (incoming), `connection.update` (status koneksi)
- Auto-reconnect saat disconnect
- Kirim pesan via `socket.sendMessage()`

### 3. Webhook Receiver (`src/webhooks/`)

Endpoint `POST /webhook/notify` menerima payload dari `apps/web`:

```ts
// Schema payload
{
  type: 'booking_baru' | 'pembayaran_masuk' | 'pembayaran_gagal' | 'sewa_hampir_habis',
  target: { phone: string, name: string },
  data: Record<string, unknown>
}
```

- Validasi payload dengan Zod
- Format pesan sesuai tipe notifikasi
- Kirim via Baileys socket

### 4. Command Handler (`src/commands/`)

Parser pesan incoming berdasarkan keyword:

| Command | Handler | Deskripsi |
|---------|---------|-----------|
| `CEK BOOKING` | `cek-booking.ts` | Cek status booking aktif |
| `BAYAR` / `PAYMENT` | `cek-pembayaran.ts` | Cek tagihan & status pembayaran |
| `PERPANJANG` | `perpanjang-sewa.ts` | Perpanjang masa sewa |
| `KELUHAN` | `lapor-keluhan.ts` | Lapor keluhan/masalah |
| `LAPORAN` | `laporan-keuangan.ts` | (Owner) Laporan keuangan bulanan |

- Identifikasi user berdasarkan nomor WA → lookup di tabel users/bookings
- Response format: text message dengan data dari database

### 5. Database Access (`src/services/db.ts`)

- Reuse Drizzle schema dari `apps/web/src/db/schema.ts` (import via shared package atau duplikasi minimal)
- Query yang dibutuhkan:
  - Lookup user by phone
  - Get active booking by user
  - Get payment status by user
  - Get monthly revenue by owner

## Environment Variables

```env
DATABASE_URL=postgres://...          # Sama dengan apps/web
WA_WEBHOOK_SECRET=secret-token       # Verifikasi webhook dari apps/web
PORT=3000                            # Port Hono server
```

## Implementasi Step-by-Step

### Step 1: Setup & Config
- Update `package.json` scripts: `dev`, `build`, `start`
- Buat `src/config.ts` untuk env validation dengan Zod
- Buat `vercel.json` untuk deployment

### Step 2: Database Session Storage
- Buat tabel `wa_session` (migration via `db:push`)
- Implement `src/wa/session.ts` — load/save session ke Postgres

### Step 3: Baileys Client
- Implement `src/wa/client.ts` — init socket, handle connection events
- Integrate custom session storage

### Step 4: Webhook Receiver
- Implement `src/webhooks/index.ts` — endpoint POST
- Implement `src/webhooks/handlers.ts` — format & kirim notifikasi
- Tambahkan secret verification

### Step 5: Command Handler & Commands
- Implement `src/wa/message-handler.ts` — routing pesan ke command
- Implement semua command di `src/commands/`
- Implement `src/services/formatter.ts` untuk template pesan

### Step 6: Entry Point & Integration
- Implement `src/index.ts` — Hono routes + Baileys init
- Pastikan webhook dari `apps/web` bisa reach service ini

## Validasi

- `bun run lint` — tidak ada error
- `bun x tsc --noEmit` — typecheck pass
- Test webhook: `curl -X POST localhost:3000/webhook/notify` dengan payload valid
- Test bot: kirim pesan ke nomor WA yang terhubung

## Catatan

- Baileys memerlukan scan QR pertama kali — pastikan ada mekanisme untuk menampilkan QR (via log atau endpoint khusus)
- Vercel serverless tidak ideal untuk persistent WebSocket Baileys — pertimbangkan deploy ke Railway/Render atau gunakan Vercel Functions dengan konfigurasi khusus
- Pastikan tidak expose `WA_WEBHOOK_SECRET` ke client
