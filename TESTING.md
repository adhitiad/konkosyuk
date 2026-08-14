# Testing Documentation - KonkosYuk

## Overview

Dokumentasi ini menjelaskan setup testing yang telah diimplementasikan untuk platform KonkosYuk.

## Tech Stack

- **Unit/Integration Test**: Vitest + React Testing Library
- **E2E Test**: Playwright
- **Coverage**: @vitest/coverage-v8
- **CI/CD**: GitHub Actions

## Project Structure

```
src/
├── __tests__/
│   └── setup.ts                    # Test setup (cleanup, jest-dom)
├── lib/
│   ├── __tests__/
│   │   └── zod-validation.test.ts  # Zod schema validation tests
│   ├── utils/__tests__/
│   │   ├── currency.test.ts        # Currency formatting tests
│   │   └── geolocation.test.ts     # Distance calculation tests
│   ├── payments/__tests__/
│   │   ├── calculations.test.ts    # DP/remaining payment calculations
│   │   └── signature.test.ts       # HMAC-SHA256 signature verification
│   ├── sanitize.ts                 # XSS sanitization (tested)
│   └── packages/__tests__/
│       └── calculator.test.ts      # Package price & date calculations
e2e/
├── auth.spec.ts                    # Login/signup E2E tests
├── property-search.spec.ts         # Property search/filter E2E tests
├── booking-flow.spec.ts            # Booking & payment E2E tests
└── owner-management.spec.ts        # Owner CRUD property E2E tests
```

## Test Coverage

| Module                         | Statements | Branches  | Functions | Lines      |
| ------------------------------ | ---------- | --------- | --------- | ---------- |
| `lib/payments/calculator.ts`   | 96.96%     | 95.65%    | 100%      | 96.77%     |
| `lib/payments/signature.ts`    | 95%        | 88.88%    | 100%      | 93.75%     |
| `lib/sanitize.ts`              | 100%       | 92.85%    | 100%      | 100%       |
| `lib/utils/currency.ts`        | 100%       | 100%      | 100%      | 100%       |
| `lib/payments/calculations.ts` | 100%       | 100%      | 100%      | 100%       |
| **Overall**                    | **77.61%** | **58.9%** | **75%**   | **76.19%** |

## Commands

### Run Tests

```bash
# Run all unit tests (watch mode)
bun run test

# Run unit tests once (CI mode)
bun run test -- --run

# Run with coverage report
bun run test:coverage

# Run E2E tests
bun run test:e2e

# Run E2E tests with UI
bun run test:e2e:ui
```

### View Coverage Report

```bash
bun run test:coverage
# Open coverage/index.html in browser
```

## CI/CD Pipeline

Pull request ke `main` atau `develop` akan menjalankan:

1. **Lint**: `bun run lint`
2. **TypeScript Check**: `bun x tsc --noEmit`
3. **Unit Tests + Coverage**: `bun run test -- --run --coverage`
4. **E2E Tests**: `bunx playwright test --project=chromium`

## Critical Business Logic Covered

### 1. Payment Calculation (`lib/payments/`)

- **DP 35% / Pelunasan 65%**: `calculateDp()` divalidasi untuk edge cases (zero, decimal, small amounts)
- **Package Final Price**: `calculatePackageFinalPrice()` mencakup diskon, PPN 11%, dan app fee 0.63%
- **Custom Duration Pricing**: `calculateCustomPrice()` untuk durasi custom
- **End Date Calculation**: `calculatePackageEndDate()` untuk hours/days/months/years

### 2. Payment Gateway Security (`lib/payments/signature.ts`)

- **HMAC-SHA256**: `hmacSha256Hex()` untuk webhook signature
- **SHA256**: `sha256Hex()` untuk hash generation
- **Signature Verification**: `verifyHmacHex()` dengan timing-safe comparison
- **Legacy MD5**: `generateMd5Signature()` untuk backward compatibility

### 3. Input Validation (`lib/zod.ts`)

- **Property Schema**: `createPropertySchema` - tipe, harga, paket
- **Booking Schema**: `createBookingSchema` - propertyId, unitId, packageId, tipe booking
- **Bank Account**: `addBankAccountSchema` - nomor rekening, bank, e-wallet
- **Withdrawal**: `createWithdrawalSchema` - jumlah minimal > 0
- **User Profile**: `updateUserProfileSchema` - phone, email, whatsapp, telegram
- **Query Params**: `propertyQuerySchema`, `unitQuerySchema`, `bookingQuerySchema`

### 4. XSS Prevention (`lib/sanitize.ts`)

- **HTML Escaping**: `sanitizeString()` untuk `<`, `>`, `&`, `"`, `'`, `/`
- **Object Sanitization**: `sanitizeObject()` rekursif untuk nested objects
- **Array Sanitization**: sanitize elemen array yang berupa string
- **Metadata Sanitization**: `sanitizeMetadata()` untuk data JSON

### 5. Geolocation (`lib/geolocation.ts`)

- **Distance Calculation**: `calculateDistance()` menggunakan Haversine formula
- **Coordinate Jittering**: `jitterCoordinates()` untuk privacy lokasi

### 6. Package Management (`lib/packages/calculator.ts`)

- **Package Lookup**: `getPackageById()` untuk predefined & custom packages
- **Package Validation**: `validateBookingPackage()` untuk availability & duration
- **Price Calculation**: `calculatePackageFinalPrice()` dengan diskon, PPN, app fee

## E2E Test Scenarios

### Authentication (`e2e/auth.spec.ts`)

- Display login page
- Invalid email format validation
- Short password validation (min 8 chars)

### Property Search (`e2e/property-search.spec.ts`)

- Display search page
- Filter by property type (kost/kontrakan)
- Search by city

### Booking Flow (`e2e/booking-flow.spec.ts`)

- Display booking form
- DP amount calculation display
- Past date validation

### Owner Management (`e2e/owner-management.spec.ts`)

- Display owner dashboard
- Open create property form
- Required field validation

## Writing New Tests

### Unit Test Example

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "@/lib/my-module";

describe("myFunction", () => {
  it("should do something correctly", () => {
    const result = myFunction("input");
    expect(result).toBe("expected");
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from "@playwright/test";

test("should do something", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Hello");
});
```

## Notes

- API route integration tests yang membutuhkan database diabaikan untuk menghindari mock kompleks. Gunakan test database terpisah jika diperlukan.
- E2E tests membutuhkan server berjalan (`bun run dev`) atau menggunakan `webServer` config di Playwright.
- Coverage threshold diatur secara progresif. Tingkatkan seiring penambahan test.
