/** Processor untuk job mencocokan dan mengirim notifikasi saved search. */
import { Job } from "bullmq";

import { matchAndNotifySavedSearches } from "@/lib/cron/saved-search-matcher";
import { logInfo, logError } from "@konkosyuk/shared/lib/logger";
import * as Sentry from "@sentry/node";

export async function processSavedSearchMatcher(job: Job) {
  logInfo("Job saved-search-matcher dimulai", { jobId: job.id });

  try {
    const result = await matchAndNotifySavedSearches();

    logInfo("Job saved-search-matcher selesai", {
      jobId: job.id,
      matched: result.matched,
      notified: result.notified,
      errors: result.errors,
    });

    return result;
  } catch (error) {
    logError(error, "Job saved-search-matcher gagal", { jobId: job.id });
    Sentry.captureException(error, {
      tags: { queue: "saved-search-matcher", jobId: job.id ?? undefined },
    });
    throw error;
  }
}
