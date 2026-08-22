/** Processor untuk job melengkapi booking yang sudah expired. */
import { Job } from "bullmq";

import { completeExpiredBookings } from "@/lib/cron/complete-bookings";
import { logInfo, logError } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

export async function processCompleteExpiredBookings(job: Job) {
  logInfo("Job complete-expired-bookings dimulai", { jobId: job.id });

  try {
    const result = await completeExpiredBookings();

    logInfo("Job complete-expired-bookings selesai", {
      jobId: job.id,
      completedCount: result.completedCount,
      inspectionCreatedCount: result.inspectionCreatedCount,
      unitReleasedCount: result.unitReleasedCount,
    });

    return result;
  } catch (error) {
    logError(error, "Job complete-expired-bookings gagal", { jobId: job.id });
    Sentry.captureException(error, {
      tags: { queue: "complete-expired-bookings", jobId: job.id ?? undefined },
    });
    throw error;
  }
}
