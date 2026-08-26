# KonkosYuk Cron Job Service

Standalone BullMQ worker service untuk KonkosYuk. Menjalankan background jobs untuk:

- **Cleanup Expired Bookings** - Membatalkan booking yang tidak dibayar dalam 6 jam
- **Complete Expired Bookings** - Menyelesaikan booking yang sudah melewati endDate
- **Saved Search Matcher** - Mencocokan properti baru dengan pencarian tersimpan
- **Update Area Counts** - Memperbarui jumlah properti per area
- **Process Expired Refunds** - Memproses refund otomatis untuk pembayaran expired
- **Referral Eligibility Sweep** - Memverifikasi eligibility referral setelah 5 hari
- **Churn Prediction** - Mengirim email re-engagement untuk user tidak aktif

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string (BullMQ) |
| `BETTER_AUTH_SECRET` | Auth secret (min 32 chars) |
| `CRON_SECRET` | Cron secret (min 32 chars) |
| `PAYMENT_CONFIG_ENCRYPTION_KEY` | Payment config encryption key |
| `RESEND_API_KEY` | Resend API key untuk email |
| `RESEND_FROM_EMAIL` | Default from email |
| `DIDIT_API_KEY` | Didit API key |
| `DIDIT_WEBHOOK_SECRET` | Didit webhook secret |
| `NOTIFICATION_ENCRYPTION_KEY` | Base64-encoded 32-byte key untuk enkripsi credentials |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key untuk web push |
| `VAPID_PRIVATE_KEY` | VAPID private key untuk web push |

## Development

```bash
# Install dependencies
bun install

# Run in development mode (with hot reload)
bun run dev

# Run in production mode
bun run start
```

## Deployment

Service ini di-deploy sebagai Background Worker di Render. Lihat `render.yaml` untuk konfigurasi.

## Arsitektur

```
src/
├── workers/
│   ├── index.ts              # Entry point
│   ├── main.worker.ts        # Worker registration
│   ├── scheduler.ts          # BullMQ repeat job scheduler
│   └── processors/           # Job processors
├── lib/
│   ├── queue/
│   │   └── queues.ts         # BullMQ queue definitions
│   ├── redis.ts              # Redis connection
│   ├── cron/                 # Business logic untuk cron jobs
│   ├── notifications/        # Email & push notification
│   ├── referrals/            # Referral verification logic
│   ├── audit-log.ts          # Audit logging
│   ├── notification-settings.ts
│   └── notification-crypto.ts
└── db/
    └── index.ts              # Database connection
```
