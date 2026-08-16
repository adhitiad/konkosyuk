import { logError, logInfo } from "@/lib/logger";
import { MetricPool, type PooledMetric } from "@/lib/perf";

const metrics = new Map<string, PooledMetric>();
const MAX_METRICS = 100;

export function recordMetric(name: string, latencyMs: number, error?: unknown) {
  if (!metrics.has(name) && metrics.size >= MAX_METRICS) return;
  let current = metrics.get(name);
  if (!current) {
    current = MetricPool.acquire();
    metrics.set(name, current);
  }
  current.requests += 1;
  current.totalLatencyMs += latencyMs;
  current.lastLatencyMs = latencyMs;
  if (error) {
    current.errors += 1;
    current.lastErrorAt = new Date().toISOString();
    current.lastError = error instanceof Error ? error.message : String(error);
  }
}

export interface MetricSnapshot {
  requests: number;
  errors: number;
  totalLatencyMs: number;
  lastLatencyMs: number;
  lastErrorAt?: string;
  lastError?: string;
  averageLatencyMs: number;
  errorRate: number;
}

export function getMetricsSnapshot(): Record<string, MetricSnapshot> {
  const snapshot: Record<string, MetricSnapshot> = {};
  for (const [name, metric] of metrics) {
    snapshot[name] = {
      requests: metric.requests,
      errors: metric.errors,
      totalLatencyMs: metric.totalLatencyMs,
      lastLatencyMs: metric.lastLatencyMs,
      lastErrorAt: metric.lastErrorAt,
      lastError: metric.lastError,
      averageLatencyMs: metric.requests
        ? Math.round(metric.totalLatencyMs / metric.requests)
        : 0,
      errorRate: metric.requests
        ? Number((metric.errors / metric.requests).toFixed(4))
        : 0,
    };
  }
  return snapshot;
}

export async function monitor<T>(
  name: string,
  operation: () => Promise<T>,
): Promise<T> {
  const started = performance.now();
  try {
    const result = await operation();
    recordMetric(name, Math.round(performance.now() - started));
    return result;
  } catch (error) {
    recordMetric(name, Math.round(performance.now() - started), error);
    logError(error, name);
    throw error;
  }
}

export function logRequestMetric(name: string, latencyMs: number) {
  recordMetric(name, latencyMs);
  logInfo("request_metric", { name, latencyMs });
}
