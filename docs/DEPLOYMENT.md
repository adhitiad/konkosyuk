# Deployment Guide

## Vercel (Web App)

Root Directory harus di-set ke `apps/web` di Vercel project settings.

Build command: `bun run build`
Output directory: `.next`

Environment variables wajib:
- `DATABASE_URL`
- `REDIS_URL` (format ioredis/TCP, bukan Upstash REST)
- `BETTER_AUTH_SECRET` (≥32 chars)
- `NEXT_PUBLIC_APP_URL`
- `RESEND_API_KEY` — untuk notifikasi email
- `VAPID_PRIVATE_KEY` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — untuk web push notification

## Notifications

Semua logika notifikasi (email, push, in-app) berjalan langsung di dalam web app menggunakan:
- **Resend** untuk email
- **web-push** untuk push notification
- **Database** untuk in-app notifications dan preferences

Tidak ada service notifikasi terpisah. Konfigurasi notifikasi disimpan di tabel `notification_settings` dan dapat diubah melalui halaman admin.

## Catatan Penting

- Web app berjalan 100% di Vercel sebagai serverless functions.
- Tidak ada long-running worker atau background service yang perlu di-deploy secara terpisah.
- Cron jobs yang membutuhkan scheduling dapat diimplementasikan menggunakan Vercel Cron Jobs.