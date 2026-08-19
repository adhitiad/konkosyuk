import { config } from "dotenv";
import cron from "node-cron";
import { cleanupExpiredBookings } from "../lib/cron/cleanup-bookings";
import { completeExpiredBookings } from "../lib/cron/complete-bookings";

config();

const CLEANUP_SCHEDULE = process.env.CLEANUP_CRON_SCHEDULE || "0 * * * *";
const COMPLETE_SCHEDULE = process.env.COMPLETE_CRON_SCHEDULE || "0 2 * * *";

async function runCleanup() {
  console.log(
    `[${new Date().toISOString()}] Running expired bookings cleanup...`,
  );

  try {
    const result = await cleanupExpiredBookings();

    console.log("Cleanup completed:", {
      cancelledCount: result.cancelledCount,
      unitReleasedCount: result.unitReleasedCount,
      cancelledBookings: result.cancelledBookings.map((b) => b.id),
    });
  } catch (error) {
    console.error("Cleanup failed:", error);
  }
}

async function runComplete() {
  console.log(
    `[${new Date().toISOString()}] Running expired bookings completion...`,
  );

  try {
    const result = await completeExpiredBookings();

    console.log("Complete bookings completed:", {
      completedCount: result.completedCount,
      inspectionCreatedCount: result.inspectionCreatedCount,
      unitReleasedCount: result.unitReleasedCount,
      completedBookings: result.completedBookings.map((b) => b.id),
    });
  } catch (error) {
    console.error("Complete bookings failed:", error);
  }
}

console.log(`Starting cron jobs`);
console.log(`Cleanup schedule: ${CLEANUP_SCHEDULE}`);
console.log(`Complete schedule: ${COMPLETE_SCHEDULE}`);
console.log("Waiting for next execution...");

cron.schedule(CLEANUP_SCHEDULE, runCleanup);
cron.schedule(COMPLETE_SCHEDULE, runComplete);

runCleanup();
runComplete();
