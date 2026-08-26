# Dockerfile untuk Render Background Worker BullMQ
# Build dari root context monorepo, bukan dari apps/cronJob
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Copy root manifest + workspace manifests agar workspace protocol ter-resolve
COPY package.json bun.lock turbo.json ./
COPY apps/cronJob/package.json ./apps/cronJob/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# Install semua workspace dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY apps/cronJob ./apps/cronJob
COPY packages/shared ./packages/shared

# Build shared package jika diperlukan
RUN bun run --filter @konkosyuk/shared build

# Final image
FROM oven/bun:1-alpine
WORKDIR /app

# Copy node_modules dari builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/cronJob ./apps/cronJob
COPY --from=builder /app/packages/shared ./packages/shared

WORKDIR /app/apps/cronJob
CMD ["bun", "src/workers/index.ts"]
