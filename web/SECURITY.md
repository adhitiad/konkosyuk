# Security Policy - KonkosYuk

**Platform:** KonkosYuk - Booking System for Kost & Kontrakan  
**Version:** 0.1.0  
**Last Updated:** 2026-08-14

---

## 1. Security Audit Summary

A comprehensive security audit was conducted on the KonkosYuk platform covering OWASP API Security Top 10, Next.js 16 security best practices, Drizzle ORM SQL injection prevention, Better Auth security configurations, and payment gateway integrations (Doku, iPaymu, Nicepay).

**Overall Risk Level: HIGH**

### Critical Findings (Immediate Action Required)

1. Webhook endpoints lack rate limiting and IP allowlisting
2. Admin webhook reprocess endpoint bypasses signature verification
3. CSRF token cookie is not `httpOnly` - vulnerable to XSS token theft
4. iPaymu uses MD5 for webhook signature verification (cryptographically broken)
5. Account linking allows unverified email accounts (`requireLocalEmailVerified: false`)
6. No MFA/2FA implemented for financial operations

### High Findings (Fix within 1 week)

1. Missing rate limiting on public API endpoints
2. CSP allows `unsafe-inline` scripts
3. Missing Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers
4. Payment gateway error details exposed to clients
5. Mass assignment vulnerabilities in admin user update endpoints
6. Hardcoded fallback secrets in auth configuration

### Medium Findings (Fix within 2 weeks)

1. Device ID cookie used for rate limiting but generated server-side with `navigator` check
2. No explicit password policy enforcement
3. No session idle timeout configuration
4. Missing security headers (`X-Permitted-Cross-Domain-Policies`, `X-Download-Options`)
5. Inconsistent `requireSession` implementations between files
6. Sensitive data (KTP, balance) returned in API responses without need-to-know filtering

---

## 2. Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

---

## 3. Security Best Practices

### Authentication & Authorization

- All API routes must use server-side session validation via `requireSession()`
- Role-based access control enforced on all protected endpoints
- CSRF protection required for all state-changing operations (POST, PATCH, DELETE)
- Admin routes require both `admin` or `staff` role depending on sensitivity
- Payment operations require fraud flag checks

### Input Validation

- All user input must be validated using Zod schemas before processing
- Drizzle ORM used with parameterized queries exclusively - no raw SQL concatenation
- File uploads validated for type, size, and content
- Email addresses validated with RFC-compliant regex

### Data Protection

- Payment credentials encrypted with AES-256-GCM at rest
- Sensitive fields (passwords, tokens, secrets) never logged or returned in API responses
- KTP numbers and images access-restricted to owner and verified admins only
- Database monetary values stored as `text`, cast to `NUMERIC` in queries

### Rate Limiting

| Endpoint Type    | Limit       | Window   |
| ---------------- | ----------- | -------- |
| Authentication   | 60 requests | 1 minute |
| Booking/Payment  | 10 requests | 1 minute |
| Admin Operations | 20 requests | 1 minute |
| General API      | 30 requests | 1 minute |

---

## 4. Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in KonkosYuk, please report it responsibly.

### Reporting Process

1. **DO NOT** open a public GitHub issue for security vulnerabilities
2. **DO** email security reports to: **security@konkosyuk.app**
3. Include the following information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (if any)
   - Your contact information

### What to Expect

- **Acknowledgment:** Within 48 hours
- **Initial Assessment:** Within 5 business days
- **Status Updates:** Every 5 business days until resolution
- **Fix Timeline:** Critical issues within 7 days, High within 14 days, Medium within 30 days

### Disclosure Policy

- We follow coordinated disclosure
- Please do not publicly disclose the vulnerability until we have released a fix
- We will credit researchers who report valid vulnerabilities (unless you prefer to remain anonymous)

---

## 5. Security Headers

The application implements the following security headers in production:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(self)
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://translate.google.com; ...
```

**Recommended additions (pending implementation):**

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
X-Permitted-Cross-Domain-Policies: none
X-Download-Options: noopen
```

---

## 6. Payment Gateway Security

### Encryption

- All payment gateway credentials encrypted with AES-256-GCM
- Encryption key stored in `PAYMENT_CONFIG_ENCRYPTION_KEY` environment variable
- Key must be 32 bytes base64-encoded
- Secrets never stored in plain text in database

### Webhook Verification

- All webhooks verified using HMAC-SHA256 signature validation
- Timing-safe comparison used to prevent timing attacks
- Webhook events logged with signature validation status
- Duplicate webhook events rejected via unique constraint on `(provider, event_id)`

### Known Issues

- **iPaymu:** Uses MD5 for signature generation (non-critical for outbound, but webhook verification should use HMAC-SHA256)
- **Mock mode:** Webhook verification bypassed in mock mode (development only)

---

## 7. Dependency Scanning

Automated dependency scanning is configured via:

- **Dependabot:** Weekly scans for vulnerability alerts
- **Configuration:** `.github/dependabot.yml`
- **Action:** Dependabot creates PRs for security patches automatically

### Manual Scanning Commands

```bash
# Audit dependencies for known vulnerabilities
bun audit

# Update dependencies
bun update

# Check for outdated packages
bun outdated
```

---

## 8. Security Checklist

### Pre-Deployment Checklist

- [ ] `BETTER_AUTH_SECRET` is set to a strong random value (min 32 chars)
- [ ] `PAYMENT_CONFIG_ENCRYPTION_KEY` is set in production
- [ ] `CRON_SECRET` is set to a strong random value
- [ ] All payment gateway webhook secrets configured
- [ ] Google OAuth credentials configured (if using social login)
- [ ] HTTPS enabled in production
- [ ] Database credentials use strong passwords
- [ ] Redis credentials secured
- [ ] Environment variables not committed to git
- [ ] `.env.local` in `.gitignore`

### API Security Checklist

- [ ] All endpoints require authentication where appropriate
- [ ] Role-based access control enforced server-side
- [ ] CSRF tokens validated on all mutations
- [ ] Rate limiting applied to all public endpoints
- [ ] Input validation using Zod on all endpoints
- [ ] No raw SQL string concatenation
- [ ] Error messages sanitized in production
- [ ] No sensitive data in API responses (passwords, secrets, tokens)

### Payment Security Checklist

- [ ] Payment amounts validated server-side (never trust client)
- [ ] Webhook signatures verified before processing
- [ ] Payment status transitions validated (no direct DB manipulation)
- [ ] Duplicate payment detection implemented
- [ ] Fraud detection checks enabled
- [ ] Refund/void operations logged and audited
- [ ] Payment gateway credentials encrypted at rest

### Frontend Security Checklist

- [ ] XSS prevention via React's built-in escaping
- [ ] CSP headers configured
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] Sensitive data not stored in localStorage
- [ ] API tokens stored in httpOnly cookies only
- [ ] CSRF tokens included in all mutations

---

## 9. Contact

For security concerns, please contact: **security@konkosyuk.app**

---

_This document is maintained by the KonkosYuk security team. Last audit: 2026-08-14._
