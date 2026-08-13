import { logError, logInfo } from '@/lib/logger'

type Metric = {
  requests: number
  errors: number
  totalLatencyMs: number
  lastLatencyMs: number
  lastErrorAt?: string
  lastError?: string
}

const metrics = new Map<string, Metric>()
const MAX_METRICS = 100

export function recordMetric(name: string, latencyMs: number, error?: unknown) {
  if (!metrics.has(name) && metrics.size >= MAX_METRICS) return
  const current = metrics.get(name) ?? { requests: 0, errors: 0, totalLatencyMs: 0, lastLatencyMs: 0 }
  current.requests += 1
  current.totalLatencyMs += latencyMs
  current.lastLatencyMs = latencyMs
  if (error) {
    current.errors += 1
    current.lastErrorAt = new Date().toISOString()
    current.lastError = error instanceof Error ? error.message : String(error)
  }
  metrics.set(name, current)
}

export function getMetricsSnapshot() {
  return Object.fromEntries(Array.from(metrics.entries()).map(([name, metric]) => [name, {
    ...metric,
    averageLatencyMs: metric.requests ? Math.round(metric.totalLatencyMs / metric.requests) : 0,
    errorRate: metric.requests ? Number((metric.errors / metric.requests).toFixed(4)) : 0,
  }]))
}

export async function monitor<T>(name: string, operation: () => Promise<T>): Promise<T> {
  const started = performance.now()
  try {
    const result = await operation()
    recordMetric(name, Math.round(performance.now() - started))
    return result
  } catch (error) {
    recordMetric(name, Math.round(performance.now() - started), error)
    logError(error, name)
    throw error
  }
}

export function logRequestMetric(name: string, latencyMs: number) {
  recordMetric(name, latencyMs)
  logInfo('request_metric', { name, latencyMs })
}
