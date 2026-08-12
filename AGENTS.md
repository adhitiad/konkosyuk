<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# KonkosYuk Agent Guide

## Commands

- Use **Bun only**: `bun run dev`, `bun run build`, `bun run lint`, `bun run test`
- Typecheck: `bun x tsc --noEmit` (ESLint 9 + TS 7.0 is incompatible; `bun run lint` currently fails)
- DB push: `bun run db:push` (Drizzle push, no migrations for local dev)
- Seed: `bun run db:seed`
- Env file: `.env.local` (not `.env`)

## Architecture

- Next.js 16.3 (App Router), React 19, TypeScript strict
- Path alias: `@/*` → `./src/*`
- i18n: `next-intl` via `src/i18n/request.ts`
- Auth: Better Auth (`src/lib/auth.ts` server, `src/lib/auth-client.ts` client)
- State: TanStack Query v5 for server data, Zustand for client state
- Charts: Recharts wrapped in `src/components/ui/chart.tsx` (`ChartContainer`, `ChartTooltipContent`)

## API Response Shape

All API routes return wrapped responses:

```ts
return ok({ data, meta: {...} }) // → { success: true, data, meta }
```

Client queries must unwrap `response.data` before using it. Many existing pages do this inconsistently — check the actual response shape before assuming `data` is the payload.

## Auth Patterns

- Server routes: `requireSession(['admin', 'staff'])` from `src/lib/auth.ts`
- Admin client pages: wrapped with `withAdminAuth(Component)` HOC from `src/lib/with-admin-auth.tsx`
- Roles: `cust | owner | admin | staff`

## DB & Schema

- Schema: `src/db/schema.ts`
- Drizzle config: `drizzle.config.ts` reads `DATABASE_URL` from `.env.local`
- All monetary values stored as `text` in schema, cast to `NUMERIC` in queries

## Quirks

- `bun run build` currently fails on `cloudinary` `fs` import in client components — pre-existing, not caused by new code
- CSP in `next.config.ts` is strict; external map tiles and image hosts are whitelisted
- `apiClient` (`src/lib/axios.ts`) auto-injects CSRF token on mutations and redirects to `/login` on 401
- Admin analytics endpoints default to current month, not 12 months (unlike `revenue-trend`)
