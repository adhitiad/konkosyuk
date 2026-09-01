# KonkosYuk Copilot Instructions

This repository is a Bun workspaces monorepo for a rental marketplace. The main product is the Next.js web app in `apps/web`; the mobile app in `apps/mobile` is a separate Flutter project, and `packages/shared` holds shared, app-agnostic TypeScript utilities.

## Project shape

- `apps/web` — Next.js 16 app (App Router, React 19, TypeScript). This is the primary product and where most feature work happens.
- `apps/mobile` — Flutter app; use Flutter/Dart tooling here instead of web commands.
- `packages/shared` — Zod schemas, domain types, constants, and pure utilities. It must not import app code.
- Root config: `package.json`, `turbo.json`; use Bun for package management and scripts.

## Build, test, and lint

Run commands from the repo root unless a task is clearly scoped to one app. For web work, prefer the app-level scripts.

```bash
# Monorepo
bun run dev
bun run build
bun run lint
bun run test
```

```bash
# Web app
cd apps/web
bun run lint
bun x tsc --noEmit
bun run test -- --run
bun run test:coverage
bun run test:e2e

# Single test file or test name
bun run test -- --run src/__tests__/unit/path/to/file.test.ts
bun run test -- --run -t "describes payment validation"

# Database / local app tasks
bun run db:push
bun run db:seed
```

Important notes:
- `bun run test` at the repo root can start Vitest in watch mode and may hang in Turbo; for CI-style checks, use `cd apps/web && bun run test -- --run`.
- `apps/web` has known TypeScript issues in specific files; do not rely on a global typecheck passing before fixing those files.
- The app supports Playwright E2E against `http://localhost:3000` and auto-starts the dev server.

## High-level architecture

### Web app architecture

The web app is a Next.js 16 product with these main layers:

- App Router + server components in `apps/web/src/app`
- Server-side auth and session logic in `apps/web/src/lib/auth.ts`
- Drizzle schema and database access in `apps/web/src/db` and `apps/web/src/db/schema.ts`
- API route handlers and server actions that wrap responses through `ok(data)`; list endpoints often add `meta`
- Better Auth for authentication; roles are `cust | owner | admin | staff`
- TanStack Query for remote data fetching, Zustand for client state, and `next-intl` for localization
- Notification, payment, and Redis integrations in `apps/web/src/lib`

### Data and backend patterns

- Database: PostgreSQL + Drizzle ORM. Local dev uses `bun run db:push`; schema lives in `apps/web/src/db/schema.ts`.
- Redis: the app expects `REDIS_URL` in ioredis format (for example `rediss://...`); do not use the older REST URL variables for Redis.
- Payments: payment amount storage and validation are special-cased; verify the actual code paths before changing monetary logic.
- Auth: server routes use `requireSession([...])`; admin pages may use the admin auth HOC.

### Shared package boundaries

`packages/shared` should remain free of framework and app-specific code: keep it focused on Zod schemas, business rules, domain types, and pure utils. It must not import from `apps/web`.

## Key conventions and repository-specific rules

- Use Bun only: `bun add`, `bun run`, and `bunx`. Do not use `npm`, `yarn`, or `pnpm` in repo scripts or dependency changes.
- Read `apps/web/AGENTS.md` and the root `AGENTS.md` before editing the web app; they capture repo-specific rules and known caveats.
- `apps/web/.env.local` is the required env file; do not rely on `.env`.
- Keep code comments, variable names, file names, and `CHANGELOG.md` entries in Indonesian when touching project code and docs.
- Next.js 16 has breaking changes relative to older versions. Before modifying web app code, read the relevant docs under `apps/web/node_modules/next/dist/docs/` or the installed package docs to match the project’s expectations.
- Do not set `outputDirectory` in `apps/web/vercel.json`; this causes ENOENT issues in Vercel with the current Next.js setup.
- Web API handlers typically return wrapped responses via `ok(data)`, which resolves to `{ success: true, data }`; list endpoints may add `meta` manually.
- Production code should not use `console.*`; prefer the repo logger (`logError`) instead.
- Prefer `z.unknown()` over `z.any()`, and extract magic numbers into named constants.
- Keep `packages/shared` app-agnostic and avoid circular dependencies.

## Environment and app setup

- `BETTER_AUTH_SECRET` must be at least 32 characters.
- `PAYMENT_MODE` should be `mock` for local development; production builds require `PAYMENT_MODE=live`.
- Notification settings are configured in `apps/web/.env.local` for email, web push, and encryption.
- For local webhook testing, follow the project’s `ngrok` setup and the app’s startup scripts in `apps/web/package.json`.

## Cross-repo guidance

- The user-facing product is web-first, but the repo intentionally includes a separate Flutter app and shared package.
- Most full-stack product logic and operational changes belong in `apps/web`.
- Changes that should be reusable across apps should live in `packages/shared`, not duplicated in app-specific code.

## Related docs to consult

- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `apps/web/AGENTS.md`
- `apps/web/CONTRIBUTING.md`
- `docs/shared-packages-guideline.md` (if present in the repo)

These files contain the most repo-specific constraints and should be treated as the authoritative guide for working in this codebase.
