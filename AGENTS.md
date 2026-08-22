# Konkosyuk Monorepo

## Structure

- `web/` — Next.js 16 app (detailed rules in `web/AGENTS.md`)
- `mobile/` — Flutter app, standard setup

## Commands

Run everything from `web/`:

```bash
cd web && bun run dev        # dev server on :3000
cd web && bun run lint
cd web && bun run test -- --run
cd web && bun x tsc --noEmit
```

## Environment

- Copy `web/.env.example` → `web/.env.local`
- Needs PostgreSQL (`DATABASE_URL`), Upstash Redis (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`), and external service keys
- `BETTER_AUTH_SECRET` and `CRON_SECRET` must be ≥32 chars

## Database

- Schema: `web/src/db/schema.ts`
- Local schema changes: `cd web && bun run db:push` (no migration files)
- Migrations: `cd web && bun run db:generate` then `cd web && bun run db:migrate`

## Aturan

Tolong ikuti aturan berikut saat menulis kode di dalam monorepo ini `.kilo/rules`

## Testing

- Unit: Vitest (jsdom), setup in `web/src/__tests__/setup.ts`
- E2E: Playwright (`cd web && bun run test:e2e`), auto-starts dev server
- Coverage thresholds enforced in `web/vitest.config.ts` (65% default, 90% for payments/utils)

## Deploy

- Vercel project Root Directory must be set to `web` in project settings
- `web/vercel.json` contains build config, regions, functions, and crons

## Mobile

- Standard Flutter; no shared code with web
- Build/run from `mobile/` with `flutter` commands
