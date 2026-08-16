/**
 * Performance utilities barrel export.
 *
 * @example
 * import { MetricPool, sharedEncoder, encodeSSE } from "@/lib/perf";
 */

// Object Pooling
export {
  ObjectPool,
  MetricPool,
  RateLimitResultPool,
  CookieMapPool,
  type PoolOptions,
  type PooledMetric,
  type PooledRateLimitResult,
  type PooledCookieMap,
} from "./object-pool";

// Buffer Pool & TypedArray
export {
  sharedEncoder,
  sharedDecoder,
  acquireBuffer,
  releaseBuffer,
  getBufferPoolStats,
  encodeSSE,
  encodeSSEPing,
  CsvBuffer,
  timingSafeCompare,
} from "./buffer-pool";
