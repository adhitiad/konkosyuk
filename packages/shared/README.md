# @konkosyuk/shared

Shared schemas, constants, types, and pure utilities for the KonkosYuk monorepo.

## Quick Start

```bash
# Install dependencies
bun install

# Build
bun run build

# Type-check
bun run typecheck

# Lint
bun run lint

# Test
bun run test
```

## Usage in Apps

```ts
import {
  createBookingSchema,
  BOOKING_STATUSES,
  BookingStatus,
  calculatePackageFinalPrice,
  type CreateBookingInput,
} from "@konkosyuk/shared";
```

## Structure

```
src/
├── api/              # Zod schemas for API contracts
│   ├── bookings.ts
│   ├── properties.ts
│   ├── payments.ts
│   ├── referrals-loyalty.ts
│   └── auth.ts
├── constants/        # Business rules and enums
│   ├── enums.ts
│   ├── business-rules.ts
│   └── roles.ts
├── types/            # TypeScript interfaces
│   └── property-packages.ts
└── utils/            # Pure utility functions
    └── (add new utilities here)
```

## What Goes Here

See [docs/shared-packages-guideline.md](../docs/shared-packages-guideline.md) for the complete architecture guide.

### ✅ DO put in `packages/shared`:
- API request/response schemas (Zod)
- Business rules and constants (fees, statuses, roles)
- Shared TypeScript types and interfaces
- Pure utility functions (calculations, formatters)

### ❌ DON'T put in `packages/shared`:
- React components or hooks
- Next.js-specific code (cookies, server components)
- Database schemas (Drizzle ORM)
- Third-party SDK wrappers (Cloudinary, payment gateways)

## Adding New Shared Code

1. Create the file in the appropriate `src/` subdirectory
2. Add JSDoc comments explaining the purpose
3. Export from `src/index.ts` if it's a public API
4. Add unit tests in `__tests__/`
5. Update consuming apps to import from `@konkosyuk/shared`
