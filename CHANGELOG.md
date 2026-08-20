# Ringkasan Perubahan

## Verifikasi
- **Lint**: 0 error, 17 warning (pre-existing, tidak ada error baru)
- **TypeScript**: 0 type error
- **TODO/FIXME**: 0
- **Tests**: 108 passed
- **Console.log debug**: 0 tertinggal

## Tabel Perubahan

| File | Perubahan | Alasan |
|------|-----------|--------|
| `src/actions/upload.ts` | Tambah `VALID_UPLOAD_TYPES` termasuk `"inspection"`, perbaiki validasi WebP magic bytes (cek `"WEBP"` di offset 8-11), tambah CSRF validation via `validateActionCsrf(formData)` | Bug A: type `"inspection"` ditolak karena tidak ada di array validasi. Bug B: CSRF protection hilang di server action. |
| `src/lib/api-auth.ts` | Tambah helper `validateActionCsrf(formData)` yang baca CSRF token dari FormData dan cocokkan dengan cookie `csrf_token` | Diperlukan untuk melindungi server action dari CSRF attack, consiten dengan pattern API route. |
| `src/components/property/property-images-upload.tsx` | Tambah `formData.append("csrf", getCsrfToken())` sebelum upload | Memastikan CSRF token terkirim ke server action. |
| `src/components/reports/report-form.tsx` | Tambah `formData.append("csrf", getCsrfToken())` sebelum upload | Memastikan CSRF token terkirim ke server action. |
| `src/components/inspection/inspection-photo-upload.tsx` | Tambah `formData.append("csrf", getCsrfToken())` sebelum upload | Memastikan CSRF token terkirim ke server action. |
| `src/actions/reviews.ts` | Ganti reputation score calculation dari read-modify-write yang race-prone menjadi SATU atomic SQL `UPDATE ... SET reputation_score = (SELECT AVG(...))`, tambah `invalidateCacheByTag("reviews")` di semua mutasi (create, update, delete, reply) | Race condition saat concurrent review menyebabkan score salah. Cache invalidation hilang menyebabkan data stale. |
| `src/lib/form-data-utils.ts` | Buat helper baru `parseJsonArrayField(formData, key)` yang validate JSON array dan throw error jelas jika invalid | JSON parsing sebelumnya silent-fail ke empty array, menyembunyikan error dari client. |
| `src/actions/properties.ts` | Ganti semua `JSON.parse` inline untuk array fields (`images`, `amenities`, `units`) dengan `parseJsonArrayField`, tambah error handling untuk packages/metadata JSON invalid, tambah `createPropertyWithUnitsAction` dengan DB transaction | Hardening FormData parsing agar tidak silent-fail. Property wizard refactor untuk atomic property+units creation. |
| `src/components/owner/property-wizard.tsx` | Restore & refactor: ganti loop `createUnitAction` + `deletePropertyAction` fallback menjadi single `createPropertyWithUnitsAction`, ganti `uploadFile` client-side menjadi `uploadImageAction` dengan CSRF token | Menghindari property orphan di DB jika unit gagal. Upload images kini lolos auth + validasi server. |
| `src/lib/redis.ts` | Hapus `IoredisClient`, hapus provider `redis-cloud` dan `local`, tetap `UpstashClient` + `MemoryClient` | Opsi A: fokus Vercel deployment, hapus dependency duplikat `ioredis`. |
| `web/package.json` | Hapus dependency `ioredis` | Dependency duplikat tidak diperlukan untuk Vercel-only deployment. |
| `web/docker-compose.yml` | **Dihapus** | Opsi A: abaikan Docker self-hosted deployment. |
| `src/lib/env.ts` | Hapus `REDIS_CLOUD_URL` dan `REDIS_URL` dari env schema | Konsisten dengan Vercel-only, hanya Upstash Redis. |
| `web/.env.example` | Ganti contoh Redis env vars menjadi `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN` | Dokumentasi konsisten dengan perubahan. |
| `web/.env.local` | Hapus `REDIS_CLOUD_URL` dan `REDIS_URL` yang stale | Cleanup env vars yang tidak digunakan. |
| `web/docs/DEPLOYMENT.md` | Hapus section Docker, update Redis secrets dan troubleshooting | Dokumentasi konsisten dengan Vercel-only deployment. |
| `web/README.md` | Update contoh Redis env vars di README | Dokumentasi konsisten. |
| `web/.github/workflows/ci.yml` | Hapus `REDIS_URL` dari env global dan deploy job | CI tidak perlu Redis self-hosted lagi. |
| `AGENTS.md` | Update referensi Redis dari `REDIS_URL` ke `UPSTASH_REDIS_REST_URL/TOKEN` | Dokumentasi monorepo konsisten. |
| `web/AGENTS.md` | Update referensi Redis | Dokumentasi web konsisten. |
