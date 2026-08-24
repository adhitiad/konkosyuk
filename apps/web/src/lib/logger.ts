import { createLogger, format, transports } from "winston";

export interface LogMetadata {
  [key: string]: unknown;
}

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

function sanitizeMetadata(metadata?: LogMetadata): LogMetadata | undefined {
  if (!metadata) return undefined;
  return sanitizeObject(metadata);
}

const isProduction = process.env.NODE_ENV === "production";

const { combine, timestamp, printf, colorize, json } = format;

const sanitizeFormat = format((info) => {
  const sanitized = { ...info };
  for (const [key, value] of Object.entries(sanitized)) {
    if (key === "level" || key === "message" || key === "timestamp") {
      continue;
    }
    sanitized[key] = sanitizeValue(key, value);
  }
  return sanitized as any; // eslint-disable-line @typescript-eslint/no-explicit-any
});

const devLogFormat = combine(
  colorize(),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  printf(({ timestamp, level, message, ...metadata }) => {
    const metaEntries = Object.entries(metadata).filter(
      ([k]) => k !== "Symbol(level)" && k !== "Symbol(message)",
    );
    let msg = `${timestamp} [${level}]: ${message}`;
    if (metaEntries.length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  }),
);

export const logger = createLogger({
  level: isProduction ? "info" : "debug",
  format: combine(timestamp(), sanitizeFormat()),
  transports: [
    new transports.Console({
      format: isProduction ? json() : devLogFormat,
    }),
  ],
});

export function logError(
  error: unknown,
  context: string,
  metadata?: LogMetadata,
) {
  const errorObj = error instanceof Error ? error : new Error(String(error));

  logger.error({
    message: errorObj.message,
    context,
    error: {
      message: errorObj.message,
      stack: errorObj.stack,
      name: errorObj.name,
    },
    ...sanitizeMetadata(metadata),
  });
}

export function logInfo(message: string, metadata?: LogMetadata) {
  logger.info({
    message,
    ...sanitizeMetadata(metadata),
  });
}

export function logWarn(message: string, metadata?: LogMetadata) {
  logger.warn({
    message,
    ...sanitizeMetadata(metadata),
  });
}

export function logDebug(message: string, metadata?: LogMetadata) {
  logger.debug({
    message,
    ...sanitizeMetadata(metadata),
  });
}

export function logSecurityEvent(event: string, metadata?: LogMetadata) {
  logger.warn({
    message: `[SECURITY] ${event}`,
    category: "security",
    event,
    ...sanitizeMetadata(metadata),
  });
}

export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string,
) {
  logger.info({
    message: `${method} ${path} ${statusCode} ${duration}ms`,
    category: "api",
    method,
    path,
    statusCode,
    duration,
    userId,
  });
}

export function logDatabaseQuery(
  query: string,
  duration: number,
  rowsAffected?: number,
) {
  logger.debug({
    message: `DB Query: ${duration}ms`,
    category: "database",
    query,
    duration,
    rowsAffected,
  });
}

export function logPaymentEvent(
  event: string,
  provider: string,
  bookingId?: string,
  metadata?: LogMetadata,
) {
  logger.info({
    message: `[PAYMENT] ${event}`,
    category: "payment",
    event,
    provider,
    bookingId,
    ...sanitizeMetadata(metadata),
  });
}

export function logAuthEvent(
  event: string,
  userId?: string,
  metadata?: LogMetadata,
) {
  logger.info({
    message: `[AUTH] ${event}`,
    category: "auth",
    event,
    userId,
    ...sanitizeMetadata(metadata),
  });
}

export default logger;
