import * as Sentry from "@sentry/nextjs";

export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_SENTRY_DSN
  ) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}

export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  context?: Record<string, unknown>,
) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_SENTRY_DSN
  ) {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  }
}

export function setUser(user: { id: string; email?: string } | null) {
  if (user) {
    Sentry.setUser(user);
  } else {
    Sentry.setUser(null);
  }
}

export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>,
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: "info",
  });
}
