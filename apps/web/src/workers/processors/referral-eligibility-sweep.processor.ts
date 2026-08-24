import { Job } from "bullmq";

import { sweepEligibleReferrals } from "@/lib/referrals/verification";
import { logInfo, logError } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

export async function processReferralEligibilitySweep(job: Job) {
  logInfo("Job referral-eligibility-sweep dimulai", { jobId: job.id });

  try {
    const processedCount = await sweepEligibleReferrals();

    logInfo("Job referral-eligibility-sweep selesai", {
      jobId: job.id,
      processedCount,
    });

    return { processedCount };
  } catch (error) {
    logError(error, "Job referral-eligibility-sweep gagal", { jobId: job.id });
    Sentry.captureException(error, {
      tags: { queue: "referral-eligibility-sweep", jobId: job.id ?? undefined },
    });
    throw error;
  }
}
