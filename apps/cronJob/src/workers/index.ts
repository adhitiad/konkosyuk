/** Entry point worker BullMQ untuk Render background worker. */
import { registerRepeatJobs } from "@/workers/scheduler";
import { startWorkers, stopWorkers } from "@/workers/main.worker";

import { logInfo, logError } from "@konkosyuk/shared/lib/logger";
import { registry } from "@/lib/metrics.js";
import { performHealthCheck } from "@/health.js";

async function bootstrap() {
  logInfo("Memulai BullMQ worker...");

  await registerRepeatJobs();

  startWorkers();

  logInfo("Worker started successfully");

  const METRICS_PORT = process.env.METRICS_PORT || "9092";

  if (typeof Bun !== "undefined") {
    const metricsServer = Bun.serve({
      port: parseInt(METRICS_PORT),
      fetch: async (req) => {
        const url = new URL(req.url);
        if (url.pathname === "/metrics") {
          const metrics = await registry.metrics();
          return new Response(metrics, {
            headers: { "Content-Type": "text/plain; version=0.0.4" },
          });
        }

        if (url.pathname === "/health") {
          const health = await performHealthCheck();
          return new Response(JSON.stringify(health), {
            headers: { "Content-Type": "application/json" },
            status: health.status === "healthy" ? 200 : 503,
          });
        }

        return new Response("Not Found", { status: 404 });
      },
    });
    logInfo("Metrics and health server started", { service: "cronJob", port: metricsServer.port });
  }

  const shutdown = async (signal: string) => {
    logInfo(`Menerima sinyal ${signal}, memulai graceful shutdown...`);

    try {
      await stopWorkers();
      logInfo("Graceful shutdown berhasil");
      process.exit(0);
    } catch (error) {
      logError(error, "Graceful shutdown gagal");
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

bootstrap().catch((error) => {
  logError(error, "Worker gagal dijalankan");
  process.exit(1);
});
