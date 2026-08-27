# KonkosYuk Monorepo

Turborepo + Bun workspaces. Bun is pinned to **1.4.0** (`packageManager` + CI) — don't bump casually.

## Workspace layout

- `apps/web` — Next.js 16 web app (the main product; detailed rules in `apps/web/AGENTS.md`)
- `apps/grpc` — standalone gRPC server (Bun) that powers the mobile app; consumes `proto/`
- `apps/cronJob` — standalone BullMQ worker (Bun), deployed as a Render Background Worker
- `apps/notifications` — standalone Go notification service (gRPC), deployed as a Render Background Worker; all notification logic lives here (email, WhatsApp, Telegram, Web Push)
- `apps/mobile` — Flutter app (separate toolchain: `flutter`/`dart`); talks to `apps/grpc` over gRPC
- `packages/shared` — shared Zod schemas, constants, types, pure utils (rules in `docs/shared-packages-guideline.md`)
- `proto/konkosyuk/v1/*.proto` — buf/protoc source; generated stubs land in `apps/grpc/src/gen/**` (do not edit generated files)

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
cd apps/grpc   && bun run dev                  # gRPC server with --watch
cd apps/cronJob && bun run dev                 # worker with --watch (bun run start = prod)
cd apps/notifications && go build ./cmd/server # build Go notification service
cd apps/mobile && flutter <cmd>                # Flutter toolchain
bun run proto:gen                              # regenerate gRPC stubs (run from repo root)
```

## Verification & CI

- Local order: `lint` → `typecheck` → `test`.
- `bun run test` at root runs web's Vitest in **watch mode** and can hang Turbo — use `cd apps/web && bun run test -- --run` for a one-shot run.
- CI split: `ci-fast` (lint, typecheck, web unit tests on PR/push to main+develop), `ci-slow` (coverage, `next build`, Playwright E2E on main+develop), `security` (bun audit, TruffleHog, Semgrep — weekly).
- `proto:gen` must run from the **repo root**: the script references the top-level `proto/` directory and writes into `apps/grpc/src/gen`. Edit the `.proto` files, never `src/gen`.

## Environment & secrets

- Copy `apps/web/.env.example` → `apps/web/.env.local`. Use `.env.local`, NOT `.env`.
- **Redis = `REDIS_URL` in ioredis format** (Upstash `rediss://...` URL). Do NOT use `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` — the "Redis" line in `apps/web/AGENTS.md` is outdated; the code (`src/lib/redis.ts`) uses ioredis + `REDIS_URL` only.
- `BETTER_AUTH_SECRET` and `CRON_SECRET` must be ≥32 chars (`openssl rand -base64 32`).
- `apps/cronJob` MUST share the same `REDIS_URL` and `DATABASE_URL` as web (BullMQ requirement).
- `PAYMENT_MODE`: `mock` for dev; **production builds require `PAYMENT_MODE=live`** (`src/lib/payments/mock.ts` throws in production otherwise).
- **Notification service**: `apps/notifications` requires `DATABASE_URL`, `REDIS_URL`, `NOTIFICATION_ENCRYPTION_KEY`, `RESEND_API_KEY`, `WHATSAPP_PHONE_NUMBER`, `WHATSAPP_SESSION_PATH`, `TELEGRAM_BOT_TOKEN`, `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `NOTIFICATION_SERVICE_SECRET`.

## Database

- Schema: `apps/web/src/db/schema.ts`.
- Local dev: `cd apps/web && bun run db:push` (no migration files).
- Migrations: `db:generate` then `db:migrate`.
- Seeds: use the `bun run db:seed-*` npm scripts (they load `.env.local`); don't invoke the tsx/seed files directly or env may not load.

## Notification Architecture

- All notification logic (email, WhatsApp, Telegram, Web Push) lives in `apps/notifications` (Go gRPC service).
- Web app and cronJob call notifications via gRPC client (`packages/shared/src/lib/notification-grpc-client.ts` → `apps/web/src/lib/notification-client.ts`).
- WhatsApp uses `go.mau.fi/whatsmeow` with session persistence — **not** Meta Graph API. Session path: `WHATSAPP_SESSION_PATH` (default `./whatsapp-session`).
- Web app no longer has direct email/WhatsApp senders; wrapper functions in `notification-client.ts` dispatch via gRPC.
- Old files deleted: `apps/web/src/lib/notifications/email.ts`, `apps/web/src/lib/notifications/whatsapp.ts`, `apps/web/src/lib/notifications/event-emitter.ts`, `apps/web/src/lib/notification-settings.ts`, `apps/web/src/lib/notification-crypto.ts`.

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
- `apps/cronJob` has its own Vitest suite (`bun run test` in that dir).
- `apps/notifications` has no tests yet (Go service).
