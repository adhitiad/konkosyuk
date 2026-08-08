import { z, ZodError } from 'zod'
import { logError } from '@/lib/logger'

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export function ok(data: unknown, status = 200) {
  return Response.json({ success: true, data }, { status })
}

export function fail(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status })
}

export function handleApiError(error: unknown, context?: string) {
  if (error instanceof ApiError) {
    logError(error, context || 'API_ERROR', { statusCode: error.statusCode })
    return fail(error.message, error.statusCode)
  }

  if (error instanceof ZodError) {
    const message = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
    logError(error, context || 'API_VALIDATION_ERROR', { issues: error.issues })
    return fail(message, 422)
  }

  if (error instanceof Error) {
    logError(error, context || 'API_ERROR')
    return fail(error.message, 500)
  }

  logError(new Error('Unknown error'), context || 'API_ERROR')
  return fail('Internal server error', 500)
}
