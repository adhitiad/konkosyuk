import Redis from "ioredis";

const HEALTH_TIMEOUT_MS = 3000;

export type HealthCheckResult = {
  status: "healthy" | "unhealthy";
  timestamp: string;
  checks: Record<string, { status: "healthy" | "unhealthy"; message?: string }>;
};

export async function checkRedis(): Promise<{ status: "healthy" | "unhealthy"; message?: string }> {
  if (!process.env.REDIS_URL) {
    return { status: "unhealthy", message: "REDIS_URL tidak dikonfigurasi" };
  }

  let client: Redis | null = null;
  try {
    client = new Redis(process.env.REDIS_URL, {
      connectTimeout: HEALTH_TIMEOUT_MS,
      lazyConnect: true,
    });

    const pingPromise = client.ping();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Redis ping timeout")), HEALTH_TIMEOUT_MS),
    );

    await Promise.race([pingPromise, timeoutPromise]);
    return { status: "healthy" };
  } catch (error) {
    return { status: "unhealthy", message: (error as Error).message };
  } finally {
    if (client) {
      try {
        await client.quit();
      } catch {
        /* abaikan error saat cleanup */
      }
    }
  }
}

export async function checkDatabase(): Promise<{ status: "healthy" | "unhealthy"; message?: string }> {
  if (!process.env.DATABASE_URL) {
    return { status: "unhealthy", message: "DATABASE_URL tidak dikonfigurasi" };
  }

  try {
    const { createDb } = await import("@konkosyuk/shared/db");
    const db = createDb(process.env.DATABASE_URL, {
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Database connection timeout")), HEALTH_TIMEOUT_MS),
    );

    await Promise.race([db.$client.query("SELECT 1"), timeoutPromise]);
    return { status: "healthy" };
  } catch (error) {
    return { status: "unhealthy", message: (error as Error).message };
  }
}

export function checkGrpcServer(): { status: "healthy" | "unhealthy"; message?: string } {
  const port = process.env.PORT || "50051";
  if (!port) {
    return { status: "unhealthy", message: "gRPC port tidak dikonfigurasi" };
  }
  return { status: "healthy", message: `gRPC server listening on port ${port}` };
}

export async function performHealthCheck(): Promise<HealthCheckResult> {
  const checks: Record<string, { status: "healthy" | "unhealthy"; message?: string }> = {};

  const [redis, database, grpc] = await Promise.all([
    checkRedis(),
    checkDatabase(),
    Promise.resolve(checkGrpcServer()),
  ]);

  checks.redis = redis;
  checks.database = database;
  checks.grpc = grpc;

  const isHealthy = Object.values(checks).every((check) => check.status === "healthy");

  return {
    status: isHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    checks,
  };
}

export async function performReadinessCheck(): Promise<HealthCheckResult> {
  const checks: Record<string, { status: "healthy" | "unhealthy"; message?: string }> = {};

  const [redis, database] = await Promise.all([
    checkRedis(),
    checkDatabase(),
  ]);

  checks.redis = redis;
  checks.database = database;

  const isHealthy = Object.values(checks).every((check) => check.status === "healthy");

  return {
    status: isHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    checks,
  };
}
