# Security Fixes Implementation Guide

This document contains step-by-step code fixes for identified security vulnerabilities. Each fix is designed to be implementable independently.

---

## Fix 1: CSRF Token - Make Cookie httpOnly (CRITICAL)

**File:** `src/app/api/csrf/route.ts`

**Issue:** CSRF token cookie is readable by JavaScript, allowing XSS attackers to steal the token.

```typescript
// BEFORE (Vulnerable)
response.cookies.set("csrf_token", token, {
  httpOnly: false, // <-- XSS can read this
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 24,
  path: "/",
});

// AFTER (Fixed)
response.cookies.set("csrf_token", token, {
  httpOnly: true, // <-- Not accessible via JS
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict", // <-- Stricter CSRF protection
  maxAge: 60 * 60 * 24,
  path: "/",
});
```

**Follow-up:** Update `src/lib/axios.ts` to read CSRF token from a separate endpoint instead of cookies:

```typescript
// src/lib/axios.ts - Update getCsrfToken
export async function getCsrfToken(): Promise<string | null> {
  if (typeof document === "undefined") return null;
  // Token is now in a meta tag or fetched from a dedicated endpoint
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  return metaTag?.getAttribute("content") ?? null;
}

export async function ensureCsrfToken(): Promise<void> {
  const token = await getCsrfToken();
  if (token) return;
  // Fetch from dedicated endpoint that returns token in response body
  const response = await fetch("/api/csrf", { credentials: "same-origin" });
  if (!response.ok) throw new Error("Failed to initialize CSRF token");
}
```

---

## Fix 2: Replace MD5 with HMAC-SHA256 for iPaymu (CRITICAL)

**File:** `src/lib/payments/ipaymu.ts`

**Issue:** MD5 is cryptographically broken. Webhook signature verification must use HMAC-SHA256.

```typescript
// BEFORE (Vulnerable)
import { generateMd5Signature, verifySignature } from './signature'

function buildIpaymuStringToSign(...) { ... }
const signature = generateMd5Signature(stringToSign)

// AFTER (Fixed)
import { generateSha256Signature, verifySignature } from './signature'

function buildIpaymuStringToSign(...) { ... }
const signature = generateSha256Signature(stringToSign, apiKey)
```

**Note:** You will need to coordinate with iPaymu to ensure their API accepts HMAC-SHA256. If they only support MD5 outbound, keep MD5 for outbound requests but use HMAC-SHA256 for inbound webhook verification if possible.

---

## Fix 3: Add Rate Limiting to Webhook Endpoints (CRITICAL)

**File:** `src/app/api/webhooks/[provider]/route.ts`

**Issue:** Webhook endpoints have no rate limiting, allowing DDoS attacks and spam.

```typescript
// BEFORE
export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  try {
    const { provider } = await params
    // No rate limiting!
    const adapter = getPaymentProvider(provider)
    // ...

// AFTER
import { enforceRateLimit, webhookRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  try {
    const { provider } = await params

    // Validate provider first
    const adapter = getPaymentProvider(provider)
    if (!adapter) {
      return NextResponse.json({ success: false, error: 'Unknown provider' }, { status: 400 })
    }

    // Apply rate limiting by IP
    const limited = await enforceRateLimit(req, webhookRateLimit)
    if (limited) return limited

    const rawBody = await req.text()
    // ... rest of handler
```

**Add new rate limiter in `src/lib/rate-limit.ts`:**

```typescript
export const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // Allow burst of webhooks
  key: "webhook",
});
```

---

## Fix 4: Secure Admin Webhook Reprocess Endpoint (CRITICAL)

**File:** `src/app/api/admin/webhooks/route.ts`

**Issue:** Admin can mark any webhook as processed without verifying signature, allowing payment state manipulation.

```typescript
// BEFORE (Vulnerable)
export async function PATCH(req: NextRequest) {
  // ...
  const webhookId = body.id as string

  const [webhook] = await db.select().from(webhookEvents).where(eq(webhookEvents.id, webhookId)).limit(1)

  if (webhook.processedAt) {
    return fail('Webhook has already been processed', 400)
  }

  await db.update(webhookEvents).set({
    processedAt: new Date(),
    signatureValid: true, // <-- Forcing signatureValid = true
  }).where(eq(webhookEvents.id, webhookId))

// AFTER (Fixed)
export async function PATCH(req: NextRequest) {
  const authResult = await validateAdminOnlyRequest(req)
  if (authResult instanceof Response) return authResult

  const body = await req.json()
  const webhookId = body.id as string

  if (!webhookId) {
    return fail('Webhook ID is required', 400)
  }

  const [webhook] = await db.select().from(webhookEvents).where(eq(webhookEvents.id, webhookId)).limit(1)

  if (!webhook) {
    return fail('Webhook not found', 404)
  }

  if (webhook.processedAt) {
    return fail('Webhook has already been processed', 400)
  }

  if (!webhook.signatureValid) {
    return fail('Cannot reprocess webhook with invalid signature. Investigate manually.', 400)
  }

  // Re-verify the webhook payload before reprocessing
  const adapter = getPaymentProvider(webhook.provider)
  if (!adapter) {
    return fail('Unknown provider for this webhook', 400)
  }

  try {
    const payload = webhook.payload as Record<string, unknown>
    const rawBody = JSON.stringify(payload)
    const ctx = {
      provider: webhook.provider as 'ipaymu' | 'doku' | 'nicepay',
      headers: new Headers(payload.headers as Record<string, string>),
      rawBody,
    }

    const isValid = await adapter.verifyWebhookSignature(ctx)
    if (!isValid) {
      return fail('Webhook signature verification failed on reprocessing', 400)
    }

    // Reprocess the webhook
    await handleWebhookRequest(webhook.provider, ctx)

    await db.update(webhookEvents).set({
      processedAt: new Date(),
      signatureValid: true,
    }).where(eq(webhookEvents.id, webhookId))

    await createAuditLog({
      action: 'update',
      targetType: 'webhook',
      targetId: webhookId,
      adminId: session.user.id,
      details: {
        provider: webhook.provider,
        eventId: webhook.eventId,
        action: 'reprocess',
      },
    })

    return ok({ success: true })
  } catch (error) {
    return handleApiError(error, 'PATCH /api/admin/webhooks')
  }
}
```

---

## Fix 5: Remove Account Linking Without Email Verification (HIGH)

**File:** `src/lib/auth.ts`

**Issue:** `requireLocalEmailVerified: false` allows attackers to link unverified OAuth accounts to existing user accounts.

```typescript
// BEFORE (Vulnerable)
account: {
  accountLinking: {
    enabled: true,
    trustedProviders: ['google'],
    requireLocalEmailVerified: false, // <-- Security risk
  },
},

// AFTER (Fixed)
account: {
  accountLinking: {
    enabled: true,
    trustedProviders: ['google'],
    requireLocalEmailVerified: true, // <-- Require email verification
  },
},
```

**Additional hardening:**

```typescript
// Also add account linking with explicit email confirmation
emailAndPassword: {
  enabled: true,
  requireEmailVerification: true, // <-- Ensure email is verified
},
```

---

## Fix 6: Implement MFA/Two-Factor Authentication (HIGH)

**File:** `src/lib/auth.ts`

**Issue:** No MFA for admin and staff accounts, critical for a financial platform.

```typescript
// Add twoFactor plugin
import { twoFactor } from "better-auth/plugins/two-factor";

export const auth = betterAuth({
  // ... existing config
  plugins: [
    nextCookies(),
    twoFactor({
      issuer: "KonkosYuk",
      otpLength: 6,
      period: 30,
    }),
  ],
});
```

**Require MFA for admin/staff:**

```typescript
// src/lib/api-auth.ts
export async function validateAdminRequest(req: NextRequest) {
  const session = await requireSession(["admin", "staff"]);

  // Require MFA for admin operations
  if (!session.user.twoFactorEnabled) {
    return NextResponse.json(
      {
        error:
          "MFA is required for admin access. Please enable 2FA in your profile.",
      },
      { status: 403 },
    );
  }

  // ... rest of validation
}
```

---

## Fix 7: Strengthen Security Headers (HIGH)

**File:** `next.config.ts`

**Issue:** Missing COOP/COEP headers and overly permissive CSP.

```typescript
// BEFORE
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        { key: "X-DNS-Prefetch-Control", value: "on" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        // Missing COOP/COEP
        // Missing X-Permitted-Cross-Domain-Policies
      ],
    },
  ]
}

// AFTER
async headers() {
  const isProd = process.env.NODE_ENV === "production"

  return [
    {
      source: "/(.*)",
      headers: [
        { key: "X-DNS-Prefetch-Control", value: "on" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
        { key: "X-Download-Options", value: "noopen" },
        {
          key: "Cross-Origin-Opener-Policy",
          value: "same-origin",
        },
        {
          key: "Cross-Origin-Embedder-Policy",
          value: "require-corp",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(self)",
        },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            // Remove unsafe-inline in production - use nonces or hashes
            isProd
              ? "script-src 'self' https://translate.google.com"
              : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://translate.google.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "img-src 'self' data: blob: https://*.uploadthing.com https://utfs.io https://res.cloudinary.com https://*.placehold.co https://via.placeholder.com https://images.unsplash.com https://cdn.jsdelivr.net",
            "font-src 'self' data: https://fonts.gstatic.com",
            "connect-src 'self' https://translate.google.com https://translate.googleapis.com https://nominatim.openstreetmap.org https://*.tile.openstreetmap.org https://tiles.openstreetmap.org https://tiles.stadiamaps.com https://basemaps.cartocdn.com https://*.cartocdn.com https://*.cartodb.com https://api.maptiler.com https://tiles.maptiler.com https://*.maptiler.com blob: data: ws: wss:",
            "frame-src 'self' https://translate.google.com",
            "worker-src 'self' blob:",
            "media-src 'self' blob:",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
            "manifest-src 'self'",
            isProd ? "upgrade-insecure-requests" : "",
          ].filter(Boolean).join("; "),
        },
      ],
    },
  ]
}
```

---

## Fix 8: Add Rate Limiting to Public Endpoints (MEDIUM)

**File:** Add rate limiting wrapper to public API routes

```typescript
// src/lib/with-rate-limit.ts - Add new limiter type
export const publicRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  key: "public",
});

// Apply to public routes
export function withPublicRateLimit(
  handler: (req: Request) => Promise<NextResponse>,
) {
  return async (req: Request): Promise<NextResponse> => {
    const deviceId = await getOrCreateDeviceId();
    const deviceName = await getDeviceName();

    const result = await publicRateLimit({ deviceId, deviceName });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(
              (result.resetAt.getTime() - Date.now()) / 1000,
            ).toString(),
          },
        },
      );
    }

    return handler(req);
  };
}
```

---

## Fix 9: Sanitize Error Messages in Production (HIGH)

**File:** `src/lib/api.ts`

```typescript
// BEFORE
if (error instanceof Error) {
  logError(error, context || "API_ERROR");
  if (error.message === "Unauthorized") return fail("Unauthorized", 401);
  if (error.message === "Forbidden") return fail("Forbidden", 403);
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : error.message;
  return fail(message, 500);
}

// AFTER
if (error instanceof Error) {
  logError(error, context || "API_ERROR");
  if (error.message === "Unauthorized") return fail("Unauthorized", 401);
  if (error.message === "Forbidden") return fail("Forbidden", 403);

  // In production, never expose internal error details
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : error.message;

  // Additionally, check if error contains sensitive patterns
  const sensitivePatterns = [
    /database/i,
    /query/i,
    /sql/i,
    /connection/i,
    /credential/i,
    /secret/i,
    /password/i,
    /token/i,
    /stack trace/i,
    /at\s+[\w.$]+/i,
  ];

  if (
    process.env.NODE_ENV === "production" &&
    sensitivePatterns.some((p) => p.test(error.message))
  ) {
    return fail("Internal server error", 500);
  }

  return fail(message, 500);
}
```

---

## Fix 10: Add Webhook IP Allowlisting (MEDIUM)

**File:** `src/app/api/webhooks/[provider]/route.ts`

```typescript
// Add IP allowlist for payment gateway webhooks
const ALLOWED_WEBHOOK_IPS: Record<string, string[]> = {
  doku: [
    "103.28.36.0/24",
    "103.28.37.0/24",
    // Add official Doku IP ranges
  ],
  ipaymu: [
    "103.28.36.0/24",
    // Add official iPaymu IP ranges
  ],
  nicepay: [
    "103.28.36.0/24",
    // Add official Nicepay IP ranges
  ],
};

function isIpAllowed(ip: string, allowedRanges: string[]): boolean {
  // Implement IP range checking logic
  // Use 'ip-range-check' library or similar
  return allowedRanges.some((range) => {
    const [rangeStart, rangeEnd] = range.split("/");
    // Implementation depends on library
    return true; // Placeholder
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const { provider } = await params;
  const allowedIps = ALLOWED_WEBHOOK_IPS[provider];

  if (allowedIps && !isIpAllowed(clientIp, allowedIps)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized IP" },
      { status: 403 },
    );
  }

  // ... rest of handler
}
```

---

## Fix 11: Implement Idle Session Timeout (MEDIUM)

**File:** `src/lib/auth.ts`

```typescript
export const auth = betterAuth({
  // ... existing config
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
    idleTimeout: 60 * 60 * 2, // 2 hours of inactivity = logout
  },
});
```

---

## Fix 12: Add Password Policy Enforcement (MEDIUM)

**File:** `src/lib/auth.ts`

```typescript
export const auth = betterAuth({
  // ... existing config
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    passwordRequirements: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
    },
  },
});
```

---

## Fix 13: Add Input Validation for Amount Fields (HIGH)

**File:** `src/lib/zod.ts`

```typescript
// Add validation for payment amounts
export const paymentAmountSchema = z.coerce
  .number()
  .positive("Jumlah pembayaran harus lebih dari 0")
  .multipleOf(1000, "Jumlah pembayaran harus kelipatan 1000")
  .max(100_000_000, "Jumlah pembayaran maksimal Rp 100.000.000");

// Add validation for withdrawal amounts
export const withdrawalAmountSchema = z.coerce
  .number()
  .positive("Jumlah penarikan harus lebih dari 0")
  .min(10000, "Minimum penarikan Rp 10.000")
  .max(100_000_000, "Maksimum penarikan Rp 100.000.000");
```

---

## Fix 14: Consistent requireSession Implementation (LOW)

**File:** Consolidate `requireSession` from `src/lib/api-auth.ts` and `src/lib/auth.ts`

**Recommendation:** Remove duplicate `requireSession` from `api-auth.ts` and import from `auth.ts`:

```typescript
// src/lib/api-auth.ts
import { requireSession } from "@/lib/auth"; // Import from single source of truth
```

---

## Fix 15: Add Security Headers for Static Assets (LOW)

**File:** `next.config.ts`

```typescript
async headers() {
  return [
    {
      source: "/(.*)",
      headers: [
        // ... existing headers
      ],
    },
    {
      source: "/sw.js",
      headers: [
        { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        { key: "X-Content-Type-Options", value: "nosniff" },
      ],
    },
  ]
}
```

---

## Fix 16: Payment Amount Tampering Protection (HIGH)

**File:** `src/app/api/webhooks/[provider]/route.ts` and webhook handler

```typescript
// In webhook handler, validate amount matches expected payment
const [payment] = await db
  .select()
  .from(payments)
  .where(eq(payments.id, paymentId))
  .limit(1);

if (!payment) return new Response("Payment not found", { status: 404 });

const expectedAmount = Number(payment.amount);
const receivedAmount = Number(normalized.amount);

// Allow small rounding differences but flag large discrepancies
if (Math.abs(expectedAmount - receivedAmount) > 100) {
  await db
    .update(webhookEvents)
    .set({
      processedAt: new Date(),
      details: {
        amountMismatch: true,
        expected: expectedAmount,
        received: receivedAmount,
      },
    })
    .where(eq(webhookEvents.id, event.id));

  return new Response("Amount mismatch - manual review required", {
    status: 400,
  });
}
```

---

## Fix 17: Add Request Logging for Security Events (MEDIUM)

**File:** `src/app/api/webhooks/[provider]/route.ts`

```typescript
import { logSecurityEvent } from "@/lib/logger";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const startTime = Date.now();
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  try {
    // ... existing handler

    logSecurityEvent("webhook_received", {
      provider,
      ip: clientIp,
      eventId: normalized.eventId,
      status: normalized.status,
      processingTime: Date.now() - startTime,
    });
  } catch (error) {
    logSecurityEvent("webhook_failed", {
      provider,
      ip: clientIp,
      error: error instanceof Error ? error.message : "Unknown",
      processingTime: Date.now() - startTime,
    });
    // ... existing error handling
  }
}
```

---

## Implementation Priority

### Phase 1 (Week 1) - Critical

1. Fix CSRF token httpOnly cookie (Fix 1)
2. Replace MD5 with HMAC-SHA256 for iPaymu (Fix 2)
3. Add rate limiting to webhooks (Fix 3)
4. Secure admin webhook reprocess (Fix 4)
5. Remove requireLocalEmailVerified: false (Fix 5)

### Phase 2 (Week 2) - High

6. Implement MFA (Fix 6)
7. Strengthen security headers (Fix 7)
8. Add rate limiting to public endpoints (Fix 8)
9. Sanitize error messages (Fix 9)
10. Add webhook IP allowlisting (Fix 10)

### Phase 3 (Week 3-4) - Medium/Low

11. Add idle session timeout (Fix 11)
12. Enforce password policy (Fix 12)
13. Add amount validation (Fix 13)
14. Consolidate requireSession (Fix 14)
15. Add security headers for static assets (Fix 15)
16. Payment amount tampering protection (Fix 16)
17. Add security event logging (Fix 17)

---

_End of Implementation Guide_
