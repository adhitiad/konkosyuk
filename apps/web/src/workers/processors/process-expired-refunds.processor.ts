/** Processor untuk job proses refund otomatis untuk booking yang expired. */
import { Job } from "bullmq";

import { processExpiredPaymentRefunds } from "@/actions/cron/process-expired-refunds";
import { logInfo, logError } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

export async function processExpiredPaymentRefundsJob(job: Job) {
  logInfo("Job process-expired-refunds dimulai", { jobId: job.id });

  try {
    const result = await processExpiredPaymentRefunds();

    logInfo("Job process-expired-refunds selesai", {
      jobId: job.id,
      processedCount: result.processedCount,
    });

    return result;
  } catch (error) {
    logError(error, "Job process-expired-refunds gagal", { jobId: job.id });
    Sentry.captureException(error, {
      tags: { queue: "process-expired-refunds", jobId: job.id ?? undefined },
    });
    throw error;
  }
}
