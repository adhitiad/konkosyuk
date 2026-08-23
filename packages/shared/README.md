# @konkosyuk/shared

Shared schemas, constants, and types for the KonkosYuk monorepo.

## Installation

This package is a workspace dependency of `@konkosyuk/web` and future mobile apps.

## Usage

```ts
import { createBookingRequestSchema, USER_ROLES, BOOKING_RULES } from "@konkosyuk/shared";
```

## Structure

- `src/api/` — Zod schemas for API contracts
- `src/constants/` — Business rules and enums
- `src/types/` — Re-exported TypeScript types

## Scripts

- `bun run build` — Bundle to `dist/`
- `bun run typecheck` — Type-check without emitting
- `bun run lint` — Lint source files
