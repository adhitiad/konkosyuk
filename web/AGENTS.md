<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# KonkosYuk Agent Guide

## Commands

- Use **Bun only**: `bun run dev`, `bun run build`, `bun run lint`, `bun run test`
- Typecheck: `bun x tsc --noEmit` — currently has known errors in `src/app/api/newsletter/subscribe/__tests__/route.test.ts`, `src/app/global-not-found.tsx`, and `src/scripts/__tests__/seed.test.ts`
- DB push: `bun run db:push` (Drizzle push, no migrations for local dev)
- Seed: `bun run db:seed`
- Env file: `.env.local` (not `.env`)

## Architecture

- Next.js 16.3.1, React 19.2.8, TypeScript 6.0.3, strict mode
- Path alias: `@/*` → `./src/*`
- i18n: `next-intl` via `src/i18n/request.ts`
- Auth: Better Auth (`src/lib/auth.ts` server, `src/lib/auth-client.ts` client) with drizzle adapter, twoFactor, nextCookies plugins
- State: TanStack Query v5 for server data, Zustand for client state
- Charts: Recharts wrapped in `src/components/ui/chart.tsx` (`ChartContainer`, `ChartTooltipContent`)
- Package manager: Bun 1.3.14

## API Response Shape

Route handlers return wrapped responses via `ok()`:

```ts
return ok(data); // → { success: true, data }
```

List endpoints often add `meta` manually for pagination: `ok({ data, meta: { total, page, limit, totalPages } })`. Client queries must unwrap `response.data`. Check the actual endpoint before assuming a `meta` field exists.

## Auth Patterns

- Server routes: `requireSession(['admin', 'staff'])` from `src/lib/auth.ts`
- Admin client pages: wrapped with `withAdminAuth(Component)` HOC from `src/lib/with-admin-auth.tsx`
- Roles: `cust | owner | admin | staff`
- Session cookie: `session_token` (httpOnly, secure in prod, sameSite strict in prod)

## DB & Schema

- Schema: `src/db/schema.ts`
- Drizzle config: `drizzle.config.ts` reads `DATABASE_URL` from `.env.local`
- Most monetary columns use `numeric(...)`; payment `amount` is stored as `text` and cast to `NUMERIC` in queries
- Redis: Upstash Redis (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) for rate limiting, Ably, and caching

## Quirks

- CSP in `next.config.ts` is strict; external map tiles and image hosts are whitelisted in `remotePatterns`
- `apiClient` (`src/lib/axios.ts`) auto-injects CSRF token on mutations and redirects to `/login` on 401
- Admin analytics `/revenue` defaults to current month; `/revenue-trend` defaults to 12 months

## Testing

- Unit tests: Vitest with jsdom, setup in `src/__tests__/setup.ts`
- E2E tests: Playwright (`playwright.config.ts`) starts `bun run dev` automatically, runs against `http://localhost:3000`
- Coverage thresholds enforced in `vitest.config.ts` (65% default, 90% for payments/utils)
- Running `bun run test` starts watch mode; use `bun run test -- --run` for CI
