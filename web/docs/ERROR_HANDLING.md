# Error Handling & Monitoring Guide - KonkosYuk

## 📋 Ringkasan

Dokumen ini menjelaskan sistem error handling, logging, dan monitoring yang telah diimplementasikan di KonkosYuk.

---

## 1. Global Error Handling

### Error Boundaries

Next.js App Router menyediakan dua level error boundary:

#### `app/error.tsx`

- Menangkap error di dalam **client components** dan **server components** yang di-render
- Menampilkan fallback UI yang ramah pengguna
- Menyediakan tombol "Coba Lagi" untuk reset error

#### `app/global-error.tsx`

- Menangkap error di **root layout level**
- Error yang tidak tertangkap oleh `error.tsx` akan di-handle di sini
- Menampilkan halaman error lengkap dengan opsi refresh atau kembali ke beranda

### Penggunaan di Server Components

Server components tidak menggunakan error boundary React. Gunakan `try-catch` block:

```typescript
export default async function Page() {
  try {
    const data = await fetchData()
    return <DataView data={data} />
  } catch (error) {
    logError(error, 'Page data fetch')
    return <ErrorFallback />
  }
}
```

### Penggunaan di API Routes

```typescript
export async function GET() {
  try {
    const data = await fetchData();
    return ok(data);
  } catch (error) {
    logError(error, "API endpoint");
    return handleApiError(error, "API endpoint");
  }
}
```

---

## 2. Structured Logging

### Logger Utility

File: `src/lib/logger.ts`

Menggunakan **Pino** untuk structured logging dalam format JSON.

```typescript
import {
  logError,
  logInfo,
  logWarn,
  logSecurityEvent,
  logApiRequest,
} from "@/lib/logger";

// Error logging
logError(error, "Context", { userId: "123", bookingId: "abc" });

// Info logging
logInfo("Booking created", { bookingId: "abc", userId: "123" });

// Warning logging
logWarn("Rate limit approaching", { userId: "123", remaining: 5 });

// Security event logging
logSecurityEvent("login_failed", {
  email: "user@example.com",
  ip: "127.0.0.1",
});

// API request logging
logApiRequest("GET", "/api/bookings", 200, 150, "user-123");
```

### Log Format (JSON)

```json
{
  "timestamp": "2026-08-14T12:00:00.000Z",
  "level": "ERROR",
  "message": "Database connection failed",
  "context": "GET /api/properties",
  "error": {
    "message": "Connection timeout",
    "stack": "...",
    "name": "DatabaseError"
  },
  "userId": "user-123"
}
```

### Sensitive Data Protection

Logger otomatis menyensor data sensitif:

- Password, token, secret, apiKey
- KTP number, KTP image URL
- Balance, authorization header

```typescript
// Input
logInfo('User data', { password: 'secret123', name: 'John' })

// Output
{
  "message": "User data",
  "password": "sec***",
  "name": "John"
}
```

---

## 3. API Error Standardization

### Error Response Format

Semua API error menggunakan format standar:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Field 'email' is required",
    "details": {
      "field": "email",
      "constraint": "required"
    }
  }
}
```

### Error Codes

| Code                    | HTTP Status | Deskripsi                |
| ----------------------- | ----------- | ------------------------ |
| `VALIDATION_ERROR`      | 422         | Input tidak valid        |
| `UNAUTHORIZED`          | 401         | Belum login              |
| `FORBIDDEN`             | 403         | Tidak punya akses        |
| `NOT_FOUND`             | 404         | Resource tidak ditemukan |
| `CONFLICT`              | 409         | Data sudah ada           |
| `RATE_LIMIT_EXCEEDED`   | 429         | Too many requests        |
| `INTERNAL_SERVER_ERROR` | 500         | Server error             |

### Usage di API Routes

```typescript
import {
  NotFoundError,
  ValidationError,
  AuthorizationError,
} from "@/lib/api-error";

throw new NotFoundError("Property");
throw new ValidationError("Invalid booking dates", { startDate, endDate });
throw new AuthorizationError("Only owner can access this resource");
```

---

## 4. Sentry Integration

### Setup

1. Buat project di [Sentry.io](https://sentry.io)
2. Dapatkan DSN dari project settings
3. Set environment variables:

```env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-auth-token
```

### Konfigurasi

File: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`

Sentry otomatis menangkap:

- **Client errors**: JavaScript errors di browser
- **Server errors**: Error di API routes dan server components
- **Edge errors**: Error di middleware dan edge runtime
- **Performance**: Transaction tracing dan profiling

### Manual Error Reporting

```typescript
import * as Sentry from "@sentry/nextjs";
import { captureException, captureMessage, setUser } from "@/lib/sentry";

// Capture exception
try {
  await riskyOperation();
} catch (error) {
  captureException(error, { context: "booking_creation" });
}

// Capture message
captureMessage("User reached checkout", "info", { userId: "123" });

// Set user context
setUser({ id: "user-123", email: "user@example.com" });
```

### Source Maps

Sentry akan otomatis upload source maps saat build di CI/CD. Pastikan `SENTRY_AUTH_TOKEN` di-set di GitHub Actions secrets.

---

## 5. Health Check & Uptime Monitoring

### Health Check Endpoints

```
GET /api/health           - Unified health check
GET /api/health/db        - Database connection
GET /api/health/redis     - Redis connection
GET /api/health/payment   - Payment gateway connectivity
GET /api/health/storage   - Storage provider connectivity
```

### Response Format

```json
{
  "status": "healthy",
  "timestamp": "2026-08-14T12:00:00.000Z",
  "checks": {
    "database": { "status": "healthy", "latency": 12 },
    "redis": { "status": "healthy", "latency": 5 },
    "storage": { "status": "healthy", "providers": [...] },
    "payments": { "status": "healthy", "providers": [...] }
  }
}
```

### Monitoring Tools

| Tool                              | Purpose                  | Integration                        |
| --------------------------------- | ------------------------ | ---------------------------------- |
| **Sentry**                        | Error tracking           | Client + Server + Edge             |
| **Vercel Analytics**              | Performance & Web Vitals | Automatic if deployed on Vercel    |
| **UptimeRobot**                   | Uptime monitoring        | Ping `/api/health` every 5 minutes |
| **PostgreSQL pg_stat_statements** | Slow query monitoring    | Enable di database                 |

### Alerting Strategy

| Severity     | Condition                | Action                          |
| ------------ | ------------------------ | ------------------------------- |
| **Critical** | Health check returns 503 | Page on-call engineer           |
| **Warning**  | Error rate > 5%          | Send Slack notification         |
| **Info**     | New error type in Sentry | Create ticket for investigation |

---

## 6. Best Practices

### Error Handling

1. **Always use specific error classes**: `NotFoundError`, `ValidationError`, etc.
2. **Never expose sensitive data in error messages**: Password, token, stack traces
3. **Log errors with context**: Include userId, bookingId, request path
4. **Use try-catch di server components**: Jangan biarkan error propagate ke client

### Logging

1. **Use appropriate log levels**: error, warn, info, debug
2. **Include correlation ID**: Untuk tracking request across services
3. **Don't log sensitive data**: Gunakan sanitization otomatis
4. **Structured logging**: Gunakan JSON format untuk mudah di-parse

### Monitoring

1. **Set up alerts**: Untuk critical errors dan downtime
2. **Monitor key metrics**: Error rate, response time, database latency
3. **Regular review**: Review Sentry issues weekly
4. **Performance budgets**: LCP < 2.5s, FID < 100ms, CLS < 0.1

---

## 7. Troubleshooting

### Sentry tidak menerima error

1. Cek `SENTRY_DSN` di environment variables
2. Pastikan network tidak memblokir `sentry.io`
3. Cek browser console untuk client-side errors
4. Cek server logs untuk server-side errors

### Logger tidak menulis ke file

1. Pastikan direktori `logs/` ada dan writable
2. Cek konfigurasi `winston` transports
3. Pastikan `NODE_ENV` sesuai dengan konfigurasi level

### Health check returns 503

1. Cek koneksi database: `psql $DATABASE_URL -c "SELECT 1"`
2. Cek koneksi Redis: `redis-cli ping`
3. Cek logs aplikasi untuk error detail

---

## 8. File Structure

```
src/
├── app/
│   ├── error.tsx                 # Client error boundary
│   ├── global-error.tsx          # Root error boundary
│   └── api/
│       └── health/
│           ├── route.ts          # Unified health check
│           ├── db/route.ts       # Database health
│           ├── redis/route.ts    # Redis health
│           ├── payment/route.ts  # Payment health
│           └── storage/route.ts  # Storage health
├── lib/
│   ├── logger.ts                 # Pino structured logger
│   ├── api.ts                    # API response helpers (ok, fail, handleApiError)
│   ├── api-error.ts              # ApiError class hierarchy
│   ├── api.client.ts             # Axios client with ApiError
│   └── sentry.ts                 # Sentry wrapper utilities

sentry.client.config.ts          # Sentry client config
sentry.server.config.ts          # Sentry server config
sentry.edge.config.ts            # Sentry edge config
```
