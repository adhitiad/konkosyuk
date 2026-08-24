/** Pendaftaran repeat job untuk menjadwalkan cron menggunakan BullMQ. */
import {
  cleanupExpiredBookingsQueue,
  completeExpiredBookingsQueue,
  savedSearchMatcherQueue,
  updateAreaCountsQueue,
  processExpiredRefundsQueue,
  referralEligibilitySweepQueue,
} from "@/lib/queue/queues";

import { logInfo } from "@/lib/logger";

export async function registerRepeatJobs() {
  await cleanupExpiredBookingsQueue.upsertJobScheduler(
    "repeat:cleanup-expired-bookings",
    { pattern: "0 * * * *" },
    {
      name: "cleanup-expired-bookings",
      data: {},
    },
  );

  logInfo("Repeat job terdaftar", {
    queue: "cleanup-expired-bookings",
    pattern: "0 * * * *",
  });

  await completeExpiredBookingsQueue.upsertJobScheduler(
    "repeat:complete-expired-bookings",
    { pattern: "0 2 * * *" },
    {
      name: "complete-expired-bookings",
      data: {},
    },
  );

  logInfo("Repeat job terdaftar", {
    queue: "complete-expired-bookings",
    pattern: "0 2 * * *",
  });

  await savedSearchMatcherQueue.upsertJobScheduler(
    "repeat:saved-search-matcher",
    { pattern: "0 3 * * *" },
    {
      name: "saved-search-matcher",
      data: {},
    },
  );

  logInfo("Repeat job terdaftar", {
    queue: "saved-search-matcher",
    pattern: "0 3 * * *",
  });

  await updateAreaCountsQueue.upsertJobScheduler(
    "repeat:update-area-counts",
    { pattern: "0 4 * * *" },
    {
      name: "update-area-counts",
      data: {},
    },
  );

  logInfo("Repeat job terdaftar", {
    queue: "update-area-counts",
    pattern: "0 4 * * *",
  });

  await processExpiredRefundsQueue.upsertJobScheduler(
    "repeat:process-expired-refunds",
    { pattern: "0 5 * * *" },
    {
      name: "process-expired-refunds",
      data: {},
    },
  );

  logInfo("Repeat job terdaftar", {
    queue: "process-expired-refunds",
    pattern: "0 5 * * *",
  });

  await referralEligibilitySweepQueue.upsertJobScheduler(
    "repeat:referral-eligibility-sweep",
    { pattern: "0 * * * *" },
    { name: "referral-eligibility-sweep", data: {} },
  );

  logInfo("Repeat job terdaftar", {
    queue: "referral-eligibility-sweep",
    pattern: "0 * * * *",
  });
}
