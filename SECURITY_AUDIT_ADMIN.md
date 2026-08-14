# Security Audit Report: KonkosYuk Admin & Staff Module

**Audit Date:** 2026-08-08  
**Scope:** `src/app/[locale]/(protected)/admin/` and `src/app/api/admin/`

---

## Executive Summary

**Overall Risk Level: HIGH**

The admin module has **critical vulnerabilities** that allow staff users to perform admin-only actions, expose payment gateway secrets, lack proper server-side route protection, and have a hardcoded authentication secret. Immediate remediation is required before production deployment.

---

## 1. ROUTE PROTECTION

### 1.1 Missing Server-Side Route Protection (CRITICAL)

| File                                            | Line  | Issue                                                                                                                                                                 |
| ----------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/[locale]/(protected)/admin/layout.tsx` | 13-17 | **Client-side only role check** - Redirects non-admin/staff to `/login` via `useEffect`. Can be bypassed by disabling JavaScript or directly accessing API endpoints. |
| `src/middleware.ts`                             | N/A   | **No middleware exists** - No server-side protection for admin page routes. All admin pages rely solely on client-side checks.                                        |

**Impact:** Regular users can access admin UI pages by directly navigating to URLs. While API endpoints have server-side checks, the UI is exposed.

**Fix:** Create a middleware (`src/middleware.ts`) that validates session and role before allowing access to `/admin/*` routes:

```typescript
// src/middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/admin") || pathname.startsWith("/[locale]/admin")) {
    if (!session || !["admin", "staff"].includes(session.user.role)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/[locale]/admin/:path*"],
};
```

---

## 2. API SECURITY - PRIVILEGE ESCALATION (CRITICAL)

### 2.1 Staff Can Perform Admin-Only Actions

The following endpoints allow **both `admin` AND `staff` roles**, but should be restricted to `admin` only:

| Endpoint                                  | File                               | Line | Current Roles        | Risk                                                                                                         |
| ----------------------------------------- | ---------------------------------- | ---- | -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `POST /api/admin/payment-gateways`        | `payment-gateways/route.ts`        | 29   | `['admin', 'staff']` | **Staff can create payment gateway configs with SECRETS (clientId, secretKey, webhookSecret, merchantCode)** |
| `PATCH /api/admin/withdrawals`            | `withdrawals/route.ts`             | 57   | `['admin', 'staff']` | Staff can approve/reject owner withdrawals                                                                   |
| `POST /api/admin/payments`                | `payments/route.ts`                | 64   | `['admin', 'staff']` | Staff can create manual payments, manipulate booking status                                                  |
| `PATCH /api/admin/payments/[id]`          | `payments/[id]/route.ts`           | 19   | `['admin', 'staff']` | Staff can refund/cancel payments                                                                             |
| `POST /api/admin/payments/[id]/reconcile` | `payments/[id]/reconcile/route.ts` | 20   | `['admin', 'staff']` | Staff can force-reconcile payments to success                                                                |
| `PATCH /api/admin/properties/[id]`        | `properties/[id]/route.ts`         | 30   | `['admin', 'staff']` | Staff can modify any property (price, status, etc.)                                                          |
| `PATCH /api/admin/users/[id]`             | `users/[id]/route.ts`              | 22   | `['admin', 'staff']` | **Staff can change ANY user's role (including promoting to admin!)**                                         |
| `GET /api/admin/payment-gateways`         | `payment-gateways/route.ts`        | 19   | `['admin', 'staff']` | Staff can view all payment gateway secrets                                                                   |

### 2.2 TypeScript Bypass in KYC Approve Endpoint (HIGH)

| File                                     | Line | Issue                                                                                                                                                      |
| ---------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/api/admin/kyc/approve/route.ts` | 18   | `await requireSession(['admin'] as any)` - **Casting to `any` bypasses TypeScript role validation**. If the role array is modified, no compile-time error. |

### 2.3 IDOR (Insecure Direct Object Reference) - MEDIUM

| Endpoint                           | File                       | Line  | Issue                                                                                             |
| ---------------------------------- | -------------------------- | ----- | ------------------------------------------------------------------------------------------------- |
| `PATCH /api/admin/users/[id]`      | `users/[id]/route.ts`      | 23    | No ownership check - staff can modify any user including other admins                             |
| `PATCH /api/admin/properties/[id]` | `properties/[id]/route.ts` | 31    | No ownership check - staff can modify any property                                                |
| `POST /api/admin/payments`         | `payments/route.ts`        | 67-79 | Booking ownership validated but only checks `booking.userId === body.userId` - can be manipulated |

### 2.4 Mass Assignment Vulnerabilities - MEDIUM

| File                                         | Line  | Issue                                                                                                                           |
| -------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/api/admin/users/[id]/route.ts`      | 42-45 | Uses spread `...body` to update user - allows updating any field in schema including `role`, `isActive`, `balance`, `kycStatus` |
| `src/app/api/admin/properties/[id]/route.ts` | 46-59 | Uses spread-like manual assignment but accepts all schema fields                                                                |

**Fix:** Use explicit field allowlists instead of spreading:

```typescript
// users/[id]/route.ts - FIX
const allowedFields = ["name", "email", "role", "isActive"] as const;
const updateData: Partial<User> = {};
for (const key of allowedFields) {
  if (body[key] !== undefined) updateData[key] = body[key];
}
await db.update(users).set(updateData).where(eq(users.id, userId));
```

---

## 3. INPUT VALIDATION

### 3.1 Missing Zod Validation (HIGH)

| Endpoint                         | File                      | Line | Issue                                                                             |
| -------------------------------- | ------------------------- | ---- | --------------------------------------------------------------------------------- |
| `POST /api/admin/general-ledger` | `general-ledger/route.ts` | 52   | **No Zod validation** - uses raw `await req.json()` without any schema validation |
| `PATCH /api/admin/notifications` | `notifications/route.ts`  | 66   | **No Zod validation** - uses raw `await req.json()`                               |

**Risk:** Arbitrary JSON can be sent, potentially causing type errors, database errors, or unexpected behavior.

### 3.2 SQL Injection Risk (MEDIUM)

| File                              | Line  | Issue                                                                                                                                                                                                                |
| --------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/api/properties/route.ts` | 40-44 | Uses `searchTerm.replace(/'/g, "''")` for sanitization instead of proper parameterized queries. While using `sql` template tags from Drizzle, the manual string manipulation before template interpolation is risky. |

**Fix:** Use Drizzle's built-in parameterization properly:

```typescript
// Instead of:
const searchTerm = search.replace(/'/g, "''");
sql`@@ websearch_to_tsquery('indonesian', ${searchTerm})`;

// Use:
sql`@@ websearch_to_tsquery('indonesian', ${search})`;
```

### 3.3 Overly Permissive Schema (MEDIUM)

| File                                          | Line | Issue                                                                                                                                   |
| --------------------------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/api/admin/payment-gateways/route.ts` | 12   | `config: z.record(z.string(), z.any())` - Accepts **any JSON value**, allowing arbitrary fields to be stored in payment gateway config. |

**Fix:** Define explicit config schema per provider:

```typescript
const dokuConfigSchema = z.object({
  clientId: z.string(),
  secretKey: z.string(),
  webhookSecret: z.string(),
  merchantCode: z.string(),
  baseUrl: z.string().url(),
});
```

---

## 4. SENSITIVE DATA EXPOSURE

### 4.1 Payment Gateway Secrets Exposed to Staff (CRITICAL)

| File                                                           | Line    | Issue                                                                                                                   |
| -------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------- |
| `src/app/api/admin/payment-gateways/route.ts`                  | 19-21   | `GET` returns full `config` JSONB including `clientId`, `secretKey`, `webhookSecret`, `merchantCode` to **staff** users |
| `src/app/[locale]/(protected)/admin/payment-gateways/page.tsx` | 130-136 | Edit form displays **secrets in plaintext** in input fields (secretKey, webhookSecret)                                  |
| `src/app/[locale]/(protected)/admin/payment-gateways/page.tsx` | 258     | Secret Key input uses `type="password"` but value is still in DOM                                                       |

**Impact:** Staff users can view and copy all payment gateway credentials.

**Fix:**

1. Restrict GET to `admin` only
2. Mask secrets in API response (return only last 4 chars)
3. Never send secrets to client - use separate admin-only endpoint for secret management

### 4.2 Error Messages Leak Sensitive Info (HIGH)

| File                | Line  | Issue                                                                                                      |
| ------------------- | ----- | ---------------------------------------------------------------------------------------------------------- |
| `src/lib/api.ts`    | 33    | `handleApiError` returns `error.message` directly to client - **stack traces and internal errors exposed** |
| `src/lib/logger.ts` | 34-38 | `logError` logs full error objects including stack traces - **may log sensitive data** from request bodies |

**Fix:** Sanitize error messages in production:

```typescript
export function handleApiError(error: unknown, context?: string) {
  if (error instanceof ApiError) {
    logError(error, context || "API_ERROR", { statusCode: error.statusCode });
    return fail(error.message, error.statusCode);
  }

  if (error instanceof ZodError) {
    // ... existing
  }

  if (error instanceof Error) {
    logError(error, context || "API_ERROR");
    // Never expose internal error messages in production
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message;
    return fail(message, 500);
  }

  return fail("Internal server error", 500);
}
```

### 4.3 User Data Exposure (MEDIUM)

| File                         | Line  | Issue                                                                                                                                    |
| ---------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/api/users/route.ts` | 32-38 | Returns **all user fields** including `phone`, `whatsapp`, `telegram`, `ktpNumber`, `ktpImageUrl`, `balance`, `reputationScore` to staff |

**Fix:** Use select to return only necessary fields per role.

---

## 5. CSRF & AUTHENTICATION

### 5.1 No CSRF Protection (HIGH)

| Scope                   | Issue                                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| All admin API endpoints | **No CSRF tokens** - Relies solely on `sameSite: "lax"` cookies which is insufficient for state-changing operations (POST, PATCH, DELETE) |

**Fix:** Implement CSRF protection using double-submit cookie pattern or use Better Auth's built-in CSRF protection.

### 5.2 Hardcoded Auth Secret (CRITICAL)

| File              | Line | Issue                                                                                                                                                                                                                    |
| ----------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/auth.ts` | 11   | **Hardcoded fallback secret**: `"super-secret-key-yang-panjang-minimal-32-karakter-random-1234567890"` - **This secret is in source code!** If `BETTER_AUTH_SECRET` env var is not set, this predictable secret is used. |

**Impact:** Anyone with access to source code can forge session tokens, impersonate any user, bypass all authentication.

**Fix:**

1. **Remove the fallback entirely** - app should fail to start if secret not set
2. Generate strong random secret: `openssl rand -base64 32`
3. Store in environment variable only

```typescript
// src/lib/auth.ts - FIX
secret: process.env.BETTER_AUTH_SECRET!, // No fallback - will throw if undefined
```

### 5.3 Incomplete Trusted Origins (MEDIUM)

| File              | Line | Issue                                                                                                      |
| ----------------- | ---- | ---------------------------------------------------------------------------------------------------------- |
| `src/lib/auth.ts` | 10   | `trustedOrigins: ["http://localhost:3001"]` - Missing production domain. Should include all valid origins. |

### 5.4 Session Cookie Security (LOW)

| File              | Line | Issue                                                                                |
| ----------------- | ---- | ------------------------------------------------------------------------------------ |
| `src/lib/auth.ts` | 41   | `sameSite: "lax"` - Should be `"strict"` for admin routes for better CSRF protection |

---

## 6. ADDITIONAL FINDINGS

### 6.1 No Rate Limiting (MEDIUM)

| Scope                   | Issue                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| All admin API endpoints | No rate limiting on sensitive operations (user deletion, payment gateway config, withdrawals approval) |

### 6.2 No Audit Logging for Sensitive Actions (MEDIUM)

| Scope                                                                                    | Issue                                             |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------- |
| User role changes, payment gateway config changes, withdrawal approvals, payment refunds | No immutable audit trail of who did what and when |

### 6.3 Client-Side Admin Layout Redirect Bypass (LOW)

| File                                            | Line  | Issue                                                                                                                                    |
| ----------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/[locale]/(protected)/admin/layout.tsx` | 13-17 | Redirect happens in `useEffect` - page renders briefly before redirect. Sensitive data could be in initial HTML if server-side rendered. |

---

## 7. SUMMARY BY SEVERITY

### CRITICAL (5 issues)

1. **Hardcoded auth secret fallback** - `src/lib/auth.ts:11`
2. **Client-side only route protection** - `src/app/[locale]/(protected)/admin/layout.tsx:13-17`
3. **Staff can create/view payment gateway secrets** - `payment-gateways/route.ts:19,29`
4. **Staff can change any user's role (including to admin)** - `users/[id]/route.ts:22,42-45`
5. **Staff can refund/reconcile payments, create manual payments** - Multiple payment endpoints

### HIGH (6 issues)

6. **TypeScript bypass with `as any`** - `kyc/approve/route.ts:18`
7. **Missing Zod validation on 2 endpoints** - `general-ledger/route.ts:52`, `notifications/route.ts:66`
8. **Error messages leak internal details** - `src/lib/api.ts:33`
9. **No CSRF protection on state-changing endpoints**
10. **Payment secrets displayed in plaintext in admin UI** - `payment-gateways/page.tsx:130-136`
11. **SQL injection risk in properties search** - `properties/route.ts:40-44`

### MEDIUM (8 issues)

12. **IDOR on user/property/payment endpoints**
13. **Mass assignment vulnerabilities** - `users/[id]/route.ts:42-45`
14. **Overly permissive payment gateway config schema** - `payment-gateways/route.ts:12`
15. **User PII exposed to staff** - `users/route.ts:32-38`
16. **Logger may log sensitive data** - `src/lib/logger.ts:34-38`
17. **Incomplete trusted origins** - `src/lib/auth.ts:10`
18. **No rate limiting on admin endpoints**
19. **No audit logging for sensitive actions**

### LOW (3 issues)

20. **`sameSite: "lax"` instead of `"strict"`** - `src/lib/auth.ts:41`
21. **Client-side redirect brief render** - `admin/layout.tsx:13-17`
22. **No middleware for server-side route protection**

---

## 8. REMEDIATION PRIORITY

### Immediate (Before Any Deployment)

1. Remove hardcoded auth secret fallback
2. Restrict payment gateway endpoints to `admin` only
3. Restrict user role changes to `admin` only
4. Restrict payment refund/reconcile/create to `admin` only
5. Add server-side middleware for admin route protection

### Within 1 Week

6. Add Zod validation to missing endpoints
7. Implement CSRF protection
8. Mask/separate payment secrets from staff access
9. Fix TypeScript bypass in KYC endpoint
10. Fix mass assignment vulnerabilities

### Within 2 Weeks

11. Add rate limiting
12. Implement audit logging
13. Sanitize error messages in production
14. Fix SQL injection risk
15. Restrict user data exposure per role

---

## 9. TESTING RECOMMENDATIONS

After fixes, verify:

1. Staff user **cannot** access `/api/admin/payment-gateways` (GET/POST/DELETE)
2. Staff user **cannot** change user roles via `/api/admin/users/[id]`
3. Staff user **cannot** refund payments via `/api/admin/payments/[id]`
4. Staff user **cannot** access admin UI pages (server-side redirect)
5. Auth secret is required at startup (app fails without `BETTER_AUTH_SECRET`)
6. CSRF tokens required for all POST/PATCH/DELETE
7. Error responses don't leak stack traces in production
8. Payment gateway secrets never returned to non-admin users

---

_End of Report_
