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

## Render (Background Worker BullMQ)

Worker ini berjalan di Render sebagai Background Worker service menggunakan Docker.

### Konfigurasi Render

- **Root Directory**: `.` (repo root, bukan `apps/web`)
- **Dockerfile Path**: `apps/web/Dockerfile.worker`
- **Environment**: Docker
- **Plan**: Background Worker (atau Starter jika tidak butuh background worker khusus)

### Environment Variables

- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — ioredis format (contoh Upstash: `rediss://default:<token>@<endpoint>.upstash.io:6379`)
- Payment gateway secrets yang dipakai processor (`DOKU_WEBHOOK_SECRET`, `IPAYMU_API_KEY`, `NICEPAY_MERCHANT_KEY`, dst)
- `BETTER_AUTH_SECRET` jika worker butuh akses auth
- `NEXT_PUBLIC_APP_URL` jika worker butuh generate URL

### Health Check

Render Background Worker tidak expose HTTP port. Health check-nya lewat log dan metrics:
- Pastikan log muncul: `Memulai BullMQ worker...` lalu `Worker started successfully`
- Render akan restart otomatis jika proses exit dengan kode non-zero
- Monitor via Render dashboard: CPU/memory usage dan restart count

### Catatan Penting

Web app (Vercel) dan worker (Render) **harus** connect ke Redis instance yang sama. BullMQ producer di server actions dan consumer di worker wajib share Redis yang sama, atau job yang di-enqueue dari Vercel tidak akan pernah diproses worker di Render.
