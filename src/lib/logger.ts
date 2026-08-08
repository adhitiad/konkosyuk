import winston from 'winston'

export interface LogMetadata {
  [key: string]: unknown
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : ''
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${stack ? `\n${stack}` : ''}${metaStr ? `\n${metaStr}` : ''}`
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
          const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : ''
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
    ...metadata,
  })
}

export function logInfo(message: string, metadata?: LogMetadata) {
  logger.info(message, metadata)
}

export function logWarn(message: string, metadata?: LogMetadata) {
  logger.warn(message, metadata)
}

export function logDebug(message: string, metadata?: LogMetadata) {
  logger.debug(message, metadata)
}

export default logger
