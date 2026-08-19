# API Documentation

> **Base URL:** `https://api.konkosyuk.com`  
> **Development:** `http://localhost:3000`  
> **Format:** JSON  
> **Authentication:** Session-based (HttpOnly cookies)

Semua response success memiliki format:

```json
{
  "success": true,
  "data": { ... }
}
```

Beberapa endpoint list menambahkan `meta` secara manual:

```json
{
  "success": true,
  "data": [ ... ],
  "meta": { "total": 50, "page": 1, "limit": 10, "totalPages": 5 }
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

## 📋 Daftar Isi

- [Authentication](#authentication)
- [Properties](#properties)
- [Bookings](#bookings)
- [Payments](#payments)
- [Users](#users)
- [Admin](#admin)
- [Webhooks](#webhooks)
- [Health](#health)

---

## 🔐 Authentication

Base Path: `/api/auth`

### `POST /api/auth/sign-up`

Mendaftarkan user baru.

**Request Body:**

| Field      | Type   | Required | Deskripsi                |
| ---------- | ------ | -------- | ------------------------ |
| `email`    | string | Ya       | Alamat email             |
| `password` | string | Ya       | Minimal 8 karakter       |
| `name`     | string | Ya       | Nama lengkap             |
| `phone`    | string | Tidak    | Nomor telepon (opsional) |

**Response 201:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "cust"
  }
}
```

### `POST /api/auth/sign-in`

Masuk dengan email dan password.

**Request Body:**

| Field        | Type    | Required | Deskripsi    |
| ------------ | ------- | -------- | ------------ |
| `email`      | string  | Ya       | Alamat email |
| `password`   | string  | Ya       | Password     |
| `rememberMe` | boolean | Tidak    | Tetap masuk  |

**Response 200:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "cust"
    },
    "session": {
      "token": "session-token"
    }
  }
}
```

### `POST /api/auth/sign-out`

Keluar dari sesi.

**Response 200:**

```json
{
  "success": true,
  "data": null
}
```

### `GET /api/auth/session`

Mendapatkan sesi user yang sedang login.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "cust"
    }
  }
}
```

### `POST /api/auth/update-profile`

Update profil user.

**Request Body:**

| Field      | Type   | Required | Deskripsi                    |
| ---------- | ------ | -------- | ---------------------------- |
| `phone`    | string | Tidak    | Nomor telepon (min 10 digit) |
| `whatsapp` | string | Tidak    | Nomor WhatsApp               |
| `telegram` | string | Tidak    | Username Telegram            |
| `email`    | string | Tidak    | Email baru                   |

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "phone": "081234567890",
    "whatsapp": "081234567890",
    "telegram": "johndoe"
  }
}
```

---

## 🏠 Properties

Base Path: `/api/properties`

### `GET /api/properties`

Dapatkan daftar properti dengan filter.

**Query Parameters:**

| Parameter   | Type     | Required | Deskripsi                                  |
| ----------- | -------- | -------- | ------------------------------------------ |
| `page`      | number   | Tidak    | Nomor halaman (default: 1)                 |
| `limit`     | number   | Tidak    | Jumlah per halaman (max: 100, default: 10) |
| `type`      | string   | Tidak    | Filter tipe: `kost` atau `kontrakan`       |
| `city`      | string   | Tidak    | Filter kota                                |
| `search`    | string   | Tidak    | Kata kunci pencarian                       |
| `lat`       | number   | Tidak    | Latitude untuk filter radius               |
| `lng`       | number   | Tidak    | Longitude untuk filter radius              |
| `radiusKm`  | number   | Tidak    | Radius dalam km (default: 5)               |
| `minPrice`  | number   | Tidak    | Harga minimum                              |
| `maxPrice`  | number   | Tidak    | Harga maksimum                             |
| `amenities` | string[] | Tidak    | Filter fasilitas                           |

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Kost Melati",
      "description": "Kost dekat kampus",
      "address": "Jl. Sudirman No. 1",
      "city": "Jakarta",
      "province": "DKI Jakarta",
      "type": "kost",
      "basePrice": "1500000",
      "packages": { ... },
      "amenities": ["wifi", "ac"],
      "images": ["https://..."],
      "latitude": -6.2088,
      "longitude": 106.8456,
      "status": "aktif",
      "isActive": true,
      "gpsVerified": true,
      "createdAt": "2026-08-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### `GET /api/properties/[id]`

Dapatkan detail properti.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Kost Melati",
    "description": "Kost dekat kampus",
    "address": "Jl. Sudirman No. 1",
    "city": "Jakarta",
    "type": "kost",
    "basePrice": "1500000",
    "packages": { ... },
    "amenities": ["wifi", "ac"],
    "images": ["https://..."],
    "ownerId": "uuid",
    "createdAt": "2026-08-01T00:00:00.000Z"
  }
}
```

### `POST /api/properties`

Buat properti baru (Owner/Admin only).

**Headers:** `x-csrf-token: <token>`

**Request Body:**

| Field         | Type     | Required | Deskripsi                      |
| ------------- | -------- | -------- | ------------------------------ |
| `title`       | string   | Ya       | Nama properti (min 1, max 255) |
| `description` | string   | Tidak    | Deskripsi properti             |
| `address`     | string   | Tidak    | Alamat lengkap                 |
| `city`        | string   | Tidak    | Kota                           |
| `province`    | string   | Tidak    | Provinsi                       |
| `district`    | string   | Tidak    | Kecamatan                      |
| `type`        | enum     | Ya       | `kost` atau `kontrakan`        |
| `basePrice`   | string   | Tidak    | Harga dasar                    |
| `packages`    | object   | Tidak    | Paket harga                    |
| `status`      | enum     | Tidak    | `aktif` atau `nonaktif`        |
| `amenities`   | string[] | Tidak    | Daftar fasilitas               |
| `images`      | string[] | Tidak    | URL gambar                     |
| `latitude`    | number   | Tidak    | Koordinat latitude             |
| `longitude`   | number   | Tidak    | Koordinat longitude            |

**Response 201:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Kost Melati",
    "ownerId": "uuid",
    "createdAt": "2026-08-01T00:00:00.000Z"
  }
}
```

### `PATCH /api/properties/[id]`

Update properti (Owner/Admin only).

**Headers:** `x-csrf-token: <token>`

**Request Body:** Sama seperti POST, semua field opsional.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Kost Melati Updated",
    "updatedAt": "2026-08-02T00:00:00.000Z"
  }
}
```

---

## 📅 Bookings

Base Path: `/api/bookings`

### `GET /api/bookings`

Dapatkan daftar booking user.

**Query Parameters:**

| Parameter | Type   | Required | Deskripsi                                  |
| --------- | ------ | -------- | ------------------------------------------ |
| `page`    | number | Tidak    | Nomor halaman (default: 1)                 |
| `limit`   | number | Tidak    | Jumlah per halaman (default: 50, max: 100) |
| `status`  | string | Tidak    | Filter status booking                      |

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "propertyId": "uuid",
      "unitId": "uuid",
      "bookingType": "instant",
      "status": "confirmed",
      "startDate": "2026-09-01T00:00:00.000Z",
      "endDate": "2027-08-31T00:00:00.000Z",
      "createdAt": "2026-08-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

### `POST /api/bookings`

Buat booking baru.

**Headers:** `x-csrf-token: <token>`

**Request Body:**

| Field         | Type              | Required | Deskripsi                         |
| ------------- | ----------------- | -------- | --------------------------------- |
| `propertyId`  | string (UUID)     | Ya       | ID properti                       |
| `unitId`      | string (UUID)     | Ya       | ID unit                           |
| `packageId`   | string            | Ya       | ID paket (`pkg-1`, `custom`, dll) |
| `bookingType` | enum              | Ya       | `instant` atau `request`          |
| `startDate`   | string (ISO 8601) | Ya       | Tanggal mulai                     |
| `endDate`     | string (ISO 8601) | Tidak    | Tanggal selesai (untuk custom)    |
| `metadata`    | object            | Tidak    | Data tambahan                     |

**Response 201:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "propertyId": "uuid",
    "unitId": "uuid",
    "status": "pending_dp",
    "bookingType": "instant",
    "startDate": "2026-09-01T00:00:00.000Z",
    "endDate": "2027-08-31T00:00:00.000Z",
    "createdAt": "2026-08-01T00:00:00.000Z"
  }
}
```

### `GET /api/bookings/[bookingId]`

Dapatkan detail booking.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "propertyId": "uuid",
    "unitId": "uuid",
    "status": "confirmed",
    "bookingType": "instant",
    "startDate": "2026-09-01T00:00:00.000Z",
    "endDate": "2027-08-31T00:00:00.000Z",
    "payments": [ ... ]
  }
}
```

### `PATCH /api/bookings/[bookingId]/review`

Review booking request (Owner only).

**Headers:** `x-csrf-token: <token>`

**Request Body:**

| Field    | Type   | Required | Deskripsi                   |
| -------- | ------ | -------- | --------------------------- |
| `status` | enum   | Ya       | `confirmed` atau `rejected` |
| `note`   | string | Tidak    | Catatan tambahan            |

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "confirmed"
  }
}
```

### `POST /api/bookings/[bookingId]/checkout`

Buat payment untuk DP atau pelunasan.

**Headers:** `x-csrf-token: <token>`

**Request Body:**

| Field             | Type | Required | Deskripsi                           |
| ----------------- | ---- | -------- | ----------------------------------- |
| `paymentProvider` | enum | Ya       | `doku`, `ipaymu`, `nicepay`, `mock` |

**Response 201:**

```json
{
  "success": true,
  "data": {
    "paymentUrl": "https://payment-gateway.com/checkout/...",
    "transactionId": "TXN-123456"
  }
}
```

---

## 💰 Payments

Base Path: `/api/payments`

### `GET /api/payments`

Dapatkan riwayat pembayaran.

**Query Parameters:**

| Parameter | Type   | Required | Deskripsi          |
| --------- | ------ | -------- | ------------------ |
| `page`    | number | Tidak    | Nomor halaman      |
| `limit`   | number | Tidak    | Jumlah per halaman |
| `status`  | string | Tidak    | Filter status      |

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "bookingId": "uuid",
      "provider": "doku",
      "purpose": "dp",
      "amount": "525000",
      "currency": "IDR",
      "status": "success",
      "transactionId": "TXN-123456",
      "paidAt": "2026-08-01T00:00:00.000Z"
    }
  ]
}
```

---

## 👥 Users

Base Path: `/api/users`

### `GET /api/users/me`

Dapatkan profil user yang sedang login.

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "cust",
    "phone": "081234567890",
    "kycStatus": "verified",
    "createdAt": "2026-08-01T00:00:00.000Z"
  }
}
```

### `PATCH /api/users/me`

Update profil user.

**Headers:** `x-csrf-token: <token>`

**Request Body:**

| Field      | Type   | Required | Deskripsi         |
| ---------- | ------ | -------- | ----------------- |
| `phone`    | string | Tidak    | Nomor telepon     |
| `whatsapp` | string | Tidak    | Nomor WhatsApp    |
| `telegram` | string | Tidak    | Username Telegram |
| `email`    | string | Tidak    | Email baru        |

---

## 🔧 Admin

Base Path: `/api/admin`

> Semua endpoint admin memerlukan role `admin` atau `staff`.

### Users Management

| Method | Endpoint                    | Deskripsi          |
| ------ | --------------------------- | ------------------ |
| GET    | `/api/admin/users`          | Daftar semua user  |
| GET    | `/api/admin/users/[id]`     | Detail user        |
| PATCH  | `/api/admin/users/[id]`     | Update user        |
| POST   | `/api/admin/users/[id]/ban` | Ban/unban user     |
| GET    | `/api/admin/users/export`   | Export user ke CSV |

### Properties Management

| Method | Endpoint                       | Deskripsi              |
| ------ | ------------------------------ | ---------------------- |
| GET    | `/api/admin/properties`        | Daftar semua properti  |
| PATCH  | `/api/admin/properties/[id]`   | Update properti        |
| GET    | `/api/admin/properties/export` | Export properti ke CSV |

### Payments Management

| Method | Endpoint                             | Deskripsi               |
| ------ | ------------------------------------ | ----------------------- |
| GET    | `/api/admin/payments`                | Daftar semua pembayaran |
| GET    | `/api/admin/payments/[id]`           | Detail pembayaran       |
| PATCH  | `/api/admin/payments/[id]`           | Update pembayaran       |
| POST   | `/api/admin/payments/[id]/reconcile` | Reconcile pembayaran    |

### Payment Gateways

| Method | Endpoint                      | Deskripsi                  |
| ------ | ----------------------------- | -------------------------- |
| GET    | `/api/admin/payment-gateways` | Daftar konfigurasi gateway |
| POST   | `/api/admin/payment-gateways` | Tambah konfigurasi gateway |
| PATCH  | `/api/admin/payment-gateways` | Update konfigurasi gateway |
| DELETE | `/api/admin/payment-gateways` | Hapus konfigurasi gateway  |

### KYC Management

| Method | Endpoint                  | Deskripsi             |
| ------ | ------------------------- | --------------------- |
| GET    | `/api/admin/kyc/requests` | Daftar permintaan KYC |
| POST   | `/api/admin/kyc/approve`  | Approve KYC           |

### Analytics

| Method | Endpoint                                   | Deskripsi                 |
| ------ | ------------------------------------------ | ------------------------- |
| GET    | `/api/admin/analytics/revenue`             | Revenue analytics         |
| GET    | `/api/admin/analytics/revenue-trend`       | Revenue trend 12 bulan    |
| GET    | `/api/admin/analytics/revenue-by-platform` | Revenue by platform       |
| GET    | `/api/admin/analytics/featured-count`      | Featured properties count |
| GET    | `/api/admin/health/stats`                  | System health stats       |

### Audit Logs

| Method | Endpoint                   | Deskripsi     |
| ------ | -------------------------- | ------------- |
| GET    | `/api/admin/audit-logs`    | Audit trail   |
| GET    | `/api/admin/activity-logs` | Activity logs |

---

## 🔔 Notifications

Base Path: `/api/notifications`

### `GET /api/notifications`

Dapatkan daftar notifikasi user.

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "booking",
      "title": "Booking Baru",
      "message": "Anda memiliki booking baru",
      "read": false,
      "createdAt": "2026-08-01T00:00:00.000Z"
    }
  ]
}
```

### `PATCH /api/notifications/[id]/read`

Tandai notifikasi sebagai dibaca.

### `POST /api/notifications/read-all`

Tandai semua notifikasi sebagai dibaca.

### `GET /api/notifications/stream`

SSE stream untuk notifikasi real-time.

---

## 🪝 Webhooks

Base Path: `/api/webhooks/[provider]`

### `POST /api/webhooks/doku`

Webhook untuk Doku payment notification.

**Headers:**

- `X-Doku-Signature: <signature>`
- `Content-Type: application/json`

**Response 200:**

```json
{
  "success": true,
  "data": {
    "status": "success",
    "transactionId": "TXN-123456"
  }
}
```

### `POST /api/webhooks/ipaymu`

Webhook untuk iPaymu payment notification.

### `POST /api/webhooks/nicepay`

Webhook untuk Nicepay payment notification.

### `POST /api/webhooks/mock`

Webhook untuk testing (mock payment).

---

## 🏥 Health Check

Base Path: `/api/health`

| Method | Endpoint              | Deskripsi                   |
| ------ | --------------------- | --------------------------- |
| GET    | `/api/health/db`      | Cek koneksi database        |
| GET    | `/api/health/redis`   | Cek koneksi Redis           |
| GET    | `/api/health/payment` | Cek koneksi payment gateway |
| GET    | `/api/health/storage` | Cek koneksi storage         |

**Response 200:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-08-14T11:00:00.000Z",
    "checks": {
      "database": "up",
      "redis": "up",
      "payment": "up",
      "storage": "up"
    }
  }
}
```

---

## ⚠️ Error Codes

| Status Code | Deskripsi                               |
| ----------- | --------------------------------------- |
| `200`       | Sukses                                  |
| `201`       | Berhasil dibuat                         |
| `400`       | Bad Request - Input tidak valid         |
| `401`       | Unauthorized - Belum login              |
| `403`       | Forbidden - Tidak punya akses           |
| `404`       | Not Found - Resource tidak ditemukan    |
| `409`       | Conflict - Data sudah ada               |
| `422`       | Unprocessable Entity - Validasi gagal   |
| `429`       | Too Many Requests - Rate limit exceeded |
| `500`       | Internal Server Error                   |

**Response Error Format:**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Tidak berwenang"
  }
}
```

---

## 🔒 Rate Limiting

| Endpoint          | Limit         |
| ----------------- | ------------- |
| Public API        | 60 req/menit  |
| Authenticated API | 100 req/menit |
| Webhook           | 50 req/menit  |
| Auth endpoints    | 10 req/menit  |

---

## 📝 Catatan

- Semua request yang membutuhkan autentikasi harus menyertakan session cookie
- CSRF token diperlukan untuk POST, PATCH, DELETE: `x-csrf-token` header
- Webhook signature harus diverifikasi dengan `verifyHmacHex()` dari `src/lib/payments/signature.ts`
- Kolom `amount` pada tabel `payments` disimpan sebagai `text`, di-cast ke `NUMERIC` di query. Kebanyakan kolom moneter lainnya menggunakan `numeric(...)`.
