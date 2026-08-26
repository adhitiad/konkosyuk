/** Processor untuk job cleanup booking yang sudah expired. */
import { Job } from "bullmq";

import { cleanupExpiredBookings } from "@/lib/cron/cleanup-bookings";
import { logInfo, logError } from "@konkosyuk/shared/lib/logger";
import * as Sentry from "@sentry/node";

export async function processCleanupExpiredBookings(job: Job) {
  logInfo("Job cleanup-expired-bookings dimulai", { jobId: job.id });

  try {
    const result = await cleanupExpiredBookings();

    logInfo("Job cleanup-expired-bookings selesai", {
      jobId: job.id,
      cancelledCount: result.cancelledCount,
      unitReleasedCount: result.unitReleasedCount,
    });

    return result;
  } catch (error) {
    logError(error, "Job cleanup-expired-bookings gagal", { jobId: job.id });
    Sentry.captureException(error, {
      tags: { queue: "cleanup-expired-bookings", jobId: job.id ?? undefined },
    });
    throw error;
  }
}
