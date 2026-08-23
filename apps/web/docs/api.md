# API Documentation

> **Base URL:** `https://api.konkosyuk.com`  
> **Development:** `http://localhost:3000`  
> **Format:** JSON  
> **Authentication:** Session-based (HttpOnly cookies) atau Bearer token untuk webhook/cron

## Response Format

Semua response success:

```json
{
  "success": true,
  "data": { ... }
}
```

Response error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "email: Email tidak valid",
    "details": [ ... ]
  }
}
```

---

## Kategori Endpoint

### 1. Webhooks

Base Path: `/api/webhooks`, `/api/kyc/webhook`

| Method | Endpoint | Deskripsi | Auth | Rate Limit |
|--------|----------|-----------|------|------------|
| POST | `/api/webhooks/[provider]` | Webhook payment gateway | Signature verification | 50 req/menit |
| POST | `/api/webhooks/mock` | Mock webhook testing | Mock mode only | 50 req/menit |
| POST | `/api/kyc/webhook` | KYC status webhook (Didit) | HMAC signature | 50 req/menit |

### 2. Auth Callbacks

Base Path: `/api/auth`

| Method | Endpoint | Deskripsi | Auth | Rate Limit |
|--------|----------|-----------|------|------------|
| ANY | `/api/auth/[...all]` | Better Auth handler | Session cookie | 10 req/menit |
| GET | `/api/auth/ably-token` | Ably JWT token | Session required | 10 req/menit |
| GET | `/api/auth/ably-config` | Ably client config | Session required | 10 req/menit |
| POST | `/api/auth/update-profile` | Update profil user | Session required | 10 req/menit |

### 3. Public API (Mobile / External)

Base Path: `/api/properties`, `/api/units`, `/api/ads`, `/api/health`, dll

| Method | Endpoint | Deskripsi | Auth | Rate Limit |
|--------|----------|-----------|------|------------|
| GET | `/api/properties` | Daftar properti | Public | 60 req/menit |
| GET | `/api/properties/[id]` | Detail properti | Public | 60 req/menit |
| GET | `/api/properties/[id]/units` | Unit properti | Public | 60 req/menit |
| GET | `/api/properties/[id]/ratings` | Rating properti | Public | 60 req/menit |
| GET | `/api/units` | Daftar unit | Public | 60 req/menit |
| GET | `/api/units/[id]` | Detail unit | Public | 60 req/menit |
| GET | `/api/ads` | Daftar iklan | Public | 60 req/menit |
| POST | `/api/ads/submit` | Submit iklan | CSRF token | 60 req/menit |
| POST | `/api/ads/[id]/click` | Track klik iklan | Public | 60 req/menit |
| GET | `/api/campus-areas` | Area kampus | Public | 60 req/menit |
| GET | `/api/popular-areas` | Area populer | Public | 60 req/menit |
| GET | `/api/comparisons` | Perbandingan properti | Public | 60 req/menit |
| GET | `/api/comparisons/[id]` | Detail perbandingan | Public | 60 req/menit |
| GET | `/api/feature-flags/[key]` | Feature flag | Public | 60 req/menit |
| GET | `/api/health` | Health check | Public | 60 req/menit |
| GET | `/api/health/db` | DB health | Public | 60 req/menit |
| GET | `/api/health/payment` | Payment health | Public | 60 req/menit |
| GET | `/api/health/storage` | Storage health | Public | 60 req/menit |
| POST | `/api/newsletter/subscribe` | Subscribe newsletter | Public | 60 req/menit |
| POST | `/api/upload` | Upload file | Session required | 60 req/menit |
| GET | `/api/csrf` | CSRF token | Session cookie | 60 req/menit |
| GET | `/api/proxy/wilayah/[...path]` | Proxy wilayah | Public | 60 req/menit |

### 4. Cron Jobs

Cron jobs sekarang berjalan di Render sebagai Background Worker (BullMQ + Redis), bukan melalui API Route.

### 5. Admin API

Base Path: `/api/admin`

> Semua endpoint admin memerlukan role `admin` atau `staff`.

| Method | Endpoint | Deskripsi | Auth | Rate Limit |
|--------|----------|-----------|------|------------|
| GET | `/api/admin/users` | Daftar user | Admin/Staff | 20 req/menit |
| GET | `/api/admin/users/[id]` | Detail user | Admin/Staff | 20 req/menit |
| PATCH | `/api/admin/users/[id]` | Update user | Admin/Staff | 20 req/menit |
| POST | `/api/admin/users/[id]/ban` | Ban/unban user | Admin only | 20 req/menit |
| GET | `/api/admin/properties` | Daftar properti | Admin/Staff | 20 req/menit |
| PATCH | `/api/admin/properties/[id]` | Update properti | Admin/Staff | 20 req/menit |
| GET | `/api/admin/payments` | Daftar pembayaran | Admin/Staff | 20 req/menit |
| GET | `/api/admin/payments/[id]` | Detail pembayaran | Admin/Staff | 20 req/menit |
| PATCH | `/api/admin/payments/[id]` | Update pembayaran | Admin/Staff | 20 req/menit |
| POST | `/api/admin/payments/[id]/reconcile` | Reconcile pembayaran | Admin/Staff | 20 req/menit |
| GET | `/api/admin/refund-requests` | Daftar refund | Admin/Staff | 20 req/menit |
| GET | `/api/admin/kyc/requests` | Daftar KYC | Admin/Staff | 20 req/menit |
| GET | `/api/admin/analytics/revenue` | Revenue analytics | Admin/Staff | 20 req/menit |
| GET | `/api/admin/analytics/revenue-trend` | Revenue trend | Admin/Staff | 20 req/menit |
| GET | `/api/admin/analytics/revenue-by-platform` | Revenue by platform | Admin/Staff | 20 req/menit |
| GET | `/api/admin/audit-logs` | Audit trail | Admin only | 20 req/menit |
| GET | `/api/admin/activity-logs` | Activity logs | Admin/Staff | 20 req/menit |
| GET | `/api/admin/settings` | Platform settings | Admin only | 20 req/menit |
| PATCH | `/api/admin/settings` | Update settings | Admin only | 20 req/menit |
| GET | `/api/admin/payment-gateways` | Gateway config | Admin only | 20 req/menit |
| POST | `/api/admin/payment-gateways` | Tambah gateway | Admin only | 20 req/menit |
| PATCH | `/api/admin/payment-gateways` | Update gateway | Admin only | 20 req/menit |
| DELETE | `/api/admin/payment-gateways` | Hapus gateway | Admin only | 20 req/menit |
| GET | `/api/admin/feature-flags` | Feature flags | Admin/Staff | 20 req/menit |
| POST | `/api/admin/feature-flags` | Tambah flag | Admin only | 20 req/menit |
| PATCH | `/api/admin/feature-flags/[id]` | Update flag | Admin only | 20 req/menit |
| DELETE | `/api/admin/feature-flags/[id]` | Hapus flag | Admin only | 20 req/menit |
| GET | `/api/admin/ads` | Daftar ads | Admin/Staff | 20 req/menit |
| PATCH | `/api/admin/ads/[id]` | Update ad | Admin/Staff | 20 req/menit |
| POST | `/api/admin/ads/[id]/approve` | Approve ad | Admin only | 20 req/menit |
| POST | `/api/admin/ads/[id]/reject` | Reject ad | Admin only | 20 req/menit |
| POST | `/api/admin/ads/[id]/cancel` | Cancel ad | Admin only | 20 req/menit |
| GET | `/api/admin/ad-packages` | Ad packages | Admin/Staff | 20 req/menit |
| POST | `/api/admin/ad-packages` | Tambah package | Admin only | 20 req/menit |
| PATCH | `/api/admin/ad-packages/[id]` | Update package | Admin only | 20 req/menit |
| GET | `/api/admin/ad-revenue` | Ad revenue | Admin/Staff | 20 req/menit |
| GET | `/api/admin/refund-analytics` | Refund analytics | Admin/Staff | 20 req/menit |
| GET | `/api/admin/reports/demographics` | Demographics | Admin/Staff | 20 req/menit |
| GET | `/api/admin/notifications` | Notifikasi admin | Admin/Staff | 20 req/menit |
| POST | `/api/admin/push/broadcast` | Push broadcast | Admin only | 20 req/menit |
| GET | `/api/admin/push/subscriptions` | Push subscriptions | Admin only | 20 req/menit |
| GET | `/api/admin/health/stats` | Health stats | Admin/Staff | 20 req/menit |
| GET | `/api/admin/general-ledger` | General ledger | Admin only | 20 req/menit |
| GET | `/api/admin/bookings/export` | Export bookings | Admin/Staff | 20 req/menit |
| GET | `/api/admin/properties/export` | Export properties | Admin/Staff | 20 req/menit |
| GET | `/api/admin/settings/notifications` | Notification settings | Admin/Staff | 20 req/menit |
| PATCH | `/api/admin/settings/notifications` | Update notif settings | Admin only | 20 req/menit |
| PATCH | `/api/admin/settings/platform-fee` | Platform fee | Admin only | 20 req/menit |

### 6. Protected User API (Owner / Tenant / User)

Base Path: `/api/owner`, `/api/tenant`, `/api/user`, `/api/chat`, `/api/favorites`, `/api/maintenance`, `/api/reports`, `/api/reviews`, `/api/saved-searches`, `/api/notifications`, `/api/push`, `/api/group-bookings`, `/api/inspections`, `/api/loyalty`, `/api/referrals`, `/api/transactions`, `/api/payments`, `/api/users`, `/api/kyc`

> Endpoint ini seharusnya menggunakan **Server Actions** daripada API Route. Berikut daftar untuk referensi:

| Method | Endpoint | Deskripsi | Auth | Rate Limit |
|--------|----------|-----------|------|------------|
| GET | `/api/owner/properties` | Properti owner | Owner/Admin/Staff | 100 req/menit |
| POST | `/api/owner/properties` | Tambah properti | Owner/Admin/Staff | 100 req/menit |
| PATCH | `/api/owner/properties/[id]` | Update properti | Owner/Admin/Staff | 100 req/menit |
| GET | `/api/owner/units` | Unit owner | Owner/Admin/Staff | 100 req/menit |
| POST | `/api/owner/units` | Tambah unit | Owner/Admin/Staff | 100 req/menit |
| GET | `/api/owner/booking-requests` | Booking requests | Owner/Admin/Staff | 100 req/menit |
| GET | `/api/owner/analytics` | Analytics owner | Owner/Admin/Staff | 100 req/menit |
| GET | `/api/owner/revenue` | Revenue owner | Owner/Admin/Staff | 100 req/menit |
| GET | `/api/owner/occupancy` | Okupansi | Owner/Admin/Staff | 100 req/menit |
| GET | `/api/owner/pricing` | Pricing rules | Owner/Admin/Staff | 100 req/menit |
| POST | `/api/owner/pricing` | Tambah pricing | Owner/Admin/Staff | 100 req/menit |
| PATCH | `/api/owner/pricing/[id]` | Update pricing | Owner/Admin/Staff | 100 req/menit |
| GET | `/api/owner/bank-accounts` | Rekening bank | Owner/Admin/Staff | 100 req/menit |
| POST | `/api/owner/bank-accounts` | Tambah rekening | Owner/Admin/Staff | 100 req/menit |
| GET | `/api/owner/reports` | Laporan owner | Owner/Admin/Staff | 100 req/menit |
| GET | `/api/owner/withdrawals` | Withdrawals | Owner/Admin/Staff | 100 req/menit |
| GET | `/api/users/me` | Profil user | Session required | 100 req/menit |
| PATCH | `/api/users/me` | Update profil | Session required | 100 req/menit |
| GET | `/api/users/[id]` | Detail user | Session required | 100 req/menit |
| GET | `/api/notifications` | Notifikasi | Session required | 100 req/menit |
| PATCH | `/api/notifications/[id]/read` | Tandai dibaca | Session required | 100 req/menit |
| GET | `/api/notifications/stream` | SSE notifikasi | Session required | 100 req/menit |
| POST | `/api/reviews` | Buat review | Session required | 100 req/menit |
| GET | `/api/reviews/[id]` | Detail review | Session required | 100 req/menit |
| POST | `/api/maintenance` | Buat tiket maintenance | Session required | 100 req/menit |
| GET | `/api/maintenance/[id]` | Detail tiket | Session required | 100 req/menit |
| GET | `/api/chat/rooms` | Chat rooms | Session required | 100 req/menit |
| POST | `/api/chat/rooms` | Buat room | Session required | 100 req/menit |
| PATCH | `/api/chat/rooms/[id]/read` | Tandai dibaca | Session required | 100 req/menit |
| GET | `/api/favorites/[propertyId]` | Favorites | Session required | 100 req/menit |
| POST | `/api/favorites/[propertyId]` | Tambah favorit | Session required | 100 req/menit |
| DELETE | `/api/favorites/[propertyId]` | Hapus favorit | Session required | 100 req/menit |
| GET | `/api/saved-searches` | Saved searches | Session required | 100 req/menit |
| POST | `/api/saved-searches` | Buat saved search | Session required | 100 req/menit |
| DELETE | `/api/saved-searches/[id]` | Hapus saved search | Session required | 100 req/menit |
| GET | `/api/payments` | Riwayat pembayaran | Session required | 100 req/menit |
| GET | `/api/payments/[id]/receipt` | Receipt PDF | Session required | 100 req/menit |
| GET | `/api/transactions` | Transaksi | Session required | 100 req/menit |
| GET | `/api/reports` | Laporan | Session required | 100 req/menit |
| GET | `/api/kyc/status` | Status KYC | Session required | 100 req/menit |
| POST | `/api/kyc/session` | Buat KYC session | Session required | 100 req/menit |
| GET | `/api/tenant/booking-requests` | Booking requests tenant | Tenant/Admin/Staff | 100 req/menit |

---

## Rate Limiting

| Kategori | Limit | Key Prefix |
|----------|-------|------------|
| Public API | 60 req/menit | `public` |
| Authenticated API | 100 req/menit | `general` |
| Admin API | 20 req/menit | `admin` |
| Webhook | 50 req/menit | `webhook` |
| Auth endpoints | 10 req/menit | `auth` |
| Booking | 10 req/menit | `booking` |

Header respons:
- `X-RateLimit-Limit`: Batas request
- `X-RateLimit-Remaining`: Sisa request
- `X-RateLimit-Reset`: Waktu reset (ISO 8601)

---

## Authentication

### Session Cookie
Sebagian besar endpoint menggunakan session cookie `session_token` (HttpOnly, Secure, SameSite Strict).

### CSRF Token
Untuk POST, PATCH, DELETE: sertakan header `x-csrf-token` dari endpoint `/api/csrf`.

### Webhook Signature
Webhook payment diverifikasi dengan HMAC-SHA256. Header `X-Signature-V2` dan timestamp `X-Timestamp` harus valid.

---

## Catatan

- Semua endpoint yang memerlukan autentikasi mengembalikan `401` jika session tidak valid.
- Semua endpoint yang memerlukan role admin mengembalikan `403` jika role tidak mencukupi.
- Error handling menggunakan helper `ok()`, `fail()`, dan `handleApiError()` dari `src/lib/api.ts`.
- Format JSON response konsisten: `{ success: boolean, data?: unknown, error?: { code, message, details } }`.
- Beberapa endpoint lama masih menggunakan API Route dan akan dimigrasikan ke Server Actions secara bertahap.
