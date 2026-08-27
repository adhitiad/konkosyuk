import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { redisHealth } from "@/lib/redis";
import { checkCloudinaryConnection } from "@/lib/cloudinary";
import { env } from "@/lib/env";
import {
  getDokuConfig,
  getNicepayConfig,
  getIpaymuConfig,
} from "@/lib/payments/config";
import { monitor } from "@/lib/monitoring";

export const dynamic = "force-dynamic";

async function checkDatabase() {
  const started = performance.now();
  try {
    await monitor("health.database", () =>
      db.execute(sql`SELECT 1`).then(() => undefined),
    );
    return {
      status: "healthy" as const,
      latency: Math.round(performance.now() - started),
    };
  } catch (error) {
    return {
      status: "down" as const,
      latency: Math.round(performance.now() - started),
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

async function checkRedis() {
  const started = performance.now();
  try {
    const result = await redisHealth();
    return {
      status: result.ok ? ("healthy" as const) : ("down" as const),
      latency: Math.round(performance.now() - started),
    };
  } catch (error) {
    return {
      status: "down" as const,
      latency: Math.round(performance.now() - started),
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

async function checkAuth() {
  const started = performance.now();
  try {
    await db.select().from(sql`information_schema.tables`).limit(1);
    return {
      status: "healthy" as const,
      latency: Math.round(performance.now() - started),
    };
  } catch (error) {
    return {
      status: "down" as const,
      latency: Math.round(performance.now() - started),
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

async function checkStorage() {
  const started = performance.now();
  const providers = await Promise.all([
    monitor("health.storage.cloudinary", async () => {
      if (
        !env.CLOUDINARY_CLOUD_NAME ||
        !env.CLOUDINARY_API_KEY ||
        !env.CLOUDINARY_API_SECRET
      ) {
        return { status: "not_configured" as const };
      }
      try {
        await checkCloudinaryConnection();
        return { status: "healthy" as const };
      } catch (error) {
        return {
          status: "down" as const,
          error: error instanceof Error ? error.message : "Connection failed",
        };
      }
    }),
  ]);

  const configured = providers.filter((p) => p.status !== "not_configured");
  const status = configured.some((p) => p.status === "down")
    ? "down"
    : "healthy";

  return {
    status,
    providers,
    latency: Math.round(performance.now() - started),
  };
}

async function checkPayments() {
  const started = performance.now();
  const [dokuConfig, nicepayConfig, ipaymuConfig] = await Promise.all([
    getDokuConfig(),
    getNicepayConfig(),
    getIpaymuConfig(),
  ]);

  async function probeGateway(name: string, baseUrl: string | undefined) {
    if (!baseUrl)
      return { name, status: "not_configured" as const, latency: 0 };
    const gatewayStarted = performance.now();
    try {
      const response = await fetch(baseUrl, {
        method: "HEAD",
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      const latency = Math.round(performance.now() - gatewayStarted);
      return {
        name,
        status:
          response.status < 500 ? ("healthy" as const) : ("degraded" as const),
        latency,
        httpStatus: response.status,
      };
    } catch (error) {
      const latency = Math.round(performance.now() - gatewayStarted);
      return {
        name,
        status: "down" as const,
        latency,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }

  const providers = await Promise.all([
    monitor("health.payment.doku", () =>
      probeGateway("Doku", String(dokuConfig.baseUrl ?? "")),
    ),
    monitor("health.payment.ipaymu", () =>
      probeGateway("iPaymu", String(ipaymuConfig.baseUrl ?? "")),
    ),
    monitor("health.payment.nicepay", () =>
      probeGateway("NicePay", String(nicepayConfig.baseUrl ?? "")),
    ),
  ]);

  const configured = providers.filter((p) => p.status !== "not_configured");
  const status = configured.some((p) => p.status === "down")
    ? "down"
    : configured.some((p) => p.status === "degraded")
      ? "degraded"
      : "healthy";

  return {
    status,
    providers,
    latency: Math.round(performance.now() - started),
  };
}

export async function GET() {
  const [database, redis, authCheck, storage, payments] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkAuth(),
    checkStorage(),
    checkPayments(),
  ]);

  const checks = {
    database,
    redis,
    auth: authCheck,
    storage,
    payments,
  };

  const configuredChecks = [
    database,
    redis,
    authCheck,
    storage,
    ...(storage.providers || []),
    ...(payments.providers || []),
  ].filter((check) => check.status !== "not_configured");

  const overallStatus = configuredChecks.some(
    (check) => check.status === "down",
  )
    ? "down"
    : configuredChecks.some((check) => check.status === "degraded")
      ? "degraded"
      : "healthy";

  const isProd = process.env.NODE_ENV === "production";

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      ...(isProd
        ? {}
        : {
            checks,
          }),
    },
    { status: overallStatus === "down" ? 503 : 200 },
  );
}
