# Production Readiness Checklist - KonkosYuk Web

**Project:** KonkosYuk Booking System  
**App Path:** `apps/web`  
**Framework:** Next.js 16.3.1 + React 19.2.8 + TypeScript 6.0.3  
**Package Manager:** Bun 1.3.14  
**Database:** PostgreSQL (Drizzle ORM)  
**Cache/Queue:** Redis (ioredis) + BullMQ  
**Last Updated:** 2026-08-25

---

## Verification Format

| NO | CHECK | VERIFIED | EVIDENCE | KET |
|----|-------|----------|----------|-----|
| 1 | Build reproducible | ☐ | | |
| 2 | Migrations safe | ☐ | | |
| 3 | Rollback strategy | ☐ | | |
| 4 | Healthcheck | ☐ | | |
| 5 | Readiness | ☐ | | |
| 6 | Liveness | ☐ | | |
| 7 | Worker health | ☐ | | |
| 8 | Redis health | ☐ | | |
| 9 | DB health | ☐ | | |
| 10 | Logging | ☐ | | |
| 11 | Monitoring | ☐ | | |
| 12 | Alerts | ☐ | | |
| 13 | Backups | ☐ | | |
| 14 | Rate limiting | ☐ | | |
| 15 | Payment idempotency | ☐ | | |
| 16 | Webhook verification | ☐ | | |
| 17 | Auth hardening | ☐ | | |

---

## Detailed Checks

### 1. Build Reproducible

| Item | Check | Status | Evidence |
|------|-------|--------|----------|
| 1.1 | `bun run build` succeeds on clean clone | ☐ | |
| 1.2 | Build output deterministic (same input → same output) | ☐ | |
| 1.3 | `bun.lockb` committed to repo | ☐ | |
| 1.4 | No `NODE_ENV=development` in production build | ☐ | |
| 1.5 | Environment variables validated at build time | ☐ | |
| 1.6 | Next.js output mode configured (`standalone`) | ☐ | |

**Evidence:**
```
[Document build command output]
[Document bun.lockb status]
```

---

### 2. Migrations Safe

| Item | Check | Status | Evidence |
|------|-------|--------|----------|
| 2.1 | All migrations versioned in `drizzle/` | ☐ | |
| 2.2 | No `db:push` in production (only `db:migrate`) | ☐ | |
| 2.3 | Migration rollback tested | ☐ | |
| 2.4 | Zero-downtime migration strategy for large tables | ☐ | |
| 2.5 | Migration lint/validation in CI | ☐ | |

**Evidence:**
```
[List migration files]
[Document migration process]
```

---

### 3. Rollback Strategy

| Item | Check | Status | Evidence |
|------|-------|--------|----------|
| 3.1 | Database rollback procedure documented | ☐ | |
| 3.2 | Previous deployment artifact retained | ☐ | |
| 3.3 | Feature flags for gradual rollout | ☐ | |
| 3.4 | Blue-green or canary deployment configured | ☐ | |
| 3.5 | Rollback tested in staging | ☐ | |

**Evidence:**
```
[Document rollback procedure]
```

---

### 4. Healthcheck

| Item | Check | Status | Evidence |
|------|-------|--------|----------|
| 4.1 | `/api/health/live` endpoint exists and returns 200 | ☐ | |
| 4.2 | `/api/health/ready` endpoint exists | ☐ | |
| 4.3 | Healthcheck checks DB connectivity | ☐ | |
| 4.4 | Healthcheck checks Redis connectivity | ☐ | |
| 4.5 | Healthcheck checks worker status | ☐ | |
| 4.6 | Healthcheck response time < 500ms | ☐ | |

**Evidence:**
```
[ ] GET /api/health/live → 200
[ ] GET /api/health/ready → 200
[Response time:]
```

**Source:** `src/app/api/health/route.ts`

---

### 5. Readiness

| Item | Check | Status | Evidence |
|------|-------|--------|----------|
| 5.1 | App refuses traffic until fully initialized | ☐ | |
| 5.2 | Database connection pool ready before accepting requests | ☐ | |
| 5.3 | Redis connection ready before accepting requests | ☐ | |
| 5.4 | Worker processes started before accepting jobs | ☐ | |

**Evidence:**
```
[Document startup sequence]
```

---

### 6. Liveness

| Item | Check | Status | Evidence |
|------|-------|--------|----------|
| 6.1 | Process responds to SIGTERM gracefully | ☐ | |
| 6.2 | Memory usage within limits | ☐ | |
| 6.3 | Event loop not blocked | ☐ | |
| 6.4 | Kubernetes liveness probe configured | ☐ | |

**Evidence:**
```
[Document liveness config]
```

---

### 7. Worker Health

| Item | Check | Status | Evidence |
|------|-------|--------|----------|
| 7.1 | BullMQ workers have `QueueEvents` listeners | ☐ | |
| 7.2 | Worker process monitored (restart on crash) | ☐ | |
| 7.3 | Dead letter queue configured | ☐ | |
| 7.4 | Worker metrics exposed (jobs processed, failed, stalled) | ☐ | |
| 7.5 | Graceful shutdown implemented (SIGINT/SIGTERM) | ☐ | |

**Evidence:**
```
[ ] src/workers/index.ts has QueueEvents
[ ] Worker restart policy:
```

---

### 8. Redis Health

| Item | Check | Status | Evidence |
|------|-------|--------|----------|
| 8.1 | Redis connection pooling configured | ☐ | |
| 8.2 | Connection timeout set (default: 10000ms) | ☐ | |
| 8.3 | Retry strategy on connection failure | ☐ | |
| 8.4 | Redis used for: rate limiting, sessions, queues, cache | ☐ | |
| 8.5 | Redis failover tested | ☐ | |

**Evidence:**
```
[ ] src/lib/redis.ts connection config
[ ] Redis URL format: rediss://...
```

---

### 9. DB Health

| Item | Check | Status | Evidence |
|------|------|---------|----------|
| 9.1 | Connection pool size configured (max: 5) | ☐ | |
| 9.2 | Connection timeout configured (10000ms) | ☐ | |
| 9.3 | SSL/TLS enabled for production | ☐ | |
| 9.4 | Prepared statements enabled | ☐ | |
| 9.5 | Database indexes verified for critical queries | ☐ | |

**Evidence:**
```
[ ] src/db/index.ts pool config
[ ] Connection string includes sslmode=require
```

---

### 10. Logging

| Item | Check | Status | Evidence |
|------|-------|--------|----------|
| 10.1 | Structured logging with Winston | ☐ | |
| 10.2 | Log levels configured (info, warn, error) | ☐ | |
| 10.3 | Request ID correlation (`x-request-id`) | ☐ | |
| 10.4 | Sensitive data scrubbed (passwords, tokens, KTP) | ☐ | |
| 10.5 | Logs shipped to external service (Sentry/CloudWatch) | ☐ | |
| 10.6 | No `console.error` in production code | ☐ | |

**Evidence:**
```
[ ] src/lib/logger.ts exists
[ ] Sentry integration: src/lib/sentry.ts
[ ] Grep for console.error:
```

---

### 11. Monitoring

| Item | Check | Status | Evidence |
|------|-------|--------|----------|
| 11.1 | APM tool configured (Sentry) | ☐ | |
| 11.2 | Custom metrics for business events | ☐ | |
| 11.3 | Database query performance monitoring | ☐ | |
| 11.4 | Redis performance monitoring | ☐ | |
| 11.5 | Worker queue depth monitoring | ☐ | |
| 11.6 | Error rate alerting configured | ☐ | |

**Evidence:**
```
[ ] Sentry DSN configured in env
[ ] Custom transactions:
```

---

### 12. Alerts

| Item | Check | Status | Evidence |
|------|-------|--------|----------|
| 12.1 | PagerDuty/OpsGenie integration | ☐ | |
| 12.2 | On-call rotation defined | ☐ | |
| 12.3 | Alert thresholds documented | ☐ | |
| 12.4 | Alert fatigue mitigation (grouping, dedup) | ☐ | |
| 12.5 | Runbooks for critical alerts | ☐ | |

**Evidence:**
```
[Alert channels:]
[Runbooks location:]
```

---

### 13. Backups

| Item | Check | Status | Evidence |
|------|-------|--------|----------|
| 13.1 | Automated daily DB backups | ☐ | |
| 13.2 | Backup retention policy (min 30 days) | ☐ | |
| 13.3 | Backup restoration tested monthly | ☐ | |
| 13.4 | Point-in-time recovery (PITR) enabled | ☐ | |
| 13.5 | Backup encryption at rest | ☐ | |

**Evidence:**
```
[Backup provider:]
[Last restore test:]
```

---

### 14. Rate Limiting

| Item | Check | Status | Evidence |
|------|-------|--------|----------|
| 14.1 | Public endpoints rate limited (60 req/min) | ☐ | |
| 14.2 | Auth endpoints rate limited (5 req/10s) | ☐ | |
| 14.3 | Admin endpoints rate limited | ☐ | |
| 14.4 | Webhook endpoints rate limited | ☐ | |
| 14.5 | Rate limit fails closed when Redis unavailable | ☐ | |
| 14.6 | IP-based rate limiting implemented | ☐ | |

**Evidence:**
```
[ ] src/lib/rate-limit.ts
[ ] Redis-backed with ioredis
[ ] Fail-closed behavior verified:
```

---

### 15. Payment Idempotency

| Item | Check | Status | Evidence |
|------|-------|--------|----------|
| 15.1 | `transactionId` unique constraint on payments | ☐ | |
| 15.2 | `payoutIdempotencyKey` column exists | ☐ | |
| 15.3 | Webhook deduplication by payload hash | ☐ | |
| 15.4 | Idempotency key passed to payment gateway | ☐ | |
| 15.5 | Duplicate webhook events ignored | ☐ | |

**Evidence:**
```
[ ] Schema: payments.transactionId UNIQUE
[ ] Schema: payments.payoutIdempotencyKey
[ ] Webhook dedup: src/lib/payments/webhook.ts
```

---

### 16. Webhook Verification

| Item | Check | Status | Evidence |
|------|-------|--------|----------|
| 16.1 | HMAC signature verification for all providers | ☐ | |
| 16.2 | Webhook IP allowlist configured | ☐ | |
| 16.3 | Webhook timestamp validation (reject old webhooks) | ☐ | |
| 16.4 | Webhook payload hash stored for dedup | ☐ | |
| 16.5 | Mock webhook endpoint restricted to mock mode | ☐ | |
| 16.6 | Webhook secret rotation procedure | ☐ | |

**Evidence:**
```
[ ] Doku: HMAC-SHA256
[ ] iPaymu: HMAC-SHA256 (migrated from MD5)
[ ] Nicepay: HMAC-SHA256
[ ] IP allowlist: src/lib/payments/webhook-ips.ts
```

---

### 17. Auth Hardening

| Item | Check | Status | Evidence |
|------|-------|--------|----------|
| 17.1 | Session cookie `httpOnly` in production | ☐ | |
| 17.2 | Session cookie `secure` in production | ☐ | |
| 17.3 | Session cookie `sameSite=strict` in production | ☐ | |
| 17.4 | CSRF token validation on all mutations | ☐ | |
| 17.5 | Two-factor authentication (TOTP) available | ☐ | |
| 17.6 | Account lockout after failed login attempts | ☐ | |
| 17.7 | Password minimum 8 characters | ☐ | |
| 17.8 | Email verification required | ☐ | |
| 17.9 | OAuth client secret never exposed to client | ☐ | |
| 17.10 | Rate limiting on auth endpoints | ☐ | |

**Evidence:**
```
[ ] Session config: src/lib/auth.ts
[ ] CSRF: validateActionCsrf in actions
[ ] 2FA: better-auth twoFactor plugin
[ ] Password policy: Better Auth config
```

---

## CI/CD Pipeline Status

| Pipeline | Status | Last Run |
|----------|--------|----------|
| Fast Checks (lint, typecheck, unit tests) | ☐ | |
| Slow Checks (coverage, build, e2e) | ☐ | |
| Security Checks (audit, secrets, SAST) | ☐ | |

---

## Deployment Checklist

| Item | Check | Status |
|------|-------|--------|
| Vercel project Root Directory set to `apps/web` | ☐ | |
| Environment variables configured in Vercel | ☐ | |
| Database migrations applied | ☐ | |
| Redis instance provisioned | ☐ | |
| Worker process deployed (Render/Railway) | ☐ | |
| Custom domain configured with SSL | ☐ | |
| Sentry DSN configured | ☐ | |
| Webhook endpoints accessible (HTTPS) | ☐ | |

---

## Post-Deployment Verification

| Check | Command | Expected Result |
|-------|---------|-----------------|
| Healthcheck | `curl https://konkosyuk.com/api/health/live` | `200 OK` |
| Readiness | `curl https://konkosyuk.com/api/health/ready` | `200 OK` |
| API smoke test | `curl https://konkosyuk.com/api/properties?page=1&limit=1` | `200 OK` with JSON |
| Webhook endpoint | `curl -X POST https://konkosyuk.com/api/webhooks/ipaymu` | `405 Method Not Allowed` |
| Static assets | `curl -I https://konkosyuk.com/` | `200 OK` with HTML |

---

## Rollback Procedure

1. **Vercel Rollback:** Dashboard → Deployments → Select previous → Promote
2. **Database Rollback:** `cd apps/web && bun run db:migrate --to=<previous_migration>`
3. **Worker Rollback:** Render/Railway dashboard → Rollback to previous version
4. **Verification:** Run healthcheck and smoke tests after rollback

---

## Emergency Contacts

| Role | Contact |
|------|---------|
| DevOps Lead | |
| On-Call Engineer | |
| Database Admin | |
| Security Lead | |

---

## Notes

- All checks must be verified against **actual source code** and **command output**, not assumptions.
- Mark `VERIFIED` as `✅` when confirmed, `❌` when failed, `⏳` when pending.
- Evidence should include file paths, command outputs, or screenshot references.
- This checklist must be reviewed before every production deployment.
