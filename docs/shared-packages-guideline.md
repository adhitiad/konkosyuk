# Shared Packages Guideline

## 1. Purpose & Philosophy

### Why We Have `packages/shared`

The `packages/shared` package exists to enforce the **Single Source of Truth** principle across our multi-platform application ecosystem. As we expand from a single Next.js web app to include mobile applications (Flutter, and potentially native Kotlin/Swift), we must avoid duplicating business logic, API contracts, and domain rules across codebases.

### The Single Source of Truth Principle

Every piece of domain logic, business rule, or API contract should exist in exactly one place. When multiple apps need the same logic, they import it from `packages/shared` rather than maintaining their own copies.

### Benefits for Multi-Platform Development

- **Consistency**: Web and mobile apps validate the same business rules (e.g., booking status transitions, DP percentages)
- **Reduced Bugs**: Fixing a business rule once fixes it everywhere
- **Faster Development**: New platforms can be built by reusing existing contracts instead of reverse-engineering them
- **Type Safety**: TypeScript types defined once are guaranteed consistent across all consumers

---

## 2. What BELONGS in `packages/shared`

### ✅ API Contracts (Zod Schemas)

All request and response schemas for API endpoints belong in `packages/shared`. These schemas define the contract between client and server and must be identical for all consumers.

**Location**: `packages/shared/src/api/`

**Examples from our codebase**:

```typescript
// packages/shared/src/api/bookings.ts
export const createBookingSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid(),
  packageId: z.string().min(1),
  customDuration: z.coerce.number().int().positive().optional(),
  bookingType: z.enum(BOOKING_TYPES),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  paymentType: z.enum(PAYMENT_PURPOSES).default("dp"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
```

```typescript
// packages/shared/src/api/properties.ts
export const createPropertySchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  address: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  type: z.enum(PROPERTY_TYPES),
  basePrice: z.string().optional(),
  packages: propertyPackagesSchema.optional(),
  status: z.enum(PROPERTY_STATUSES).optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  gpsVerified: z.boolean().optional(),
  featuredUntil: z.string().optional(),
  icalExportToken: z.string().optional(),
  icalImportUrl: z.string().optional(),
});
```

**Rules**:
- Schema validation messages should be in Indonesian (or English for API-level errors)
- Do NOT include UI-specific validation (e.g., "Password must contain at least one emoji")
- Do NOT include React Hook Form-specific configurations
- Use `.optional()` and `.default()` to match API behavior exactly

### ✅ Business Rules & Constants

Domain-specific constants that govern application behavior belong in `packages/shared`. These are the rules that make KonkosYuk unique.

**Location**: `packages/shared/src/constants/`

**Examples from our codebase**:

```typescript
// packages/shared/src/constants/enums.ts
export const USER_ROLES = ["cust", "owner", "admin", "staff"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PROPERTY_TYPES = ["kost", "kontrakan", "apartemen", "rumah", "ruko"] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const BOOKING_STATUSES = [
  "pending_dp",
  "awaiting_owner_approval",
  "awaiting_full_payment",
  "confirmed",
  "completed",
  "rejected",
  "cancelled",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
```

```typescript
// packages/shared/src/constants/business-rules.ts
export const DEFAULT_PLATFORM_FEE_PERCENT = 1.8;
export const MIN_PLATFORM_FEE_PERCENT = 0;
export const MAX_PLATFORM_FEE_PERCENT = 10;

export const DEFAULT_FEATURED_PRICE = 50000;
export const DEFAULT_FEATURED_DURATION_DAYS = 7;
export const DEFAULT_FEATURED_MAX_PER_DAY = 10;

export const BOOKING_RULES = {
  platformFeePercent: DEFAULT_PLATFORM_FEE_PERCENT,
  minPlatformFeePercent: MIN_PLATFORM_FEE_PERCENT,
  maxPlatformFeePercent: MAX_PLATFORM_FEE_PERCENT,
  featuredListingPrice: DEFAULT_FEATURED_PRICE,
  featuredDurationDays: DEFAULT_FEATURED_DURATION_DAYS,
  featuredMaxPerDay: DEFAULT_FEATURED_MAX_PER_DAY,
  currency: CURRENCY,
} as const;
```

**Rules**:
- Constants should be named in UPPER_SNAKE_CASE
- Group related constants into objects (e.g., `BOOKING_RULES`)
- Export both the constant array and the derived type (e.g., `BOOKING_STATUSES` and `BookingStatus`)
- Do NOT include UI-specific constants (e.g., badge variants, color codes)

### ✅ Shared Type Definitions

TypeScript interfaces and types that represent domain concepts belong in `packages/shared`. These types are used across API boundaries.

**Location**: `packages/shared/src/types/`

**Examples from our codebase**:

```typescript
// packages/shared/src/types/property-packages.ts
export type DurationUnit = "hours" | "days" | "months" | "years";

export interface PackageItem {
  id: string;
  label: string;
  unit: DurationUnit;
  value: number;
  basePrice: number;
  discountPercent: number;
  ppnPercent: number;
  appFeePercent: number;
  finalPrice: number;
  isAvailable: boolean;
}

export interface PropertyPackages {
  predefined: PackageItem[];
  custom: {
    enabled: boolean;
    label: string;
    unit: DurationUnit;
    pricePerUnit: number;
    minDuration: number;
    maxDuration: number;
  };
}
```

**Rules**:
- Use `interface` for object shapes, `type` for unions and complex types
- Keep types focused on domain data, not on how they're displayed
- Do NOT include React-specific types (e.g., `React.ComponentProps`, `React.FC`)

### ✅ Pure Utility Functions

Platform-agnostic utility functions that perform calculations or transformations belong in `packages/shared`. These functions must have no side effects and no dependencies on UI frameworks.

**Location**: `packages/shared/src/utils/` (create as needed)

**Examples from our codebase**:

```typescript
// packages/shared/src/utils/date.ts (hypothetical - move from apps/web)
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function calculatePackageFinalPrice(
  basePrice: number,
  discountPercent: number,
  ppnPercent: number,
  appFeePercent: number,
): number {
  const discounted = basePrice - (basePrice * discountPercent) / 100;
  const final =
    discounted +
    (discounted * ppnPercent) / 100 +
    (discounted * appFeePercent) / 100;
  return Math.round(final);
}

export function calculateDp(totalPrice: number): {
  dpAmount: number;
  remainingAmount: number;
} {
  const dpRatio = 0.35;
  const dpAmount = totalPrice * dpRatio;
  const remainingAmount = totalPrice - dpAmount;
  return { dpAmount, remainingAmount };
}
```

**Rules**:
- Functions must be pure (same input → same output, no side effects)
- Do NOT use `window`, `document`, `localStorage`, or any browser API
- Do NOT use React hooks or Next.js APIs
- Do NOT import from UI libraries (e.g., `clsx`, `tailwind-merge`)
- Write unit tests for all utility functions

---

## 3. What DOES NOT Belong in `packages/shared`

### ❌ UI-Specific Code

React components, UI-specific validation schemas, and styling constants belong in the individual app.

**Examples from our codebase**:

```typescript
// ❌ KEEP IN apps/web/src/lib/validations/reviews.ts
// This schema has UI-specific validation messages
export const createReviewSchema = z.object({
  type: z.enum(["tenant", "property"]),
  rating: z.coerce.number().min(1).max(5),
  comment: z
    .string()
    .min(10, "Review must be at least 10 characters") // UI message
    .max(1000),
  bookingId: z.string().uuid(),
  reviewedUserId: z.string().uuid().optional(),
  propertyId: z.string().uuid(),
});
```

```typescript
// ❌ KEEP IN apps/web/src/lib/constants/user.ts
// This returns UI-specific Shadcn badge variants
export function getRoleBadgeVariant(
  role: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (role) {
    case "admin":
      return "destructive";
    case "staff":
      return "secondary";
    case "owner":
      return "default";
    default:
      return "outline";
  }
}
```

**Why**: Mobile apps use different UI frameworks (Flutter widgets, native components) and different styling systems. A "badge variant" that maps to Shadcn UI classes has no meaning in Flutter.

### ❌ Platform-Specific Logic

Code that depends on browser APIs, React hooks, or Next.js features belongs in the individual app.

**Examples from our codebase**:

```typescript
// ❌ KEEP IN apps/web/src/lib/auth.ts
// Uses Next.js cookies() and Drizzle ORM
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@/db";
import { headers } from "next/headers";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { /* ... */ },
});
```

```typescript
// ❌ KEEP IN apps/web/src/lib/auth-client.ts
// Uses window and React-specific auth client
export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL,
});
```

**Why**: Mobile apps will use different authentication mechanisms (Flutter secure storage, native biometrics). The Next.js-specific auth implementation is an app concern, not a domain concern.

### ❌ Database-Specific Code

Drizzle ORM schema definitions, SQL queries, and database connection logic belong in the individual app.

**Example from our codebase**:

```typescript
// ❌ KEEP IN apps/web/src/db/schema.ts
// Database schema is specific to the web app's PostgreSQL setup
export const properties = pgTable(
  "properties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id").references(() => users.id),
    type: text("type", { enum: propertyType }).notNull(),
    // ...
  }
);
```

**Why**: Mobile apps might use SQLite, Realm, or a different PostgreSQL schema. The database schema is an implementation detail of the web app, not a domain contract. The shared package only needs to know that a `PropertyType` exists as a string union.

### ❌ Third-Party Integrations

Payment gateway adapters, email service wrappers, and cloud storage clients belong in the individual app.

**Examples from our codebase**:

```typescript
// ❌ KEEP IN apps/web/src/lib/cloudinary.ts
// Cloudinary is a specific cloud provider
import { v2 as cloudinary } from "cloudinary";

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folderName: string,
): Promise<{ secure_url: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder: folderName }, (error, result) => {
      // ...
    });
  });
}
```

```typescript
// ❌ KEEP IN apps/web/src/lib/payments/ipaymu.ts
// iPaymu is a specific payment provider
import axios from "axios";
import { generateSha256Signature, verifySignature } from "./signature";

async function buildIpaymuStringToSign(
  userAgent: string,
  va: string,
  requestBody: string,
  apiKey: string,
): string {
  return `${userAgent}${va}${requestBody}${apiKey}`;
}
```

**Why**: Mobile apps might use different payment providers (Midtrans for Flutter, Apple Pay for iOS, Google Pay for Android). The integration logic is platform-specific, even though the payment flow is shared.

---

## 4. Decision Tree

Use this decision tree when you're unsure where to place code:

```
Is this code used by multiple apps (web + mobile)?
│
├─ NO → Keep in the specific app
│
└─ YES → Does it depend on UI frameworks (React, Next.js, Flutter)?
    │
    ├─ YES → Keep in the specific app
    │
    └─ NO → Is it pure logic/data (no side effects, no platform APIs)?
        │
        ├─ YES → Move to packages/shared
        │
        └─ NO → Does it depend on a specific platform capability?
            │
            ├─ YES → Keep in the specific app or create a platform abstraction layer
            │
            └─ NO → Create a new package in packages/ for this cross-cutting concern
```

### Quick Decision Matrix

| Question | If YES | If NO |
|----------|--------|-------|
| Used by only one app? | Keep in app | Continue |
| Depends on React/Next.js/Flutter? | Keep in app | Continue |
| Pure logic/data (no side effects)? | Move to `packages/shared` | Keep in app |
| Depends on platform APIs (window, device, etc.)? | Keep in app | Continue |
| Depends on third-party SDK? | Keep in app | Move to `packages/shared` |

---

## 5. Migration Checklist

When moving existing code from `apps/web` to `packages/shared`, follow this checklist:

### Pre-Migration

- [ ] **Identify the category**: Is it an API contract, business rule, type, or utility?
- [ ] **Check for dependencies**: Search for imports from `react`, `next`, `@/db`, `@/lib/auth`, etc.
- [ ] **Check for side effects**: Does the code use `console.log`, `fetch`, `localStorage`, file system access?
- [ ] **Check for platform APIs**: Does the code reference `window`, `document`, `process.env.NEXT_PUBLIC_*`?

### Migration

- [ ] **Create the file in `packages/shared/src/`** following the existing folder structure
- [ ] **Add JSDoc comments** explaining the purpose and usage
- [ ] **Remove platform-specific imports** (replace with generic alternatives if needed)
- [ ] **Export from `packages/shared/src/index.ts`** if it's a public API
- [ ] **Add unit tests** in `packages/shared/__tests__/`

### Post-Migration

- [ ] **Update all imports** in `apps/web` to use `@konkosyuk/shared`
- [ ] **Run `bun run lint`** in `packages/shared`
- [ ] **Run `bun x tsc --noEmit`** in `packages/shared`
- [ ] **Run `bun run test`** in `packages/shared`
- [ ] **Run `bun run lint`** in `apps/web`
- [ ] **Run `bun x tsc --noEmit`** in `apps/web`
- [ ] **Run `bun run test`** in `apps/web`
- [ ] **Verify the app still works** (manual smoke test or E2E)

### Documentation

- [ ] **Update `packages/shared/README.md`** with the new export
- [ ] **Add an example** showing how the shared code is consumed

---

## 6. Code Examples

### Good Example: Move to `packages/shared`

```typescript
// packages/shared/src/constants/business-rules.ts
/**
 * Platform business rules and constants.
 *
 * These values govern how the platform operates and must be
 * consistent across web and mobile apps.
 */
export const DEFAULT_PLATFORM_FEE_PERCENT = 1.8;
export const MIN_PLATFORM_FEE_PERCENT = 0;
export const MAX_PLATFORM_FEE_PERCENT = 10;

export const DEFAULT_FEATURED_PRICE = 50000;
export const DEFAULT_FEATURED_DURATION_DAYS = 7;
export const DEFAULT_FEATURED_MAX_PER_DAY = 10;

export const CURRENCY = "IDR" as const;

export const BOOKING_RULES = {
  platformFeePercent: DEFAULT_PLATFORM_FEE_PERCENT,
  minPlatformFeePercent: MIN_PLATFORM_FEE_PERCENT,
  maxPlatformFeePercent: MAX_PLATFORM_FEE_PERCENT,
  featuredListingPrice: DEFAULT_FEATURED_PRICE,
  featuredDurationDays: DEFAULT_FEATURED_DURATION_DAYS,
  featuredMaxPerDay: DEFAULT_FEATURED_MAX_PER_DAY,
  currency: CURRENCY,
} as const;

export type BookingRules = typeof BOOKING_RULES;
```

```typescript
// packages/shared/src/utils/price.ts
/**
 * Calculates the final package price including discounts, PPN, and app fees.
 *
 * @param basePrice - The base price of the package
 * @param discountPercent - Discount percentage (0-100)
 * @param ppnPercent - PPN tax percentage (0-100)
 * @param appFeePercent - Platform fee percentage (0-100)
 * @returns The final price rounded to the nearest integer
 */
export function calculatePackageFinalPrice(
  basePrice: number,
  discountPercent: number,
  ppnPercent: number,
  appFeePercent: number,
): number {
  const discounted = basePrice - (basePrice * discountPercent) / 100;
  const final =
    discounted +
    (discounted * ppnPercent) / 100 +
    (discounted * appFeePercent) / 100;
  return Math.round(final);
}
```

### Bad Example: Keep in `apps/web`

```typescript
// ❌ apps/web/src/lib/auth.ts - KEEP HERE
// Uses Next.js-specific APIs and Drizzle ORM
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@/db";
import { headers } from "next/headers";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { /* ... */ },
});
```

```typescript
// ❌ apps/web/src/lib/validations/reviews.ts - KEEP HERE
// Contains UI-specific validation messages
export const createReviewSchema = z.object({
  comment: z
    .string()
    .min(10, "Review must be at least 10 characters") // UI message
    .max(1000),
});
```

```typescript
// ❌ apps/web/src/lib/constants/user.ts - KEEP HERE
// Returns UI-specific Shadcn badge variants
export function getRoleBadgeVariant(
  role: string,
): "default" | "secondary" | "destructive" | "outline" {
  // Maps to Tailwind classes via Shadcn UI
  switch (role) {
    case "admin": return "destructive";
    case "staff": return "secondary";
    // ...
  }
}
```

---

## 7. Naming Conventions

### Package Naming

- Package name: `@konkosyuk/shared`
- Future packages: `@konkosyuk/ui`, `@konkosyuk/utils`, etc.

### File Naming

- Use kebab-case for files: `business-rules.ts`, `property-packages.ts`
- Use PascalCase for types/interfaces: `PropertyPackages.ts`
- Use index.ts as barrel exports for directories

### Export Naming

| Type | Convention | Example |
|------|------------|---------|
| Constants | UPPER_SNAKE_CASE | `DEFAULT_PLATFORM_FEE_PERCENT` |
| Enums | UPPER_SNAKE_CASE | `BOOKING_STATUSES` |
| Derived Types | PascalCase | `BookingStatus` |
| Functions | camelCase | `calculatePackageFinalPrice` |
| Interfaces | PascalCase | `PropertyPackages` |
| Types | PascalCase | `CreatePropertyInput` |

---

## 8. Versioning Strategy

### Semantic Versioning

`packages/shared` follows semantic versioning (SemVer):

- **MAJOR**: Breaking changes to API contracts (e.g., removing a field from a schema, changing a function signature)
- **MINOR**: New features, new schemas, new utilities (backward compatible)
- **PATCH**: Bug fixes, documentation updates

### Handling Breaking Changes

When you need to make a breaking change:

1. **Update the shared package first**
2. **Bump the version** in `packages/shared/package.json`
3. **Update all consuming apps** in the same PR/commit
4. **Update the CHANGELOG** in `packages/shared`
5. **Notify the team** in the PR description

### Communication

- Breaking changes must be documented in the PR description
- Use the `BREAKING CHANGE:` footer in commit messages
- Update `docs/shared-packages-guideline.md` if the change affects architecture decisions

---

## 9. Testing Requirements

### Minimum Coverage

- **Target**: 90% coverage for `packages/shared`
- **Minimum**: 80% coverage for all files in `packages/shared`

### Test Types

#### Unit Tests (Required)

Test all pure utility functions and business rule calculations:

```typescript
// packages/shared/__tests__/business-rules.test.ts
import { describe, it, expect } from "vitest";
import { calculatePackageFinalPrice } from "../src/utils/price";

describe("calculatePackageFinalPrice", () => {
  it("calculates final price with discount, PPN, and app fee", () => {
    expect(calculatePackageFinalPrice(1000000, 10, 11, 1.8)).toBe(1090890);
  });

  it("handles zero discount", () => {
    expect(calculatePackageFinalPrice(1000000, 0, 11, 1.8)).toBe(1218000);
  });

  it("handles 100% discount", () => {
    expect(calculatePackageFinalPrice(1000000, 100, 11, 1.8)).toBe(0);
  });
});
```

#### Schema Validation Tests (Required)

Test that schemas validate correctly:

```typescript
// packages/shared/__tests__/api/bookings.test.ts
import { describe, it, expect } from "vitest";
import { createBookingSchema } from "../src/api/bookings";

describe("createBookingSchema", () => {
  it("accepts valid booking data", () => {
    const result = createBookingSchema.safeParse({
      propertyId: "123e4567-e89b-12d3-a456-426614174000",
      unitId: "123e4567-e89b-12d3-a456-426614174001",
      packageId: "pkg-1",
      bookingType: "instant",
      startDate: "2024-01-01T00:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID", () => {
    const result = createBookingSchema.safeParse({
      propertyId: "not-a-uuid",
      unitId: "123e4567-e89b-12d3-a456-426614174001",
      packageId: "pkg-1",
      bookingType: "instant",
      startDate: "2024-01-01T00:00:00Z",
    });
    expect(result.success).toBe(false);
  });
});
```

#### Integration Tests (Optional)

Test that shared code works correctly when consumed by apps:

```typescript
// apps/web/__tests__/integration/shared.test.ts
import { describe, it, expect } from "vitest";
import { createPropertySchema } from "@konkosyuk/shared";

describe("Shared schema integration", () => {
  it("validates property creation in web app", () => {
    const result = createPropertySchema.safeParse({
      title: "Test Kost",
      type: "kost",
      basePrice: "2500000",
    });
    expect(result.success).toBe(true);
  });
});
```

### Running Tests

```bash
# Run all shared package tests
cd packages/shared && bun run test

# Run tests with coverage
cd packages/shared && bun run test -- --coverage

# Run tests in watch mode during development
cd packages/shared && bun run test
```

---

## 10. Common Pitfalls

### Circular Dependencies

**Problem**: `packages/shared` imports from `apps/web`, or `apps/web` imports from `packages/shared` which indirectly imports from `apps/web`.

**Solution**: `packages/shared` must never import from any app. If you need shared code in a utility that also needs app-specific code, split the utility:
- Pure logic → `packages/shared`
- App-specific glue → `apps/web`

### Accidentally Importing Platform-Specific Code

**Problem**: Importing `window`, `document`, React hooks, or Next.js APIs into shared code.

**Solution**: Use the lint rule `no-restricted-imports` in `packages/shared` to block imports from `react`, `next`, and app paths.

### Over-Engineering

**Problem**: Trying to make everything platform-agnostic before you have multiple platforms.

**Solution**: Only move code to `packages/shared` when you actually need it in multiple places. If it's only used in `apps/web` today, keep it there. Revisit when `apps/mobile` needs it.

### Under-Documenting

**Problem**: Moving code to shared without explaining why it exists or how to use it.

**Solution**: Every export from `packages/shared` should have a JSDoc comment. Every schema should have an example in the README.

### Duplicating Constants

**Problem**: Defining the same constant in both `packages/shared` and `apps/web`.

**Solution**: Always import from `packages/shared`. If you need a constant that doesn't exist in shared, add it there first.

---

## Appendix: Current `packages/shared` Structure

```
packages/shared/
├── package.json          # @konkosyuk/shared
├── tsconfig.json         # Extends root tsconfig
├── src/
│   ├── index.ts          # Barrel export
│   ├── api/              # Zod schemas for API contracts
│   │   ├── bookings.ts
│   │   ├── properties.ts
│   │   ├── payments.ts
│   │   ├── referrals-loyalty.ts
│   │   └── auth.ts
│   ├── constants/        # Enums and business rules
│   │   ├── enums.ts
│   │   ├── business-rules.ts
│   │   └── roles.ts
│   └── types/            # TypeScript interfaces
│       └── property-packages.ts
```

## Appendix: Good Candidates for Future Migration

These files in `apps/web` are good candidates for migration to `packages/shared`:

| File | Category | Reason |
|------|----------|--------|
| `src/lib/payments/calculations.ts` | Utility | Pure price calculations |
| `src/lib/packages/calculator.ts` | Utility | Pure package price calculations (minus seasonal pricing import) |
| `src/lib/constants/monetization.ts` | Constants | Business rules for payments (merge with existing `business-rules.ts`) |
| `src/lib/constants/indonesian-payments.ts` | Constants | Payment provider constants |
| `src/lib/utils/currency.ts` | Utility | Currency formatting logic |
| `src/lib/validations/reviews.ts` | API Contract | Review schemas (remove UI messages first) |
| `src/lib/room-facilities-preset.ts` | Constants | Room facility presets |
| `src/lib/types/property-packages.ts` | Types | Already in shared, remove duplicate from `apps/web/src/lib/types/` |
