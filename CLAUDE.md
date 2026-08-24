# Konkosyuk Monorepo — Claude Code Guide

This is a Turborepo monorepo managed with Bun workspaces.

## Workspaces

- `apps/web` — Next.js 16 web application
- `apps/mobile` — Flutter mobile application
- `packages/shared` — Shared TypeScript utilities, Zod schemas, constants, and pure utilities. See `docs/shared-packages-guideline.md` for what belongs here.

## Root Scripts

- `bun run dev` — Start all workspaces in dev mode via Turbo
- `bun run build` — Build all workspaces via Turbo
- `bun run lint` — Lint all workspaces via Turbo
- `bun run test` — Test all workspaces via Turbo

## Key Configs

- `turbo.json` — Pipeline configuration for build, dev, lint, test
- `package.json` — Workspace definitions and root dependencies
- `apps/web/package.json` — Web app dependencies and scripts
- `packages/shared/package.json` — Shared package with drizzle-orm and zod

## Notes for AI Sessions

- Always run commands from the workspace root unless otherwise specified.
- The web app lives in `apps/web/`, not `web/`.
- Shared code goes in `packages/shared/`.
- Use `bun` for all package management and script execution.
- Do not modify `apps/web/vercel.json` without understanding the monorepo root directory implications.
