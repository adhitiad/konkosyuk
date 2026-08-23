import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { checkCloudinaryConnection } from "@/lib/cloudinary";
import { monitor, recordMetric } from "@/lib/monitoring";

export const dynamic = "force-dynamic";

async function checkProvider(
  name: string,
  check: () => Promise<void>,
  configured: boolean,
) {
  if (!configured)
    return { name, status: "not_configured" as const, latency: 0 };
  const started = performance.now();
  try {
    await check();
    return {
      name,
      status: "healthy" as const,
      latency: Math.round(performance.now() - started),
    };
  } catch (error) {
    recordMetric(
      `health.storage.${name.toLowerCase()}`,
      Math.round(performance.now() - started),
      error,
    );
    return {
      name,
      status: "down" as const,
      latency: Math.round(performance.now() - started),
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

export async function GET() {
  const storageProviders = await Promise.all([
    monitor("health.storage.cloudinary", () =>
      checkProvider(
        "Cloudinary",
        checkCloudinaryConnection,
        Boolean(
          env.CLOUDINARY_CLOUD_NAME &&
          env.CLOUDINARY_API_KEY &&
          env.CLOUDINARY_API_SECRET,
        ),
      ),
    ),
  ]);
  const configured = storageProviders.filter(
    (provider) => provider.status !== "not_configured",
  );
  const status = configured.some((provider) => provider.status === "down")
    ? "down"
    : "healthy";

  return NextResponse.json(
    {
      status,
      providers: storageProviders,
      message: configured.length
        ? "Storage connectivity checked"
        : "No storage provider configured",
    },
    { status: status === "down" ? 503 : 200 },
  );
}
