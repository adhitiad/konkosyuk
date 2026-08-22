/** Processor untuk job memperbarui jumlah properti per area. */
import { Job } from "bullmq";

import { updateAreaCounts } from "@/lib/cron/update-area-counts";
import { logInfo, logError } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

export async function processUpdateAreaCounts(job: Job) {
  logInfo("Job update-area-counts dimulai", { jobId: job.id });

  try {
    await updateAreaCounts();

    logInfo("Job update-area-counts selesai", { jobId: job.id });
  } catch (error) {
    logError(error, "Job update-area-counts gagal", { jobId: job.id });
    Sentry.captureException(error, {
      tags: { queue: "update-area-counts", jobId: job.id ?? undefined },
    });
    throw error;
  }
}
