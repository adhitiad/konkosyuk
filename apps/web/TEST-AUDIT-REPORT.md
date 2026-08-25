# Testing & Coverage Audit Report — KonkosYuk Web App

**Audit Date:** 2026-08-24  
**Auditor:** Kilo (AI)  
**Scope:** `apps/web` — Next.js 16 App Router, TypeScript, Vitest, Playwright

---

## Executive Summary

| Metric                            | Value                            | Status                          |
| --------------------------------- | -------------------------------- | ------------------------------- |
| Total Unit Test Files             | 48                               | ✅ Good breadth                 |
| Total E2E Test Files              | 9                                | ⚠️ Limited critical flows       |
| Overall Coverage (per TESTING.md) | 77.6% statements, 58.9% branches | ⚠️ Below 90% for critical paths |
| Known TypeScript Errors           | 3 files                          | ❌ Blocking CI                  |

**Critical Gaps:**

- **0 tests** for webhook handlers (`src/app/api/webhooks/[provider]/route.ts`, `src/lib/payments/webhook.ts`)
- **0 tests** for payment provider adapters (ipaymu, doku, nicepay, mock)
- **0 tests** for auth flows (Better Auth middleware, session validation, 2FA)
- **0 tests** for Server Actions (`createBookingAction`, `reviewBookingAction`, `checkoutBookingAction`, property CRUD)
- **0 tests** for error boundaries (none exist in codebase)
- **0 tests** for admin webhook reprocessing
- TypeScript errors in 3 files blocking `tsc --noEmit`

---

## 1. Unit Test Inventory (48 files)

### Test Files by Category

| Category                  | Files | Notes                                                                                                                                                                                   |
| ------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Utilities / Core Lib**  | 12    | currency, sanitize, geolocation, rate-limit, csrf, zod-validation, redis, perf, packages/calculator                                                                                     |
| **Payments**              | 4     | calculations, signature, receipt-template, packages/calculator (duplicated)                                                                                                             |
| **Accounting**            | 2     | ledger, auto-ledger                                                                                                                                                                     |
| **Cron/Workers**          | 5     | saved-search-matcher, idempotency, scheduler, processors, main.worker                                                                                                                   |
| **Queue**                 | 1     | queues                                                                                                                                                                                  |
| **Stores (Zustand)**      | 2     | auth.store, filter.store                                                                                                                                                                |
| **Hooks**                 | 1     | use-geolocation                                                                                                                                                                         |
| **Components (Property)** | 10    | unit-tabs, search-page-split, room-specs-card, room-facilities-grid, property-rules-list, property-list-panel, owner-profile-card, nearby-places-list, filter-chips-bar, detail-sidebar |
| **Components (Landing)**  | 2     | popular-areas-section, campus-areas-section                                                                                                                                             |
| **Server Actions**        | 2     | reviews, reviews-reputation                                                                                                                                                             |
| **API Routes**            | 8     | newsletter/subscribe, ads, ads/[id]/click, campus-areas, popular-areas, properties, owner/occupancy, owner/revenue, admin/feature-flags, admin/audit-logs                               |
| **Scripts**               | 2     | seed, sync-worker-env                                                                                                                                                                   |

### Test Quality Assessment

| File                          | Lines     | Tests      | Quality      | Issues                                                                                  |
| ----------------------------- | --------- | ---------- | ------------ | --------------------------------------------------------------------------------------- |
| `currency.test.ts`            | 32        | 5          | ✅ Good      | Covers zero, decimals, negatives, large numbers                                         |
| `sanitize.test.ts`            | 75        | 8          | ✅ Good      | HTML escaping, nested objects, arrays, null/undefined                                   |
| `calculations.test.ts`        | 72        | 9          | ✅ Good      | DP 35/65%, edge cases, leap year, negative months                                       |
| `signature.test.ts`           | 127       | 15         | ✅ Excellent | HMAC, SHA256, timing-safe compare, MD5 legacy, null handling                            |
| `rate-limit.test.ts`          | 81        | 8          | ✅ Good      | Redis mock, limit boundary, fail-open on Redis error                                    |
| `csrf.test.ts`                | 97        | 10         | ✅ Good      | Timing-safe compare, empty tokens, different lengths                                    |
| `packages/calculator.test.ts` | 155       | 17         | ✅ Excellent | Final price, discount, end date, custom duration, validation                            |
| `receipt-template.test.tsx`   | 73        | 4          | ⚠️ Basic     | Only smoke tests (renders, non-empty PDF)                                               |
| `reviews.test.ts`             | 243       | 4          | ✅ Good      | Notification dispatch, edge cases (null reviewedUserId, self-reply, failure resilience) |
| `reviews-reputation.test.ts`  | ~200      | ~6         | ⚠️ Not read  | Need to verify                                                                          |
| Component tests               | ~200 each | ~5-10 each | ⚠️ Shallow   | Mostly render/smoke, limited interaction testing                                        |

**Strengths:**

- Payment-critical modules (currency, calculations, signature, sanitize) have **90%+ coverage thresholds** enforced in `vitest.config.ts`
- Good mocking strategy for Redis, BullMQ, Drizzle
- Security-focused tests for CSRF, rate limiting, signature verification

**Weaknesses:**

- Component tests are mostly render-only; no user interaction testing (click, form submit)
- No tests for API route handlers beyond 8 simple endpoints
- No integration tests for Server Actions (largest business logic surface)
- Webhook processing (362 lines) completely untested

---

## 2. E2E Test Inventory (9 files)

| File                         | Lines | Critical Flow Coverage                                     |
| ---------------------------- | ----- | ---------------------------------------------------------- |
| `auth.spec.ts`               | 28    | Login page render, email/password validation only          |
| `booking-flow.spec.ts`       | 33    | Booking form display, DP display, past-date validation     |
| `property-search.spec.ts`    | 29    | Search page render, type filter, city search               |
| `owner-management.spec.ts`   | 27    | Dashboard render, create property form, required fields    |
| `group-bookings-api.spec.ts` | 227   | **Comprehensive** — CRUD, auth, CSRF, cleanup              |
| `review-reputation.spec.ts`  | 67    | Submit review, rating update                               |
| `upload-csrf.spec.ts`        | 103   | Upload with CSRF, reject without CSRF, fake file rejection |
| `typed-routes.spec.ts`       | 77    | Public page reachability, internal link validation         |
| `csp-nonce.spec.ts`          | 89    | CSP nonce headers, allowlisted domains                     |

### E2E Coverage Gaps (CRITICAL)

| Missing Flow                                                                                    | Severity     | Business Impact                       |
| ----------------------------------------------------------------------------------------------- | ------------ | ------------------------------------- |
| **Full booking lifecycle** (create → DP payment → owner approval → full payment → confirmation) | **CRITICAL** | Core revenue flow untested end-to-end |
| **Payment webhook processing** (success/failed/expired)                                         | **CRITICAL** | Money movement unverified             |
| **User registration + email verification**                                                      | HIGH         | Onboarding broken silently            |
| **Password reset flow**                                                                         | HIGH         | Account recovery untested             |
| **2FA setup / login with TOTP**                                                                 | HIGH         | Security feature unverified           |
| **KYC verification flow**                                                                       | HIGH         | Owner onboarding blocked              |
| **Featured listing payment + activation**                                                       | MEDIUM       | Revenue feature untested              |
| **Refund request → approval → processing**                                                      | MEDIUM       | Financial liability                   |
| **Maintenance ticket lifecycle**                                                                | MEDIUM       | Operations flow untested              |
| **Chat / messaging between tenant & owner**                                                     | LOW          | Communication feature                 |

---

## 3. Test Setup (`src/__tests__/setup.ts`)

```typescript
// Current setup (23 lines)
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

Object.defineProperty(window, "matchMedia", { ... });

afterEach(() => { cleanup(); });
```

### Findings

| Issue                                | Severity | Description                                                                                                                               |
| ------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **No global mocks for Next.js APIs** | HIGH     | `headers()`, `cookies()`, `next/navigation` not mocked — Server Actions tests will fail or need per-test mocks                            |
| **No Better Auth mock**              | HIGH     | `auth.api.getSession` used in every Server Action — must be mocked per test (currently done inline in `reviews.test.ts` but not reusable) |
| **No Drizzle/db mock factory**       | MEDIUM   | Each test file reimplements mock DB; should centralize in setup                                                                           |
| **No `vi.mock` hoisting helpers**    | MEDIUM   | Repetitive `vi.hoisted(() => ...)` patterns across tests                                                                                  |
| **No test utilities**                | MEDIUM   | No `createMockSession()`, `createMockFormData()`, `renderWithProviders()` helpers                                                         |

**Recommended Fix:** Create `src/__tests__/utils.ts` with shared mocks and helpers; import in `setup.ts`.

---

## 4. Coverage Thresholds (`vitest.config.ts`)

```typescript
thresholds: {
  lines: 65, functions: 65, branches: 55, statements: 65,
  "src/lib/utils/currency.ts": { lines: 90, functions: 90, branches: 90, statements: 90 },
  "src/lib/payments/calculations.ts": { lines: 90, functions: 90, branches: 90, statements: 90 },
  "src/lib/payments/signature.ts": { lines: 90, functions: 90, branches: 80, statements: 90 },
  "src/lib/sanitize.ts": { lines: 90, functions: 90, branches: 90, statements: 90 },
  "src/lib/packages/calculator.ts": { lines: 90, functions: 90, branches: 90, statements: 90 },
}
```

### Assessment

| File                     | Threshold        | Actual (per TESTING.md) | Status  |
| ------------------------ | ---------------- | ----------------------- | ------- |
| `currency.ts`            | 90%              | 100%                    | ✅ Pass |
| `calculations.ts`        | 90%              | 100%                    | ✅ Pass |
| `signature.ts`           | 90%/80% branches | 95%/88.9%               | ✅ Pass |
| `sanitize.ts`            | 90%              | 100%/92.9%              | ✅ Pass |
| `packages/calculator.ts` | 90%              | 96.96%/95.65%           | ✅ Pass |
| **Overall**              | 65%/55% branches | 77.6%/58.9%             | ✅ Pass |

**Critical Issue:** The **overall branch threshold is only 55%** — far too low for a payment platform. Branches represent error paths, edge cases, and security checks. Recommend **raising to 70% minimum, 85% for critical modules**.

**Missing Thresholds for Critical Files:**

- `src/lib/payments/webhook.ts` (362 lines, 0% coverage)
- `src/lib/payments/ipaymu.ts` (201 lines, 0% coverage)
- `src/lib/payments/doku.ts` (untested)
- `src/lib/payments/nicepay.ts` (untested)
- `src/actions/bookings.ts` (929 lines, 0% coverage)
- `src/actions/properties.ts` (717 lines, 0% coverage)
- `src/lib/auth.ts` (161 lines, 0% coverage)
- `src/lib/webhook-ip-allowlist.ts` (66 lines, 0% coverage)

---

## 5. Known TypeScript Errors (per AGENTS.md)

| File                                                       | Issue                                                                           | Current Status                                                                           |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/app/api/newsletter/subscribe/__tests__/route.test.ts` | Type assertion `as unknown as Parameters<typeof POST>[0]`                       | **Still present** (line 12, 24) — test casts mock Request incorrectly                    |
| `src/app/global-not-found.tsx`                             | Invalid HTML structure: `<html>`/`<body>` inside a component                    | **Still present** (lines 21-52) — Next.js 16 expects plain React, not full HTML document |
| `src/scripts/__tests__/seed.test.ts`                       | Import `ACCOUNTS` from `@/scripts/seed` — path alias may not resolve in scripts | **Still present** — needs verification                                                   |

### Fix Recommendations

1. **newsletter test:** Create proper `NextRequest` mock using `new Request()` or `NextRequest` constructor
2. **global-not-found.tsx:** Remove `<html>`/`<body>` tags; return fragment or `<div>` with styling
3. **seed.test.ts:** Verify `scripts/seed.ts` exports `ACCOUNTS` correctly; fix import path if needed

---

## 6. Missing Tests — Critical Paths Matrix

| Component                   | File(s)                                                                                                                   | Lines      | Current Tests | Severity     | Recommended Action                                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Webhook Handler**         | `src/app/api/webhooks/[provider]/route.ts`<br>`src/lib/payments/webhook.ts`                                               | 75 + 362   | 0             | **CRITICAL** | Unit test `handleWebhookRequest` with mocked adapters; integration test for idempotency, signature verification, amount mismatch, duplicate detection             |
| **Payment Adapters**        | `src/lib/payments/ipaymu.ts`<br>`src/lib/payments/doku.ts`<br>`src/lib/payments/nicepay.ts`<br>`src/lib/payments/mock.ts` | ~200 each  | 0             | **CRITICAL** | Test `createPayment`, `getPaymentStatus`, `verifyWebhookSignature`, `normalizeWebhook` for each provider; mock axios                                              |
| **Booking Server Actions**  | `src/actions/bookings.ts`                                                                                                 | 929        | 0             | **CRITICAL** | Test `createBookingAction`, `reviewBookingAction`, `checkoutBookingAction`, `getBookingsAction`, `getBookingByIdAction` — mock auth, db, payments, notifications  |
| **Property Server Actions** | `src/actions/properties.ts`                                                                                               | 717        | 0             | **CRITICAL** | Test `createPropertyAction`, `updatePropertyAction`, `deletePropertyAction`, `featurePropertyAction`, `checkoutFeaturedAction` — KYC checks, ownership validation |
| **Auth Configuration**      | `src/lib/auth.ts`                                                                                                         | 161        | 0             | **CRITICAL** | Test `requireSession` role guards, Better Auth hooks (banned user check), 2FA plugin config, cookie settings                                                      |
| **Webhook IP Allowlist**    | `src/lib/webhook-ip-allowlist.ts`                                                                                         | 66         | 0             | **HIGH**     | Test CIDR matching, IPv4 parsing, missing provider config, header precedence (x-forwarded-for vs x-real-ip)                                                       |
| **Admin Webhook Reprocess** | `src/app/api/admin/webhooks/route.ts`                                                                                     | 43         | 0             | **HIGH**     | Test GET with filters, signature re-verification on reprocess                                                                                                     |
| **CSRF Route**              | `src/app/api/csrf/route.ts`                                                                                               | (not read) | 0             | **HIGH**     | Test token generation, cookie setting, rotation                                                                                                                   |
| **Auth API Routes**         | `src/app/api/auth/[...all]/route.ts`                                                                                      | 14         | 0             | **HIGH**     | Test rate limiting wrapper, GET/POST delegation                                                                                                                   |
| **Error Boundaries**        | _None exist_                                                                                                              | N/A        | 0             | **HIGH**     | Add React Error Boundary components; test fallback UI, error logging (Sentry)                                                                                     |
| **Rate Limit Integration**  | `src/lib/rate-limit.ts`                                                                                                   | (not read) | Unit only     | **MEDIUM**   | Integration test: multiple requests hit limit, window expiry, Redis failure fail-open                                                                             |
| **Notification Service**    | `src/lib/notification-service.ts`                                                                                         | (not read) | 0             | **MEDIUM**   | Test `dispatchNotification` channels (in-app, email, push), priority handling                                                                                     |
| **Fraud Check**             | `src/lib/fraud-check.ts`                                                                                                  | (not read) | 0             | **MEDIUM**   | Test velocity checks, amount thresholds, blocked user detection                                                                                                   |
| **Audit Log**               | `src/lib/audit-log.ts`                                                                                                    | (not read) | 0             | **MEDIUM**   | Test `createAuditLog` writes, admin-only access                                                                                                                   |
| **Group Booking Actions**   | `src/actions/group-bookings.ts`                                                                                           | (not read) | 0             | **MEDIUM**   | Test create, invite, membership status, cancellation                                                                                                              |
| **Upload Actions**          | `src/actions/upload.ts`                                                                                                   | (not read) | 0             | **MEDIUM**   | Test multipart handling, file validation, Cloudinary integration                                                                                                  |
| **Maintenance Actions**     | `src/actions/maintenance.ts`                                                                                              | (not read) | 0             | **LOW**      | Test ticket creation, assignment, completion                                                                                                                      |

---

## 7. Test Execution Results

**Command:** `bun run test -- --run` (from `apps/web`)

> **Note:** Could not execute due to environment restrictions. However, based on `TEST-RESULTS.md` and `TESTING.md`:

| Metric                        | Value                                                            | Source          |
| ----------------------------- | ---------------------------------------------------------------- | --------------- |
| Test Files (recent run)       | 9                                                                | TEST-RESULTS.md |
| Test Cases (recent run)       | 45                                                               | TEST-RESULTS.md |
| Passed                        | 45                                                               | TEST-RESULTS.md |
| Failed                        | 0                                                                | TEST-RESULTS.md |
| **Total Test Files (actual)** | **48**                                                           | Glob search     |
| **Pre-existing Failures**     | `popular-areas-section.test.tsx` (Next.js navigation mock issue) | TEST-RESULTS.md |
| **Timeout Failure**           | `idempotency.test.ts`                                            | CHANGELOG.md    |

**Discrepancy:** `TEST-RESULTS.md` only shows 9 files / 45 tests — likely from a partial run. Full suite has 48 files. Need full `bun run test -- --run --coverage` to get accurate numbers.

---

## 8. Prioritized Action Plan

### Phase 1: Unblock CI (IMMEDIATE)

| Task                                      | File                                                       | Effort |
| ----------------------------------------- | ---------------------------------------------------------- | ------ |
| Fix TypeScript error in newsletter test   | `src/app/api/newsletter/subscribe/__tests__/route.test.ts` | 15 min |
| Fix `global-not-found.tsx` HTML structure | `src/app/global-not-found.tsx`                             | 10 min |
| Verify/fix `seed.test.ts` import          | `src/scripts/__tests__/seed.test.ts`                       | 10 min |

### Phase 2: Critical Security & Payment Coverage (WEEK 1)

| Task                                           | File(s)                                                                   | Effort  |
| ---------------------------------------------- | ------------------------------------------------------------------------- | ------- |
| Add webhook handler tests (unit + integration) | `src/lib/payments/webhook.ts`, `src/app/api/webhooks/[provider]/route.ts` | 4-6 hrs |
| Add payment adapter tests (all 4 providers)    | `src/lib/payments/*.ts`                                                   | 6-8 hrs |
| Add webhook IP allowlist tests                 | `src/lib/webhook-ip-allowlist.ts`                                         | 1 hr    |
| Raise overall branch threshold to 70%          | `vitest.config.ts`                                                        | 5 min   |

### Phase 3: Core Business Logic Coverage (WEEK 2)

| Task                                   | File(s)                     | Effort   |
| -------------------------------------- | --------------------------- | -------- |
| Add Server Action tests for bookings   | `src/actions/bookings.ts`   | 8-12 hrs |
| Add Server Action tests for properties | `src/actions/properties.ts` | 6-8 hrs  |
| Add auth configuration tests           | `src/lib/auth.ts`           | 2-3 hrs  |
| Add error boundary components + tests  | New files                   | 3-4 hrs  |

### Phase 4: E2E Critical Flows (WEEK 3)

| Task                                 | File(s)                                | Effort  |
| ------------------------------------ | -------------------------------------- | ------- |
| Full booking lifecycle E2E           | New `e2e/booking-lifecycle.spec.ts`    | 4-6 hrs |
| Payment webhook E2E (mock provider)  | Extend `e2e/booking-lifecycle.spec.ts` | 2-3 hrs |
| User registration + verification E2E | Extend `e2e/auth.spec.ts`              | 2 hrs   |
| 2FA setup/login E2E                  | New `e2e/2fa.spec.ts`                  | 3-4 hrs |

### Phase 5: Test Infrastructure Improvements (ONGOING)

| Task                                                                       | Effort |
| -------------------------------------------------------------------------- | ------ |
| Centralize test utilities in `src/__tests__/utils.ts`                      | 2 hrs  |
| Add `createMockSession()`, `createMockFormData()`, `renderWithProviders()` | 1 hr   |
| Add Drizzle mock factory                                                   | 2 hrs  |
| Document test patterns in `TESTING.md`                                     | 1 hr   |

---

## 9. Risk Assessment

| Risk                                         | Likelihood | Impact                            | Mitigation                                         |
| -------------------------------------------- | ---------- | --------------------------------- | -------------------------------------------------- |
| **Webhook signature bypass**                 | HIGH       | Financial loss, fraud             | Add comprehensive webhook tests immediately        |
| **Booking double-charge / state corruption** | MEDIUM     | Financial loss, user trust        | Test `checkoutBookingAction` + webhook idempotency |
| **Auth bypass via role confusion**           | MEDIUM     | Data breach, privilege escalation | Test `requireSession` with all role combinations   |
| **CSRF token prediction/replay**             | LOW        | Account takeover                  | Existing CSRF tests adequate; add E2E verification |
| **Payment amount tampering**                 | MEDIUM     | Revenue loss                      | Webhook tests must cover amount mismatch detection |
| **TypeScript errors blocking deploy**        | CERTAIN    | CI failure                        | Fix 3 known errors immediately                     |

---

## 10. Appendix: File Paths Reference

### Unit Test Files (48)

```
src/lib/__tests__/zod-validation.test.ts
src/lib/__tests__/sanitize.test.ts
src/lib/__tests__/redis.test.ts
src/lib/__tests__/rate-limit.test.ts
src/lib/__tests__/perf.test.ts
src/lib/__tests__/csrf.test.ts
src/lib/utils/__tests__/geolocation.test.ts
src/lib/utils/__tests__/currency.test.ts
src/lib/accounting/__tests__/ledger.test.ts
src/lib/accounting/__tests__/auto-ledger.test.ts
src/lib/cron/__tests__/saved-search-matcher.test.ts
src/lib/cron/__tests__/idempotency.test.ts
src/lib/queue/__tests__/queues.test.ts
src/lib/packages/__tests__/calculator.test.ts
src/lib/payments/__tests__/signature.test.ts
src/lib/payments/__tests__/receipt-template.test.tsx
src/lib/payments/__tests__/calculations.test.ts
src/hooks/__tests__/use-geolocation.test.ts
src/stores/__tests__/filter.store.test.ts
src/stores/__tests__/auth.store.test.ts
src/components/property/__tests__/unit-tabs.test.tsx
src/components/property/__tests__/search-page-split.test.tsx
src/components/property/__tests__/room-specs-card.test.tsx
src/components/property/__tests__/room-facilities-grid.test.tsx
src/components/property/__tests__/property-rules-list.test.tsx
src/components/property/__tests__/property-list-panel.test.tsx
src/components/property/__tests__/owner-profile-card.test.tsx
src/components/property/__tests__/nearby-places-list.test.tsx
src/components/property/__tests__/filter-chips-bar.test.tsx
src/components/property/__tests__/detail-sidebar.test.tsx
src/components/landing/__tests__/popular-areas-section.test.tsx
src/components/landing/__tests__/campus-areas-section.test.tsx
src/actions/__tests__/reviews.test.ts
src/actions/__tests__/reviews-reputation.test.ts
src/workers/__tests__/scheduler.test.ts
src/workers/__tests__/processors.test.ts
src/workers/__tests__/main.worker.test.ts
src/workers/processors/__tests__/processors.test.ts
src/scripts/__tests__/seed.test.ts
src/scripts/__tests__/sync-worker-env.test.ts
src/app/api/newsletter/subscribe/__tests__/route.test.ts
src/app/api/ads/__tests__/route.test.ts
src/app/api/ads/[id]/click/__tests__/route.test.ts
src/app/api/campus-areas/__tests__/route.test.ts
src/app/api/popular-areas/__tests__/route.test.ts
src/app/api/properties/__tests__/route.test.ts
src/app/api/owner/occupancy/__tests__/route.test.ts
src/app/api/owner/revenue/__tests__/route.test.ts
src/app/api/admin/feature-flags/__tests__/route.test.ts
src/app/api/admin/audit-logs/__tests__/route.test.ts
```

### E2E Test Files (9)

```
e2e/auth.spec.ts
e2e/booking-flow.spec.ts
e2e/property-search.spec.ts
e2e/owner-management.spec.ts
e2e/group-bookings-api.spec.ts
e2e/review-reputation.spec.ts
e2e/upload-csrf.spec.ts
e2e/typed-routes.spec.ts
e2e/csp-nonce.spec.ts
```

### Critical Source Files Needing Tests

```
src/lib/payments/webhook.ts                    (362 lines)
src/lib/payments/ipaymu.ts                     (201 lines)
src/lib/payments/doku.ts                       (~200 lines)
src/lib/payments/nicepay.ts                    (~200 lines)
src/lib/payments/mock.ts                       (~100 lines)
src/actions/bookings.ts                        (929 lines)
src/actions/properties.ts                      (717 lines)
src/actions/group-bookings.ts                  (unknown)
src/actions/withdrawals.ts                     (unknown)
src/actions/bank-accounts.ts                   (unknown)
src/actions/refund-requests.ts                 (unknown)
src/lib/auth.ts                                (161 lines)
src/lib/auth-client.ts                         (unknown)
src/lib/webhook-ip-allowlist.ts                (66 lines)
src/lib/notification-service.ts                (unknown)
src/lib/fraud-check.ts                         (unknown)
src/lib/audit-log.ts                           (unknown)
src/app/api/webhooks/[provider]/route.ts       (75 lines)
src/app/api/admin/webhooks/route.ts            (43 lines)
src/app/api/auth/[...all]/route.ts             (14 lines)
src/app/api/csrf/route.ts                      (unknown)
```

---

_End of Report_
