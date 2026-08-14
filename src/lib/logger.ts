import pino from 'pino'

export interface LogMetadata {
  [key: string]: unknown
}

const SENSITIVE_KEYS = [
  'password',
  'secret',
  'apiKey',
  'api_key',
  'token',
  'accessToken',
  'refreshToken',
  'clientSecret',
  'merchantKey',
  'webhookSecret',
  'privateKey',
  'authorization',
  'cookie',
  'sessionId',
  'ktpNumber',
  'ktpImageUrl',
  'balance',
]

function sanitizeValue(key: string, value: unknown): unknown {
  if (typeof value === 'string') {
    if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase()))) {
      if (value.length <= 4) return '***'
      return `${value.slice(0, 4)}${'*'.repeat(Math.min(value.length - 4, 8))}`
    }
  }

  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.map((item) => sanitizeValue(key, item))
    }
    return sanitizeObject(value as Record<string, unknown>)
  }

  return value
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(key, value)
  }
  return sanitized
}

function sanitizeMetadata(metadata?: LogMetadata): LogMetadata | undefined {
  if (!metadata) return undefined
  return sanitizeObject(metadata)
}

const isProduction = process.env.NODE_ENV === 'production'

export const logger = pino(
  {
    level: isProduction ? 'info' : 'debug',
    formatters: {
      log: (log) => {
        const sanitizedMeta = sanitizeObject(log as Record<string, unknown>)
        return {
          timestamp: new Date().toISOString(),
          level: log.level,
          message: log.msg,
          ...sanitizedMeta,
        }
      },
    },
    transport: isProduction
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
  }
)

export function logError(error: unknown, context: string, metadata?: LogMetadata) {
  const errorObj = error instanceof Error ? error : new Error(String(error))
  
  logger.error(
    {
      context,
      error: {
        message: errorObj.message,
        stack: errorObj.stack,
        name: errorObj.name,
      },
      ...sanitizeMetadata(metadata),
    },
    errorObj.message
  )
}

export function logInfo(message: string, metadata?: LogMetadata) {
  logger.info({ ...sanitizeMetadata(metadata) }, message)
}

export function logWarn(message: string, metadata?: LogMetadata) {
  logger.warn({ ...sanitizeMetadata(metadata) }, message)
}

export function logDebug(message: string, metadata?: LogMetadata) {
  logger.debug({ ...sanitizeMetadata(metadata) }, message)
}

export function logSecurityEvent(event: string, metadata?: LogMetadata) {
  logger.warn(
    {
      category: 'security',
      event,
      ...sanitizeMetadata(metadata),
    },
    `[SECURITY] ${event}`
  )
}

export function logApiRequest(method: string, path: string, statusCode: number, duration: number, userId?: string) {
  logger.info(
    {
      category: 'api',
      method,
      path,
      statusCode,
      duration,
      userId,
    },
    `${method} ${path} ${statusCode} ${duration}ms`
  )
}

export function logDatabaseQuery(query: string, duration: number, rowsAffected?: number) {
  logger.debug(
    {
      category: 'database',
      query,
      duration,
      rowsAffected,
    },
    `DB Query: ${duration}ms`
  )
}

export function logPaymentEvent(event: string, provider: string, bookingId?: string, metadata?: LogMetadata) {
  logger.info(
    {
      category: 'payment',
      event,
      provider,
      bookingId,
      ...sanitizeMetadata(metadata),
    },
    `[PAYMENT] ${event}`
  )
}

export function logAuthEvent(event: string, userId?: string, metadata?: LogMetadata) {
  logger.info(
    {
      category: 'auth',
      event,
      userId,
      ...sanitizeMetadata(metadata),
    },
    `[AUTH] ${event}`
  )
}

export default logger
