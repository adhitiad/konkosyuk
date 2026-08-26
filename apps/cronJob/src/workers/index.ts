/** Entry point worker BullMQ untuk Render background worker. */
import { registerRepeatJobs } from "@/workers/scheduler";
import { startWorkers, stopWorkers } from "@/workers/main.worker";

import { logInfo, logError } from "@konkosyuk/shared/lib/logger";

async function bootstrap() {
  logInfo("Memulai BullMQ worker...");

  await registerRepeatJobs();

  startWorkers();

  logInfo("Worker started successfully");

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
