import * as Sentry from "@sentry/nextjs";

const SENSITIVE_KEYS = [
  "password",
  "secret",
  "apiKey",
  "api_key",
  "token",
  "accessToken",
  "refreshToken",
  "clientSecret",
  "merchantKey",
  "webhookSecret",
  "privateKey",
  "authorization",
  "cookie",
  "sessionId",
  "ktpNumber",
  "ktpImageUrl",
  "balance",
  "otp",
  "cardNumber",
  "cvv",
];

function sanitizeValue(key: string, value: unknown): unknown {
  if (typeof value === "string") {
    if (
      SENSITIVE_KEYS.some((sensitive) =>
        key.toLowerCase().includes(sensitive.toLowerCase()),
      )
    ) {
      if (value.length <= 4) return "***";
      return `${value.slice(0, 4)}${"*".repeat(Math.min(value.length - 4, 8))}`;
    }
  }

  if (typeof value === "object" && value !== null) {
    if (Array.isArray(value)) {
      return value.map((item) => sanitizeValue(key, item));
    }
    return sanitizeObject(value as Record<string, unknown>);
  }

  return value;
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(key, value);
  }
  return sanitized;
}

function scrubEvent(event: Record<string, unknown>) {
  if (event.extra) {
    event.extra = sanitizeObject(event.extra as Record<string, unknown>);
  }
  const request = (event as Record<string, unknown>).request as Record<string, unknown> | undefined;
  if (request) {
    if (request.data) {
      const requestData = request.data;
      event.request = {
        ...request,
        data: sanitizeObject(
          typeof requestData === "string" ? JSON.parse(requestData) : requestData,
        ),
      };
    }
    if (request.headers) {
      event.request = {
        ...(event as Record<string, unknown>).request,
        headers: sanitizeObject(request.headers as Record<string, unknown>),
      };
    }
  }
  return event;
}

export async function register() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend: scrubEvent,
    beforeSendTransaction: scrubEvent,
  });
}
