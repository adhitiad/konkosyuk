import { getSharedRedisConnection } from "@/lib/redis";

const HEALTH_TIMEOUT_MS = 3000;

export type HealthCheckResult = {
  status: "healthy" | "unhealthy";
  timestamp: string;
  checks: Record<string, { status: "healthy" | "unhealthy"; message?: string }>;
};

export async function checkRedis(): Promise<{ status: "healthy" | "unhealthy"; message?: string }> {
  try {
    const redis = getSharedRedisConnection();
    const pingPromise = redis.ping();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Redis ping timeout")), HEALTH_TIMEOUT_MS),
    );

    await Promise.race([pingPromise, timeoutPromise]);
    return { status: "healthy" };
  } catch (error) {
    return { status: "unhealthy", message: (error as Error).message };
  }
}

export async function checkQueues(): Promise<{ status: "healthy" | "unhealthy"; message?: string }> {
  try {
    const redis = getSharedRedisConnection();
    const queueNames = [
      "cleanup-expired-bookings",
      "complete-expired-bookings",
      "saved-search-matcher",
      "update-area-counts",
      "process-expired-refunds",
      "referral-eligibility-sweep",
      "churn-prediction",
    ];

    let stuckQueues = 0;
    for (const queueName of queueNames) {
      const stalledKey = `bull:${queueName}:stalled`;
      const stalledCount = await redis.scard(stalledKey);
      if (stalledCount > 0) {
        stuckQueues++;
      }
    }

    if (stuckQueues > 0) {
      return { status: "unhealthy", message: `${stuckQueues} queue memiliki stalled jobs` };
    }
    return { status: "healthy" };
  } catch (error) {
    return { status: "unhealthy", message: (error as Error).message };
  }
}

export async function performHealthCheck(): Promise<HealthCheckResult> {
  const checks: Record<string, { status: "healthy" | "unhealthy"; message?: string }> = {};

  const [redis, queues] = await Promise.all([
    checkRedis(),
    checkQueues(),
  ]);

  checks.redis = redis;
  checks.queues = queues;

  const isHealthy = Object.values(checks).every((check) => check.status === "healthy");

  return {
    status: isHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    checks,
  };
}
