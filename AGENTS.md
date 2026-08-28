# KonkosYuk Monorepo

Turborepo + Bun workspaces. Bun is pinned to **1.4.0** (`packageManager` + CI) — don't bump casually.

## Workspace layout

- `apps/web` — Next.js 16 web app (the main product; detailed rules in `apps/web/AGENTS.md`)
- `apps/mobile` — Flutter app (separate toolchain: `flutter`/`dart`)
- `packages/shared` — shared Zod schemas, constants, types, pure utils (rules in `docs/shared-packages-guideline.md`)

## Commands

Run from repo root via Turbo:

```bash
bun run dev      # start all apps
bun run build    # build all apps
bun run lint     # lint all apps
bun run test     # runs each package's test task
```

Per-app / focused:

```bash
cd apps/web    && bun x tsc --noEmit          # typecheck (has known errors, see apps/web/AGENTS.md)
cd apps/web    && bun run test -- --run       # one-shot unit tests (CI mode)
cd apps/web    && bun run test:coverage       # coverage-gated run
cd apps/web    && bun run test:e2e            # Playwright (auto-starts dev server)
cd apps/mobile && flutter <cmd>                # Flutter toolchain
```

## Verification & CI

- Local order: `lint` → `typecheck` → `test`.
- `bun run test` at root runs web's Vitest in **watch mode** and can hang Turbo — use `cd apps/web && bun run test -- --run` for a one-shot run.
- CI split: `ci-fast` (lint, typecheck, web unit tests on PR/push to main+develop), `ci-slow` (coverage, `next build`, Playwright E2E on main+develop), `security` (bun audit, TruffleHog, Semgrep — weekly).

## Environment & secrets

- Copy `apps/web/.env.example` → `apps/web/.env.local`. Use `.env.local`, NOT `.env`.
- **Redis = `REDIS_URL` in ioredis format** (Upstash `rediss://...` URL). Do NOT use `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` — the "Redis" line in `apps/web/AGENTS.md` is outdated; the code (`src/lib/redis.ts`) uses ioredis + `REDIS_URL` only.
- `BETTER_AUTH_SECRET` must be ≥32 chars (`openssl rand -base64 32`).
- `PAYMENT_MODE`: `mock` for dev; **production builds require `PAYMENT_MODE=live`** (`src/lib/payments/mock.ts` throws in production otherwise).
- Notification settings are stored directly in the web app database (`notification_settings` table). Configure via `apps/web/.env.local`:
  - `RESEND_API_KEY` — for email notifications
  - `RESEND_FROM_EMAIL` — sender address
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — for web push notifications
  - `NOTIFICATION_ENCRYPTION_KEY` — base64-encoded 32-byte key for credential encryption

## Database

- Schema: `apps/web/src/db/schema.ts`.
- Local dev: `cd apps/web && bun run db:push` (no migration files).
- Migrations: `db:generate` then `db:migrate`.
- Seeds: use the `bun run db:seed-*` npm scripts (they load `.env.local`); don't invoke the tsx/seed files directly or env may not load.

## Notification Architecture

- All notification logic (email, WhatsApp, Telegram, Web Push) lives in `apps/web` via `src/lib/notification-client.ts`.
- Notifications are dispatched directly from the web app using:
  - **In-app**: stored in `notifications` table
  - **Email**: sent via Resend (`resend` package)
  - **Push**: sent via `web-push` with VAPID keys
  - **WhatsApp/Telegram**: currently logged as warning; direct API integration can be added later
- Web app no longer depends on external gRPC notification services.
- Old files deleted: `packages/shared/src/lib/notification-grpc-client.ts`, `apps/notifications/`, `apps/cronJob/`, `apps/grpc/`.

## Web app gotchas (full detail in `apps/web/AGENTS.md`)

- Next.js 16 has breaking changes vs older Next — read `node_modules/next/dist/docs/` before editing web code.
- Vercel: project Root Directory = `apps/web`. **Do NOT set `outputDirectory`** in `apps/web/vercel.json` (causes ENOENT on Vercel with Next 16).
- API handlers wrap responses via `ok()` → `{ success, data }`; list endpoints add `meta` manually.
- Auth: `requireSession([...])` server-side; roles `cust | owner | admin | staff`.
- Money: most columns are `numeric(...)`; payment `amount` is stored as `text` and cast to `NUMERIC` in queries.

## Shared package rules (`packages/shared`)

- DO: Zod API schemas, business-rule constants, domain types, pure utils.
- DON'T: React/Next code, Drizzle schemas, payment/email/cloud SDK adapters, UI components.
- `packages/shared` must never import from any app (no circular deps).

## Conventions (full rules in `.kilo/rules/`)

- **Bun only**: `bun add` / `bun run` / `bunx`. Never `npm`/`yarn`/`pnpm`.
- All code comments, variable/function names, file names, and `CHANGELOG.md` entries are **in Indonesian**; update the CHANGELOG on every change.
- Server Components by default; Server Actions for mutations; put auth/logging/headers in `apps/web/src/proxy.ts` (middleware), not route handlers.
- No `console.*` in production — use the logger (`logError`, not `console.error`).
- Prefer `z.unknown()` over `z.any()`; extract magic numbers to named constants.

## Testing

- Unit: Vitest + jsdom (`apps/web`). Coverage gates: 65% global, 90% for `currency`, `payments/calculations`, `payments/signature`, `sanitize`, `packages/calculator`.
- E2E: Playwright (`apps/web`), auto-starts dev server at `http://localhost:3000`.