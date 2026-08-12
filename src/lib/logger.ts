import winston from 'winston'

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

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      const sanitizedMeta = sanitizeObject(meta as Record<string, unknown>)
      const metaStr = Object.keys(sanitizedMeta).length > 0 ? JSON.stringify(sanitizedMeta) : ''
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${stack ? `\n${stack}` : ''}${metaStr ? `\n${metaStr}` : ''}`
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
          const sanitizedMeta = sanitizeObject(meta as Record<string, unknown>)
          const metaStr = Object.keys(sanitizedMeta).length > 0 ? JSON.stringify(sanitizedMeta) : ''
          return `[${timestamp}] ${level.toUpperCase()}: ${message}${stack ? `\n${stack}` : ''}${metaStr ? `\n${metaStr}` : ''}`
        })
      ),
    }),
  ],
})

export function logError(error: unknown, context: string, metadata?: LogMetadata) {
  const errorObj = error instanceof Error ? error : new Error(String(error))
  
  logger.error(`[${context}] ${errorObj.message}`, {
    stack: errorObj.stack,
    name: errorObj.name,
    ...sanitizeMetadata(metadata),
  })
}

export function logInfo(message: string, metadata?: LogMetadata) {
  logger.info(message, sanitizeMetadata(metadata))
}

export function logWarn(message: string, metadata?: LogMetadata) {
  logger.warn(message, sanitizeMetadata(metadata))
}

export function logDebug(message: string, metadata?: LogMetadata) {
  logger.debug(message, sanitizeMetadata(metadata))
}

export default logger
