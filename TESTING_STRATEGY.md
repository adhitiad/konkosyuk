# KonkosYuk Testing Strategy Audit & Recommendations

**Generated:** 2026-08-25
**Project:** KonkosYuk Monorepo (apps/web)

---

## 1. Current Test Infrastructure Summary

### 1.1 Test Configuration (`vitest.config.ts`)

| Aspect | Configuration |
|--------|--------------|
| **Framework** | Vitest 4.1.10 with jsdom environment |
| **React Testing** | @vitejs/plugin-react, @testing-library/react, @testing-library/jest-dom |
| **Setup File** | `src/__tests__/setup.ts` - minimal cleanup + matchMedia mock |
| **Test Pattern** | `src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}` |
| **Exclusions** | node_modules, .next, dist, e2e, app/**, components/** |
| **Coverage Provider** | v8 (native) |
| **Reporters** | text, json, html, lcov |

### 1.2 Coverage Thresholds (Current)

| Scope | Lines | Functions | Branches | Statements |
|-------|-------|-----------|----------|------------|
| **Global Default** | 65% | 65% | 55% | 65% |
| **Currency Utils** | 90% | 90% | 90% | 90% |
| **Payment Calculations** | 90% | 90% | 90% | 90% |
| **Payment Signature** | 90% | 90% | 80% | 90% |
| **Sanitize Utils** | 90% | 90% | 90% | 90% |
| **Package Calculator** | 90% | 90% | 90% | 90% |

### 1.3 Test Scripts (`package.json`)

```json
{
  "test": "vitest",           // Watch mode
  "test:ui": "vitest --ui",   // UI dashboard
  "test:coverage": "vitest run --coverage",  // CI mode with coverage
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

### 1.4 Playwright E2E Config

- **Base URL**: `http://localhost:3000` (auto-starts `bun run dev`)
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome (Pixel 5)
- **Retries**: 2 in CI, 0 locally
- **Workers**: 1 in CI, parallel locally
- **Artifacts**: trace on first retry, screenshot/video on failure
- **Reporters**: HTML, JSON, JUnit XML

### 1.5 Test Setup (`src/__tests__/setup.ts`)

```typescript
// Minimal setup:
// - Cleanup after each test (@testing-library/react)
// - jest-dom matchers
// - Mock DATABASE_URL for tests
// - Mock window.matchMedia (for responsive components)
```

---

## 2. Existing Tests Inventory

### 2.1 Unit Tests (58 test files)

| Category | Files | Purpose |
|----------|-------|---------|
| **Payments** | 3 | Calculations (DP, dates), HMAC/SHA256 signatures, receipt templates |
| **Utilities** | 4 | Currency formatting, geolocation, sanitize, zod validation |
| **Lib/Infrastructure** | 6 | Redis, rate-limit, CSRF, performance, queue, idempotency guards |
| **Cron Jobs** | 2 | Saved search matcher, idempotency (cleanup/complete bookings) |
| **Workers/Processors** | 3 | Scheduler registration, processor mocks (cleanup, complete, saved search, area counts) |
| **Accounting** | 2 | Ledger, auto-ledger |
| **Stores (Zustand)** | 2 | Filter store, auth store |
| **Hooks** | 1 | use-geolocation |
| **Components** | 13 | Property UI components (filter chips, unit tabs, search, cards, etc.) |
| **Landing** | 2 | Popular areas, campus areas sections |
| **API Routes** | 11 | Properties, newsletter, popular areas, owner revenue, ads, campus areas, admin feature flags, audit logs, occupancy |
| **Actions** | 2 | Reviews, reviews-reputation |
| **Scripts** | 1 | Seed test |

### 2.2 Integration Tests

**Currently:** Very few true integration tests. Most "API route tests" are unit tests with mocked DB. No tests spin up a real database or test container.

### 2.3 E2E Tests (9 test files)

| File | Coverage |
|------|----------|
| `auth.spec.ts` | Login page, email validation, password length |
| `booking-flow.spec.ts` | Booking form display, DP calculation display, past date validation |
| `review-reputation.spec.ts` | Review submission, rating update |
| `group-bookings-api.spec.ts` | Full CRUD API for group bookings (create, get, delete, membership) |
| `property-search.spec.ts` | Property search UI |
| `owner-management.spec.ts` | Owner dashboard flows |
| `add-property-dialog.spec.ts` | Property creation dialog |
| `upload-csrf.spec.ts` | CSRF token handling for uploads |
| `typed-routes.spec.ts` | Route type checking |
| `csp-nonce.spec.ts` | CSP nonce validation |

---

## 3. Test Coverage Gap Analysis

### 3.1 Business Logic - CRITICAL GAPS (0% Coverage)

| Domain | Key Functions | Test Status |
|--------|--------------|-------------|
| **Referral System** | `startReferralVerification`, `handleReferralFailureOnRefund`, `sweepEligibleReferrals`, `calculateCommissionAmount`, `calculateEligibleAt`, `getCommissionRate` | ❌ **ZERO TESTS** |
| **Voucher System** | `validateAndApplyVoucher`, `redeemVoucherAtomically`, `markVoucherRedeemed` | ❌ **ZERO TESTS** |
| **Commission Calculation** | Tier-based rates (Owner: 1%/2%/3.67%/4.82%, Tenant: 0.9%/1.86%/2.79%/3.96%) | ❌ **ZERO TESTS** |
| **Loyalty System** | Transaction logging, balance calculation, reward redemption, tier progression | ❌ **ZERO TESTS** |
| **Group Booking** | `createGroupBookingAction`, member invitation, share calculation, confirmation | ❌ **ZERO UNIT TESTS** (only E2E API) |
| **Fraud Scoring** | `checkFraudFlags` (failed payments 24h, amount >10M) | ❌ **ZERO TESTS** |
| **Payment Webhooks** | `handleWebhookRequest` (signature verification, idempotency, amount matching, referral trigger, notifications) | ❌ **ZERO TESTS** |
| **Booking Lifecycle** | DP → approval → full payment → confirmation → completion → inspection | ❌ **ZERO TESTS** |
| **Inspection System** | Move-in/move-out, damage scoring, security deposit refund | ❌ **ZERO TESTS** |
| **Withdrawal System** | Owner bank accounts, withdrawal requests, admin approval, payout | ❌ **ZERO TESTS** |
| **Seasonal Pricing** | Rules application, analytics, suggestions | ❌ **ZERO TESTS** |
| **KYC Verification** | Webhook handling, status transitions, user kycStatus update | ❌ **ZERO TESTS** |

### 3.2 API Routes - Mutation Endpoints (Largely Untested)

| Endpoint | Method | Test Status |
|----------|--------|-------------|
| `/api/referrals` | GET, POST, PUT | ❌ |
| `/api/loyalty/rewards` | GET, POST (redeem) | ❌ |
| `/api/loyalty/transactions` | GET | ❌ |
| `/api/group-bookings` | GET, POST, PUT, DELETE | ⚠️ E2E only |
| `/api/group-bookings/[id]/members/me` | GET, PUT | ⚠️ E2E only |
| `/api/payments` | GET | ⚠️ Unit (read only) |
| `/api/admin/payments` | GET, PATCH | ❌ |
| `/api/admin/refund-requests` | GET, PATCH | ❌ |
| `/api/admin/webhooks` | GET | ⚠️ Unit |
| `/api/kyc/webhook` | POST | ❌ |
| `/api/webhooks/{provider}` | POST | ❌ |
| `/api/bookings` | POST (create) | ❌ |
| `/api/properties` | POST, PUT, DELETE | ⚠️ Partial (GET only) |

### 3.3 Database Transactions & Race Conditions

| Scenario | Current Protection | Test Status |
|----------|-------------------|-------------|
| Referral double-spend (voucher) | `UPDATE ... WHERE voucherRedeemedAt IS NULL` | ❌ |
| Group booking concurrent confirmation | `FOR UPDATE` on unit + overlap check | ❌ |
| Booking creation double-book | `FOR UPDATE` on unit | ❌ |
| Withdrawal balance race | `FOR UPDATE` on user row | ❌ |
| Voucher validation + redeem TOCTOU | Single atomic UPDATE RETURNING | ❌ |
| Referral link concurrent | `FOR UPDATE` on referral row | ❌ |
| Payment webhook idempotency | Payload hash + eventId unique constraint | ⚠️ Partially tested in cron |

### 3.4 Authentication & Authorization

| Flow | Test Status |
|------|-------------|
| Register (email/password) | ⚠️ E2E only (basic validation) |
| Login (email/password) | ⚠️ E2E only (basic) |
| Google OAuth | ❌ |
| Email verification | ❌ |
| Password reset | ❌ |
| 2FA TOTP setup/verify | ❌ |
| Backup codes | ❌ |
| Account linking | ❌ |
| Role-based access (cust/owner/admin/staff) | ❌ |
| Session management | ❌ |
| Banned user handling | ❌ |

### 3.5 Security Scenarios (0% Coverage)

| Threat | Test Needed |
|--------|-------------|
| **IDOR** - Access other users' bookings/properties/referrals | ❌ |
| **Privilege Escalation** - Staff accessing admin endpoints | ❌ |
| **Invalid Input** - SQL injection, XSS in reviews/chat/maintenance | ❌ |
| **Replay Webhook** - Duplicate payment webhook with same payload | ❌ |
| **Duplicate Request** - Double-click booking/payment submission | ❌ |
| **Rate Limit Bypass** - IP rotation, header manipulation | ❌ |
| **CSRF Bypass** - Missing token, token reuse | ⚠️ Unit only |
| **Webhook Signature Forgery** - Invalid HMAC, timing attacks | ⚠️ Unit (signature lib only) |
| **Payment Amount Tampering** - Modify amount in webhook | ❌ |
| **Refund Fraud** - Request refund for non-existent payment | ❌ |

---

## 4. Current Test Patterns Analysis

### 4.1 Unit Test Pattern (Vitest + React Testing Library)

```typescript
// Typical pattern seen in codebase:
import { describe, it, expect, vi, beforeEach } from "vitest";
import { functionUnderTest } from "@/lib/...";

// Mock external dependencies
vi.mock("@/db", () => ({ db: mockDb }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));

describe("functionUnderTest", () => {
  beforeEach(() => { vi.clearAllMocks(); });
  
  it("should do X when Y", async () => {
    // Setup mocks
    // Execute
    // Assert
  });
});
```

**Strengths:**
- Good mocking strategy with `vi.hoisted()` for cross-mock references
- Clear separation of test modules
- Proper cleanup with `beforeEach`

**Weaknesses:**
- No test database / test containers
- Heavy mocking makes tests brittle to implementation changes
- No factory/fixture system for test data

### 4.2 E2E Test Pattern (Playwright)

```typescript
// API-level E2E with CSRF handling
async function authenticatedRequest(page, { method, url, body }) {
  const csrfToken = await getCsrfToken(page);
  const headers = { "X-CSRF-Token": csrfToken };
  return page.request[method](url, { headers, data: body });
}

test.describe("Feature", () => {
  test.beforeEach(async ({ page }) => { /* login + setup */ });
  test.afterEach(async ({ page }) => { /* cleanup */ });
  
  test("should do X", async ({ page }) => { /* test */ });
});
```

**Strengths:**
- Tests real HTTP stack
- CSRF token handling
- Test data cleanup in afterEach

**Weaknesses:**
- Depends on seeded test users (`owner@test.com`, `tenant@test.com`)
- No test database isolation - tests pollute shared dev DB
- Limited critical user flows covered

---

## 5. Mocking Strategy Assessment

### 5.1 Current Mocking Approach

| Dependency | Mocking Method | Quality |
|------------|----------------|---------|
| **Database (Drizzle)** | `vi.mock("@/db")` with chainable mock returning arrays | ⚠️ Fragile - tightly coupled to query builder API |
| **Redis** | `vi.mock("@/lib/redis")` returning mock incr | ✅ Good for rate-limit |
| **Auth (Better Auth)** | `vi.mock("@/lib/auth")` with session mock | ✅ Adequate |
| **Logger (Winston)** | `vi.mock("@/lib/logger")` | ✅ Good |
| **Cache** | `vi.mock("@/lib/cache")` | ✅ Good |
| **Notifications** | `vi.mock("@/lib/notifications")` | ✅ Good |
| **External APIs (Payment Gateways)** | Not mocked in unit tests | ❌ Missing |
| **Email (Resend)** | Not mocked | ❌ Missing |
| **KYC Provider (Didit)** | Not mocked | ❌ Missing |

### 5.2 Recommended Mocking Strategy

1. **Database**: Use **test containers** (Testcontainers for Postgres) for integration tests; keep unit mocks for pure logic
2. **External Services**: Create **MSW (Mock Service Worker)** handlers for payment gateways, email, KYC
3. **Test Data**: Build **factory functions** using `@faker-js/faker` for consistent test entities
4. **Auth**: Create `createMockSession(role, userId)` helper

---

## 6. Recommended Tests to Add (Prioritized)

### P0 - Critical Business Logic (Immediate)

| Priority | Test Target | Type | Rationale |
|----------|-------------|------|-----------|
| 1 | Referral commission calculation (all 4 tiers, both categories) | Unit | Core revenue logic, financial impact |
| 2 | Referral verification flow (start → eligible → complete/voucher/offset) | Unit + Integration | Multi-step, time-based, money at stake |
| 3 | Voucher validation & atomic redemption | Unit + Integration | Double-spend prevention, financial |
| 4 | Payment webhook handler (success, failed, expired, amount mismatch, duplicate) | Integration | External dependency, money movement |
| 5 | Fraud check (`checkFraudFlags`) | Unit | Security, blocks legitimate users if wrong |
| 6 | Group booking creation & confirmation | Unit + Integration | Complex transaction, concurrency |
| 7 | Loyalty balance & redemption atomicity | Unit + Integration | Financial, negative balance prevention |
| 8 | Booking lifecycle state machine | Integration | Core product flow |

### P1 - Authentication & Security

| Priority | Test Target | Type | Rationale |
|----------|-------------|------|-----------|
| 9 | Register → email verification → login flow | E2E | Critical user journey |
| 10 | 2FA setup → verify → backup codes | E2E | Security feature |
| 11 | Password reset flow | E2E | Account recovery |
| 12 | IDOR tests for all user-scoped endpoints | Integration | Security |
| 13 | Role-based access matrix | Integration | Authorization |
| 14 | Webhook replay attack (duplicate payload) | Integration | Security |
| 15 | Payment amount tampering in webhook | Integration | Financial security |

### P2 - API Mutations & Edge Cases

| Priority | Test Target | Type |
|----------|-------------|------|
| 16 | Property CRUD (owner only) | Integration |
| 17 | Booking creation (instant vs request) | Integration |
| 18 | Review submission & reply | Integration |
| 19 | Maintenance ticket flow | Integration |
| 20 | Withdrawal request & admin approval | Integration |
| 21 | Seasonal pricing rule application | Unit |
| 22 | Inspection move-in/move-out | Integration |
| 23 | KYC webhook status transitions | Integration |

### P3 - Cron Jobs & Workers

| Priority | Test Target | Type |
|----------|-------------|------|
| 24 | `referral-eligibility-sweep` (time-based) | Integration |
| 25 | `cleanup-expired-bookings` (idempotency) | Integration |
| 26 | `complete-expired-bookings` (inspection creation) | Integration |
| 27 | `process-expired-refunds` | Integration |
| 27 | `saved-search-matcher` | Integration |
| 28 | `update-area-counts` | Integration |
| 29 | Worker graceful shutdown & retry policies | Integration |

---

## 7. Test Structure Recommendations

### 7.1 Directory Structure

```
apps/web/
├── src/
│   ├── __tests__/
│   │   ├── setup.ts                 # Global setup
│   │   ├── factories/               # Test data factories
│   │   │   ├── user.factory.ts
│   │   │   ├── property.factory.ts
│   │   │   ├── booking.factory.ts
│   │   │   ├── referral.factory.ts
│   │   │   └── index.ts
│   │   ├── fixtures/                # Static test data
│   │   │   ├── payments.json
│   │   │   └── webhooks.json
│   │   ├── helpers/                 # Test utilities
│   │   │   ├── auth.ts              # createMockSession, loginUser
│   │   │   ├── db.ts                # testDb, transaction helpers
│   │   │   ├── msw.ts               # MSW handlers
│   │   │   └── api.ts               # apiRequest helpers
│   │   └── integration/             # Integration test setup
│   │       ├── testcontainers.ts    # Postgres + Redis containers
│   │       └── global-setup.ts
│   ├── lib/
│   │   ├── referrals/
│   │   │   ├── __tests__/
│   │   │   │   ├── commission.test.ts
│   │   │   │   ├── verification.test.ts
│   │   │   │   └── voucher.test.ts
│   │   ├── payments/
│   │   │   ├── __tests__/
│   │   │   │   ├── webhook.test.ts
│   │   │   │   └── gateway-manager.test.ts
│   │   ├── loyalty/
│   │   │   └── __tests__/
│   │   └── fraud-check/
│   │       └── __tests__/
│   ├── actions/
│   │   └── __tests__/
│   │       ├── bookings.test.ts
│   │       ├── group-bookings.test.ts
│   │       └── referrals.test.ts
│   └── app/api/
│       └── **/__tests__/
│           └── *.test.ts            # Co-located with routes
├── e2e/
│   ├── fixtures/
│   │   └── test-users.ts            # Playwright test user management
│   ├── flows/
│   │   ├── auth.flow.ts
│   │   ├── booking.flow.ts
│   │   ├── referral.flow.ts
│   │   ├── group-booking.flow.ts
│   │   ├── loyalty.flow.ts
│   │   └── payment.flow.ts
│   ├── security/
│   │   ├── idor.spec.ts
│   │   ├── privilege-escalation.spec.ts
│   │   ├── webhook-replay.spec.ts
│   │   └── rate-limit-bypass.spec.ts
│   └── *.spec.ts
```

### 7.2 Test Categories & Naming

| Category | Suffix | Run Command | CI Stage |
|----------|--------|-------------|----------|
| Unit (pure logic) | `.test.ts` | `bun run test -- --run` | Fast |
| Integration (DB, external) | `.int.test.ts` | `bun run test:integration` | Medium |
| E2E (browser) | `.spec.ts` | `bun run test:e2e` | Slow |
| Security | `.security.spec.ts` | `bun run test:security` | Nightly |

---

## 8. Mocking Strategy Details

### 8.1 Database - Testcontainers (Integration Tests)

```typescript
// src/__tests__/integration/testcontainers.ts
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { RedisContainer, StartedRedisContainer } from "@testcontainers/redis";

export async function startTestContainers(): Promise<{
  pg: StartedPostgreSqlContainer;
  redis: StartedRedisContainer;
}> {
  const pg = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("test")
    .withUsername("test")
    .withPassword("test")
    .start();
  
  const redis = await new RedisContainer("redis:7-alpine").start();
  
  return { pg, redis };
}
```

### 8.2 External Services - MSW Handlers

```typescript
// src/__tests__/helpers/msw.ts
import { http, HttpResponse } from "msw";

export const paymentGatewayHandlers = [
  // Doku
  http.post("https://staging.doku.com/Suite/Receive", () => 
    HttpResponse.json({ responseCode: "0000" })
  ),
  // iPaymu
  http.post("https://sandbox.ipaymu.com/api/v2/payment", () =>
    HttpResponse.json({ Status: "success" })
  ),
  // Nicepay
  http.post("https://sandbox.nicepay.co.id/nicepay/direct/v1/payment", () =>
    HttpResponse.json({ resultCd: "0000" })
  ),
  // Resend
  http.post("https://api.resend.com/emails", () =>
    HttpResponse.json({ id: "test-email-id" })
  ),
  // Didit KYC
  http.post("https://api.didit.me/v1/verification-sessions", () =>
    HttpResponse.json({ sessionId: "test-session-id" })
  ),
];
```

### 8.3 Test Data Factories

```typescript
// src/__tests__/factories/user.factory.ts
import { faker } from "@faker-js/faker";
import type { NewUser } from "@/db/schema";

export function createUser(overrides: Partial<NewUser> = {}): NewUser {
  return {
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: "cust",
    phone: faker.phone.number(),
    referralCode: faker.string.alphanumeric(8).toUpperCase(),
    ...overrides,
  };
}

export function createOwner(overrides: Partial<NewUser> = {}): NewUser {
  return createUser({ role: "owner", ...overrides });
}

export function createAdmin(overrides: Partial<NewUser> = {}): NewUser {
  return createUser({ role: "admin", ...overrides });
}
```

### 8.4 Auth Helpers

```typescript
// src/__tests__/helpers/auth.ts
import { auth } from "@/lib/auth";

export async function createMockSession(role: "cust" | "owner" | "admin" | "staff" = "cust", userId?: string) {
  return {
    session: { id: faker.string.uuid(), expiresAt: new Date(Date.now() + 7*24*60*60*1000) },
    user: { id: userId || faker.string.uuid(), role, name: faker.person.fullName(), email: faker.internet.email() }
  };
}

export function mockAuthSession(session = createMockSession()) {
  vi.mock("@/lib/auth", () => ({
    auth: {
      api: { getSession: vi.fn().mockResolvedValue(session) }
    }
  }));
}
```

---

## 9. E2E Test Plan for Critical User Flows

### 9.1 Priority Matrix

| Flow | Priority | Complexity | Test File |
|------|----------|------------|-----------|
| **Register → Verify Email → Login** | P0 | Medium | `e2e/flows/auth.flow.ts` |
| **Login → Browse Properties → Book (Instant)** | P0 | Medium | `e2e/flows/booking.flow.ts` |
| **Login → Browse Properties → Book (Request) → Owner Approves → Pay DP → Pay Full** | P0 | High | `e2e/flows/booking-request.flow.ts` |
| **Referrer shares code → Referee signs up → Referee books → Pays full → Referral verifies → Referrer gets commission** | P0 | Very High | `e2e/flows/referral.flow.ts` |
| **Referrer converts eligible referral to voucher → Uses voucher for featured listing** | P1 | High | `e2e/flows/voucher.flow.ts` |
| **Tenant applies offset from eligible referral → Booking payment reduced** | P1 | High | `e2e/flows/referral-offset.flow.ts` |
| **User earns loyalty points → Redeems reward → Balance updates** | P1 | Medium | `e2e/flows/loyalty.flow.ts` |
| **Owner creates group booking → Invites members → Members accept → Lead confirms** | P1 | Very High | `e2e/flows/group-booking.flow.ts` |
| **Payment webhook (success) → Booking confirmed → Referral triggered → Notifications sent** | P0 | High | `e2e/flows/payment-webhook.flow.ts` |
| **Payment webhook (failed/expired) → Booking cancelled → Unit released** | P1 | Medium | `e2e/flows/payment-failure.flow.ts` |

### 9.2 Test Data Management for E2E

```typescript
// e2e/fixtures/test-users.ts
export const TEST_USERS = {
  admin: { email: "admin@test.konkosyuk.dev", password: "TestPass123!", role: "admin" },
  owner: { email: "owner@test.konkosyuk.dev", password: "TestPass123!", role: "owner" },
  tenant: { email: "tenant@test.konkosyuk.dev", password: "TestPass123!", role: "cust" },
  staff: { email: "staff@test.konkosyuk.dev", password: "TestPass123!", role: "staff" },
  // Referral-specific
  referrer: { email: "referrer@test.konkosyuk.dev", password: "TestPass123!", role: "cust" },
  referee: { email: "referee@test.konkosyuk.dev", password: "TestPass123!", role: "cust" },
};

// Use unique emails per test run to avoid conflicts
export function generateTestEmail(prefix: string): string {
  return `${prefix}+${Date.now()}+${Math.random().toString(36).slice(2,8)}@test.konkosyuk.dev`;
}
```

### 9.3 E2E Test Example: Referral Flow

```typescript
// e2e/flows/referral.flow.ts
import { test, expect } from "@playwright/test";
import { generateTestEmail } from "../fixtures/test-users";

test.describe("Referral Flow", () => {
  test("complete referral lifecycle: referrer -> referee -> booking -> verification -> commission", async ({ page }) => {
    // 1. Referrer logs in and gets referral code
    await login(page, TEST_USERS.referrer);
    const referrerCode = await getReferralCode(page);
    
    // 2. Referee signs up with referral code
    await page.goto("/sign-up");
    await page.fill('input[name="email"]', generateTestEmail("referee"));
    await page.fill('input[name="password"]', "TestPass123!");
    await page.fill('input[name="name"]', "Referee User");
    await page.fill('input[name="referralCode"]', referrerCode);
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Akun berhasil dibuat")).toBeVisible();
    
    // 3. Referee books a property and pays DP
    await bookProperty(page, { propertyId: TEST_PROPERTY_ID, type: "instant" });
    await payDP(page);
    
    // 4. Referee pays full payment
    await payFullPayment(page);
    
    // 5. Wait for webhook processing (or trigger manually)
    await waitForWebhookProcessing();
    
    // 6. Verify referral status becomes "verifying" then "eligible"
    await login(page, TEST_USERS.referrer);
    await page.goto("/dashboard/referrals");
    await expect(page.locator(`text=${referrerCode}`)).toBeVisible();
    await expect(page.locator("text=Verifying")).toBeVisible();
    
    // 7. After 5 days (or time travel), referral becomes eligible
    // In test: mock time or trigger sweep manually
    await triggerReferralSweep();
    
    // 8. Referrer converts to voucher
    await page.click(`button:has-text("Convert to Voucher")`);
    await expect(page.locator("text=Voucher created")).toBeVisible();
    
    // 9. Referrer uses voucher for featured listing
    await useVoucherForFeaturedListing(page, referrerCode);
    
    // 10. Verify commission recorded in loyalty transactions
    await verifyCommissionRecorded(page, referrerCode);
  });
});
```

---

## 10. Security Test Specifications

### 10.1 IDOR Tests (e2e/security/idor.spec.ts)

```typescript
test.describe("IDOR Protection", () => {
  const tenantA = TEST_USERS.tenant;
  const tenantB = generateTestEmail("tenant-b");
  
  test("tenant A cannot access tenant B's booking", async ({ page }) => {
    await login(page, tenantA);
    const bookingA = await createBooking(page);
    
    // Try to access tenant B's booking (simulate IDOR)
    await login(page, tenantB);
    const response = await page.request.get(`/api/bookings/${bookingA.id}`);
    expect(response.status()).toBe(404); // Not 200, not 403 (info leak)
  });
  
  test("tenant cannot access owner's property", async ({ page }) => {
    await login(page, TEST_USERS.owner);
    const property = await createProperty(page);
    
    await login(page, TEST_USERS.tenant);
    const response = await page.request.put(`/api/properties/${property.id}`, {
      data: { status: "deleted" }
    });
    expect(response.status()).toBe(403);
  });
  
  test("staff cannot access admin endpoints", async ({ page }) => {
    await login(page, TEST_USERS.staff);
    const response = await page.request.get("/api/admin/users");
    expect(response.status()).toBe(403);
  });
});
```

### 10.2 Privilege Escalation Tests

```typescript
test.describe("Privilege Escalation", () => {
  test("cust cannot call admin-only actions", async ({ page }) => {
    await login(page, TEST_USERS.tenant);
    
    const endpoints = [
      { method: "GET", url: "/api/admin/users" },
      { method: "PATCH", url: "/api/admin/payments/some-id" },
      { method: "POST", url: "/api/admin/feature-flags" },
    ];
    
    for (const ep of endpoints) {
      const response = await page.request[ep.method.toLowerCase()](ep.url);
      expect(response.status()).toBe(403);
    }
  });
  
  test("owner cannot access other owner's properties", async ({ page }) => {
    await login(page, TEST_USERS.owner);
    const property = await createProperty(page);
    
    const otherOwner = generateTestEmail("owner-2");
    await login(page, { ...TEST_USERS.owner, email: otherOwner });
    
    const response = await page.request.put(`/api/properties/${property.id}`);
    expect(response.status()).toBe(403);
  });
});
```

### 10.3 Webhook Replay & Security Tests

```typescript
test.describe("Webhook Security", () => {
  test("rejects duplicate webhook payload (replay attack)", async ({ page }) => {
    const validPayload = createValidDokuWebhookPayload();
    const signature = generateDokuSignature(validPayload);
    
    // First request - should succeed
    const response1 = await page.request.post("/api/webhooks/doku", {
      data: validPayload,
      headers: { "x-signature": signature }
    });
    expect(response1.status()).toBe(200);
    
    // Second request with same payload - should be rejected as duplicate
    const response2 = await page.request.post("/api/webhooks/doku", {
      data: validPayload,
      headers: { "x-signature": signature }
    });
    expect(response2.status()).toBe(200); // Idempotent but returns "already processed"
    const data = await response2.json();
    expect(data.success).toBe(true);
    // Verify only one payment record updated
  });
  
  test("rejects webhook with tampered amount", async ({ page }) => {
    const payload = createValidDokuWebhookPayload({ amount: "500000" });
    const signature = generateDokuSignature(payload);
    
    const response = await page.request.post("/api/webhooks/doku", {
      data: payload,
      headers: { "x-signature": signature }
    });
    expect(response.status()).toBe(400); // Amount mismatch
  });
  
  test("rejects webhook with invalid signature", async ({ page }) => {
    const payload = createValidDokuWebhookPayload();
    const response = await page.request.post("/api/webhooks/doku", {
      data: payload,
      headers: { "x-signature": "invalid-signature" }
    });
    expect(response.status()).toBe(401);
  });
});
```

### 10.4 Rate Limit Bypass Tests

```typescript
test.describe("Rate Limit Bypass", () => {
  test("IP rotation does not bypass rate limit", async ({ page }) => {
    // Make 100 requests with different X-Forwarded-For headers
    for (let i = 0; i < 100; i++) {
      const response = await page.request.get("/api/properties", {
        headers: { "X-Forwarded-For": `192.168.1.${i}` }
      });
      if (i < 60) expect(response.status()).toBe(200);
      else expect(response.status()).toBe(429);
    }
  });
  
  test("authenticated rate limit is per-user not per-IP", async ({ page }) => {
    await login(page, TEST_USERS.tenant);
    
    // User makes 100 requests - should be rate limited
    for (let i = 0; i < 100; i++) {
      const response = await page.request.get("/api/properties");
      if (i < 60) expect(response.status()).toBe(200);
      else expect(response.status()).toBe(429);
    }
  });
});
```

---

## 11. Test Data Strategy

### 11.1 Fixtures vs Factories

| Approach | Use Case |
|----------|----------|
| **Static Fixtures** (JSON) | Webhook payloads, API response snapshots, enum values |
| **Factories** (Faker) | Dynamic test entities (users, properties, bookings) |
| **Builders** | Complex objects with many optional fields (Booking, Referral) |

### 11.2 Database Seeding for Tests

```typescript
// src/__tests__/integration/seed.ts
import { db } from "@/db";
import { users, properties, units } from "@/db/schema";

export async function seedTestDatabase() {
  // Create test users
  const [admin] = await db.insert(users).values({
    email: "admin@test.local",
    name: "Test Admin",
    role: "admin",
    emailVerified: true,
  }).returning();
  
  const [owner] = await db.insert(users).values({
    email: "owner@test.local",
    name: "Test Owner",
    role: "owner",
    emailVerified: true,
  }).returning();
  
  const [tenant] = await db.insert(users).values({
    email: "tenant@test.local",
    name: "Test Tenant",
    role: "cust",
    emailVerified: true,
  }).returning();
  
  // Create property & unit
  const [property] = await db.insert(properties).values({
    ownerId: owner.id,
    name: "Test Kost",
    address: "Jl. Test No. 1",
    city: "Jakarta",
    type: "kost",
    basePrice: "1500000",
    status: "aktif",
    isActive: true,
  }).returning();
  
  const [unit] = await db.insert(units).values({
    propertyId: property.id,
    name: "Room 101",
    price: "1500000",
    capacity: "2",
    status: "available",
  }).returning();
  
  return { admin, owner, tenant, property, unit };
}
```

---

## 12. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Add `@testcontainers/postgresql` and `@testcontainers/redis` dependencies
- [ ] Create `src/__tests__/integration/testcontainers.ts`
- [ ] Create test data factories (`src/__tests__/factories/`)
- [ ] Add MSW for external service mocking
- [ ] Configure separate test environment (`.env.test`)

### Phase 2: Critical Business Logic Unit Tests (Week 2-3)
- [ ] Referral commission calculation (all tiers)
- [ ] Referral verification flow
- [ ] Voucher validation & redemption
- [ ] Fraud check logic
- [ ] Loyalty balance & redemption

### Phase 3: Integration Tests (Week 3-4)
- [ ] Payment webhook handler (all providers)
- [ ] Booking lifecycle (DP → approval → full → confirmed)
- [ ] Group booking creation & confirmation
- [ ] Referral sweep cron job
- [ ] Withdrawal flow

### Phase 4: E2E Critical Flows (Week 4-5)
- [ ] Auth flow (register, verify, login, 2FA, reset)
- [ ] Booking flow (instant + request)
- [ ] Referral end-to-end
- [ ] Group booking end-to-end
- [ ] Loyalty redemption

### Phase 5: Security Tests (Week 5-6)
- [ ] IDOR test suite
- [ ] Privilege escalation matrix
- [ ] Webhook replay/tampering
- [ ] Rate limit bypass attempts
- [ ] Input validation (XSS, SQLi)

### Phase 6: CI/CD Integration (Week 6)
- [ ] GitHub Actions workflow for unit + integration
- [ ] Separate E2E workflow (runs on PR + nightly)
- [ ] Coverage reporting with thresholds
- [ ] Test result artifacts

---

## 13. Coverage Targets (Proposed)

| Category | Lines | Functions | Branches | Statements |
|----------|-------|-----------|----------|------------|
| **Global** | 75% | 75% | 65% | 75% |
| **Payments** | 95% | 95% | 90% | 95% |
| **Referrals** | 95% | 95% | 90% | 95% |
| **Loyalty** | 90% | 90% | 85% | 90% |
| **Fraud/Security** | 90% | 90% | 85% | 90% |
| **Cron/Workers** | 85% | 85% | 80% | 85% |

---

## 14. Required Dependencies to Add

```json
// apps/web/package.json additions
{
  "devDependencies": {
    "@testcontainers/postgresql": "^10.0.0",
    "@testcontainers/redis": "^10.0.0",
    "@faker-js/faker": "^9.0.0",
    "msw": "^2.0.0",
    "vitest-environment-node": "^4.1.0"
  }
}
```

---

## 15. Summary

| Metric | Current | Target |
|--------|---------|--------|
| **Test Files** | 58 unit + 9 E2E | ~120 unit + 30 E2E + 20 security |
| **Business Logic Coverage** | ~15% | >90% |
| **API Mutation Coverage** | ~10% | >80% |
| **Security Test Coverage** | 0% | 100% of OWASP Top 10 scenarios |
| **Critical Flows E2E** | 3/10 | 10/10 |
| **Integration Tests** | 0 | 25+ |

**Key Insight:** The current test suite focuses heavily on UI components and utility functions, while **core business logic (referrals, payments, bookings, loyalty, fraud)** has **zero test coverage**. This is a critical risk for a platform handling financial transactions.

**Recommendation:** Prioritize P0 items immediately - referral commission, payment webhooks, and booking lifecycle. These represent the highest financial and reputational risk.