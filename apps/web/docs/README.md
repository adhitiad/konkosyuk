# KonkosYuk API Documentation

Dokumentasi API untuk tim Flutter yang mengembangkan aplikasi mobile KonkosYuk.

## Quick Start

### Base URL
```
Production: https://your-domain.com
Development: http://localhost:3000
```

### Setup di Flutter

1. **Tambahkan dependency** di `pubspec.yaml`:
```yaml
dependencies:
  http: ^1.2.0
  ably: ^1.2.0
  flutter_secure_storage: ^9.0.0
```

2. **Konfigurasi base URL**:
```dart
class ApiConfig {
  static const String baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'https://your-domain.com',
  );
}
```

3. **Setup Ably** untuk real-time notifications:
```dart
import 'package:ably/ably.dart';

final ably = AblyRealtime(
  options: AblyOptions(authUrl: '${ApiConfig.baseUrl}/api/ably/auth'),
);
```

## Authentication Flow

### 1. Register

```http
POST /api/auth/sign-up/email
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "min8chars",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "cust"
    }
  }
}
```

### 2. Login

```http
POST /api/auth/sign-in/email
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "min8chars"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "cust"
    }
  }
}
```

### 3. Get Session

```http
GET /api/auth/get-session
Authorization: Bearer <token>
```

**Response:**
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

### 4. Logout

```http
POST /api/auth/sign-out
Authorization: Bearer <token>
```

## Real-Time Notifications

### Ably Token Generation

Sebelum subscribe ke channel, dapatkan token Ably dari backend:

```http
GET /api/ably/auth
Authorization: Bearer <token>
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "clientId": "user-uuid"
}
```

### Channel Naming Convention

```
user:{userId}:notifications
```

Contoh: `user:123e4567-e89b-12d3-a456-426614174000:notifications`

### Event Types

| Event Name | Description | Payload |
|------------|-------------|---------|
| `notification:new` | Notifikasi baru masuk | `Notification` object |
| `notification:read` | Notifikasi dibaca | `{ notificationId: string }` |
| `notification:preferences_updated` | Preferensi notifikasi diubah | `NotificationPreferences` object |

### Initialize Ably di Flutter

```dart
import 'package:ably/ably.dart';

class AblyService {
  static const String _baseUrl = 'https://your-domain.com';
  late AblyRealtime _ably;
  late RealtimeChannel _notificationChannel;
  final String _token; // Better-Auth token
  
  AblyService(this._token);
  
  Future<void> initialize() async {
    final options = AblyOptions(
      authUrl: '$_baseUrl/api/ably/auth',
      token: _token,
    );
    
    _ably = AblyRealtime(options: options);
    await _ably.connection.onceReady;
    
    final userId = await _getCurrentUserId();
    _notificationChannel = _ably.channels.get(
      'user:$userId:notifications',
    );
    
    await _notificationChannel.subscribe('notification:new', _onNewNotification);
  }
  
  void _onNewNotification(Message message) {
    final notification = message.data as Map<String, dynamic>;
    // Handle new notification
    print('New notification: ${notification['title']}');
  }
  
  Future<void> dispose() async {
    await _notificationChannel.unsubscribe();
    await _ably.close();
  }
}
```

### Handling Offline/Missed Messages

Gunakan Ably History untuk mengambil pesan yang terlewat:

```dart
Future<List<Notification>> getMissedNotifications(String userId) async {
  final channel = _ably.channels.get('user:$userId:notifications');
  
  final result = await channel.history(
    limit: 50,
  );
  
  return result.items.map((message) {
    return Notification.fromJson(message.data);
  }).toList();
}
```

## Notification Management

### Get Notification History

```http
GET /api/notifications
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "userId": "uuid",
        "type": "booking_created",
        "title": "Booking Created",
        "message": "Your booking has been created",
        "actionUrl": "/dashboard/bookings/123",
        "actionLabel": "View Booking",
        "referenceId": "booking-123",
        "referenceType": "booking",
        "isRead": false,
        "createdAt": "2026-08-28T10:00:00Z"
      }
    ],
    "meta": {
      "total": 1
    }
  }
}
```

### Mark Notification as Read

```http
PATCH /api/notifications
Authorization: Bearer <token>
Content-Type: application/json

{
  "notificationId": "uuid"
}
```

**Response:**
```json
{
  "success": true
}
```

### Get Notification Preferences

```http
GET /api/notifications/preferences
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "booking_created": {
        "inApp": true,
        "email": true,
        "push": true
      },
      "payment_dp_paid": {
        "inApp": true,
        "email": false,
        "push": true
      }
    },
    "emailDigest": "immediate",
    "quietHoursStart": null,
    "quietHoursEnd": null,
    "timezone": "Asia/Jakarta"
  }
}
```

### Update Notification Preferences

```http
PATCH /api/notifications/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "preferences": {
    "booking_created": {
      "inApp": true,
      "email": true,
      "push": true
    },
    "payment_dp_paid": {
      "inApp": true,
      "email": false,
      "push": true
    }
  },
  "emailDigest": "immediate",
  "timezone": "Asia/Jakarta"
}
```

## User Profile

### Get Current User Profile

```http
GET /api/users/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "cust",
    "phone": "+6281234567890",
    "image": null,
    "province": "DKI Jakarta",
    "city": "Jakarta Selatan",
    "district": "Kebayoran Baru",
    "kycStatus": "verified",
    "reputationScore": 95,
    "balance": 1500000,
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-08-28T10:00:00Z"
  }
}
```

### Update User Profile

```http
PATCH /api/user/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe Updated",
  "phone": "+6281234567890",
  "image": "https://example.com/avatar.jpg",
  "province": "DKI Jakarta",
  "city": "Jakarta Selatan",
  "district": "Kebayoran Baru"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Profil berhasil diperbarui",
    "user": {
      "id": "uuid",
      "name": "John Doe Updated",
      "phone": "+6281234567890",
      "image": "https://example.com/avatar.jpg"
    }
  }
}
```

## Error Handling

### Common Error Codes

| HTTP Status | Error Code | Description | Action |
|-------------|------------|-------------|--------|
| 400 | `VALIDATION_ERROR` | Request body tidak valid | Periksa field yang dikirim |
| 401 | `UNAUTHORIZED` | Token tidak valid atau expired | Refresh token atau login ulang |
| 403 | `FORBIDDEN` | Tidak memiliki akses | Cek role user |
| 404 | `NOT_FOUND` | Resource tidak ditemukan | Periksa ID resource |
| 429 | `RATE_LIMIT_EXCEEDED` | Terlalu banyak request | Tunggu sebentar lalu retry |
| 500 | `INTERNAL_ERROR` | Server error | Hubungi admin |

### Error Response Format

```json
{
  "error": "Error message description",
  "details": {
    "field": "validation error detail"
  }
}
```

### Handling Errors di Flutter

```dart
class ApiException implements Exception {
  final int statusCode;
  final String message;
  final Map<String, dynamic>? details;
  
  ApiException(this.statusCode, this.message, {this.details});
}

Future<dynamic> handleApiResponse(Response response) async {
  if (response.statusCode == 200 || response.statusCode == 201) {
    return jsonDecode(response.body);
  }
  
  final error = jsonDecode(response.body);
  throw ApiException(
    response.statusCode,
    error['error'] ?? 'Unknown error',
    details: error['details'],
  );
}
```

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/*` | 5 requests | 10 detik |
| `/api/notifications` | 60 requests | 60 detik |
| `/api/user/profile` | 10 requests | 60 detik |

### Handling Rate Limit di Flutter

```dart
Future<dynamic> apiCallWithRetry(
  Future<Response> Function() call, {
  int maxRetries = 3,
}) async {
  for (int i = 0; i < maxRetries; i++) {
    final response = await call();
    
    if (response.statusCode == 429) {
      final retryAfter = response.headers['Retry-After'] ?? '5';
      await Future.delayed(Duration(seconds: int.parse(retryAfter)));
      continue;
    }
    
    return response;
  }
  
  throw ApiException(429, 'Rate limit exceeded');
}
```

## Notification Types

| Type | Description | Default Channels |
|------|-------------|------------------|
| `booking_created` | Booking baru dibuat | inApp, email, push |
| `booking_approved` | Booking disetujui | inApp, email, push |
| `booking_rejected` | Booking ditolak | inApp, email, push |
| `booking_completed` | Booking selesai | inApp, push |
| `booking_cancelled` | Booking dibatalkan | inApp, email |
| `payment_dp_paid` | DP dibayar | inApp, push |
| `payment_full_paid` | Pembayaran lunas | inApp, email, push |
| `payment_failed` | Pembayaran gagal | inApp, email, push |
| `payment_refunded` | Pembayaran direfund | inApp, email, push |
| `maintenance_created` | Maintenance request dibuat | inApp, email, push |
| `maintenance_updated` | Maintenance diupdate | inApp, email, push |
| `maintenance_resolved` | Maintenance selesai | inApp, push |
| `inspection_created` | Inspeksi dibuat | inApp, push |
| `inspection_completed` | Inspeksi selesai | inApp, email, push |
| `inspection_disputed` | Inspeksi dipersengketakan | inApp, email, push |
| `chat_message` | Pesan chat baru | inApp, push |
| `review_received` | Review baru diterima | inApp, email |
| `system` | Notifikasi sistem | inApp |

## Support

Untuk pertanyaan atau issue, hubungi tim backend KonkosYuk.
