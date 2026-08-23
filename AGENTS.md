# Konkosyuk Monorepo

## Structure

- `apps/web` — Next.js 16 app (detailed rules in `apps/web/AGENTS.md`)
- `apps/mobile` — Flutter app (standard setup, future Kotlin/Swift possible)
- `packages/shared` — Shared types, Zod schemas, Drizzle schema exports, constants

## Commands

Run from repo root using Turborepo:

```bash
bun run dev        # start all apps in dev mode
bun run build      # build all apps via turbo
bun run lint       # lint all apps
bun run test       # test all apps
```

Or run per-app:

```bash
cd apps/web && bun run dev
cd apps/web && bun run lint
cd apps/web && bun run test -- --run
cd apps/web && bun x tsc --noEmit
```

## Environment

- Copy `apps/web/.env.example` → `apps/web/.env.local`
- Needs PostgreSQL (`DATABASE_URL`), Upstash Redis (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`), and external service keys
- `BETTER_AUTH_SECRET` and `CRON_SECRET` must be ≥32 chars

## Database

- Schema: `apps/web/src/db/schema.ts`
- Shared package: `packages/shared` (future shared Drizzle exports)
- Local schema changes: `cd apps/web && bun run db:push` (no migration files)
- Migrations: `cd apps/web && bun run db:generate` then `cd apps/web && bun run db:migrate`

## Aturan

Tolong ikuti aturan berikut saat menulis kode di dalam monorepo ini `.kilo/rules`

## Testing

- Unit: Vitest (jsdom), setup in `apps/web/src/__tests__/setup.ts`
- E2E: Playwright (`cd apps/web && bun run test:e2e`), auto-starts dev server
- Coverage thresholds enforced in `apps/web/vitest.config.ts` (65% default, 90% for payments/utils)

## Deploy

- Vercel project Root Directory must be set to `apps/web` in project settings
- `apps/web/vercel.json` contains build config, regions, functions, and crons

## Mobile

- Located at `apps/mobile/`
- Build/run with `flutter` commands from `apps/mobile/`
- Shared code via `packages/shared` (types, validations, constants)
