# Hasil Verifikasi Issue Rendah

## R-1: Format REDIS_URL di .env.example

- Status: DIPERBAIKI
- Detail:
  - Ditambahkan komentar penjelasan format ioredis binary (bukan REST)
  - Ditambahkan contoh format: `rediss://default:AxJz...@us1-abc.upstash.io:6379`
  - Ditambahkan catatan: JANGAN gunakan `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`
  - Tidak ada referensi `UPSTASH_REDIS_REST_URL` atau `UPSTASH_REDIS_REST_TOKEN` di `.env.example`

## R-2: Sisa node-cron

- Status: OK
- Detail: Tidak ada sisa `node-cron` di source code. Package sudah dihapus dari `package.json`. Sisa referensi hanya di dokumentasi (`CHANGELOG.md`, `DEPLOYMENT.md`) yang mencatatkan proses removal.

## R-3: Evaluasi axios vs fetch

- Status: PERTAHANKAN
- Detail:
  - `axios` dipakai di 20+ file (komponen, hooks, lib payments, lib axios)
  - `src/lib/axios.ts` mendefinisikan `apiClient` dan `publicClient` dengan interceptor untuk CSRF token injection, error normalization, dan 401 handling
  - Payment gateway modules (`doku.ts`, `ipaymu.ts`, `nicepay.ts`, `gateway-manager.ts`) memakai axios instance khusus dengan timeout dan `AxiosError` typing
  - Migrasi ke fetch native membutuhkan rewrite seluruh interceptor, error handling, dan 20+ call sites — berisiko tinggi untuk scope rendah
  - Ditambahkan komentar `R-3 note` di `src/lib/axios.ts` yang menjelaskan alasan pertahanan

## R-4: Penggunaan dotenv

- Status: PERTAHANKAN
- Detail:
  - `dotenv` dipakai di file yang dijalankan di LUAR Next.js runtime:
    - `drizzle.config.ts` — Drizzle CLI butuh env untuk koneksi DB
    - `scripts/` — seed, baseline, encrypt scripts dijalankan via CLI
    - `src/scripts/seed-*.ts` — seed scripts dijalankan via `bun run` CLI, bukan oleh Next.js
  - Tidak ada `dotenv` di `src/app/`, `src/middleware.ts`, atau file runtime Next.js lainnya
  - Semua usage legitimate, tidak perlu dihapus
