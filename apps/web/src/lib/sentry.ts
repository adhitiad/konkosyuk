import * as Sentry from "@sentry/nextjs";

export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
) {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_SENTRY_DSN
  ) {
    Sentry.withScope((scope) => {
      if (context?.requestId) {
        scope.setTag("requestId", String(context.requestId));
      }
      if (context?.userId) {
        scope.setUser({ id: String(context.userId) });
      }
      if (context?.route) {
        scope.setTag("route", String(context.route));
      }
      if (context?.method) {
        scope.setTag("method", String(context.method));
      }
      Sentry.captureException(error, { extra: context });
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
    Sentry.withScope((scope) => {
      if (context?.requestId) {
        scope.setTag("requestId", String(context.requestId));
      }
      if (context?.userId) {
        scope.setUser({ id: String(context.userId) });
      }
      Sentry.captureMessage(message, {
        level,
        extra: context,
      });
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

export function startDatabaseSpan(
  operation: string,
  query: string,
) {
  return Sentry.startSpan(
    {
      name: `db: ${operation}`,
      op: "db.query",
      attributes: {
        "db.system": "postgresql",
        "db.operation": operation,
        "db.query": query,
      },
    },
    () => {},
  );
}

export function startExternalApiSpan(
  name: string,
  url: string,
) {
  return Sentry.startSpan(
    {
      name: `external: ${name}`,
      op: "http.client",
      attributes: {
        "http.url": url,
        "server.address": new URL(url).hostname,
      },
    },
    () => {},
  );
}

export function startGrpcSpan(
  method: string,
  service: string,
) {
  return Sentry.startSpan(
    {
      name: `grpc: ${service}/${method}`,
      op: "grpc.call",
      attributes: {
        "rpc.system": "grpc",
        "rpc.service": service,
        "rpc.method": method,
      },
    },
    () => {},
  );
}
