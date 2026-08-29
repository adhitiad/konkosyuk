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

function sanitizeMetadata(metadata?: Record<string, unknown>) {
  if (!metadata) return undefined;
  return sanitizeObject(metadata);
}

export function logError(
  error: unknown,
  context: string,
  metadata?: Record<string, unknown>,
) {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  const sanitized = sanitizeMetadata(metadata);
  console.error(`[ERROR] ${context}:`, errorObj.message, {
    stack: errorObj.stack,
    name: errorObj.name,
    ...sanitized,
  });
}

export function logInfo(message: string, metadata?: Record<string, unknown>) {
  const sanitized = sanitizeMetadata(metadata);
  console.info(`[INFO] ${message}`, sanitized);
}

export function logWarn(message: string, metadata?: Record<string, unknown>) {
  const sanitized = sanitizeMetadata(metadata);
  console.warn(`[WARN] ${message}`, sanitized);
}

export function logDebug(message: string, metadata?: Record<string, unknown>) {
  const sanitized = sanitizeMetadata(metadata);
  console.debug(`[DEBUG] ${message}`, sanitized);
}

export function logSecurityEvent(
  event: string,
  metadata?: Record<string, unknown>,
) {
  const sanitized = sanitizeMetadata(metadata);
  console.warn(`[SECURITY] ${event}`, sanitized);
}

export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string,
  requestId?: string,
) {
  console.info(
    `[API] ${method} ${path} ${statusCode} ${duration}ms`,
    sanitizeMetadata({ userId, requestId }),
  );
}

export function logDatabaseQuery(
  query: string,
  duration: number,
  rowsAffected?: number,
  requestId?: string,
) {
  console.debug(
    `[DB] Query: ${duration}ms`,
    sanitizeMetadata({ query, rowsAffected, requestId }),
  );
}

export function logPaymentEvent(
  event: string,
  provider: string,
  metadata?: Record<string, unknown>,
) {
  console.info(
    `[PAYMENT] ${event}`,
    sanitizeMetadata({ provider, ...metadata }),
  );
}

export function logAuthEvent(
  event: string,
  userId?: string,
  metadata?: Record<string, unknown>,
) {
  console.info(
    `[AUTH] ${event}`,
    sanitizeMetadata({ userId, ...metadata }),
  );
}
