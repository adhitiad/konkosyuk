import { config } from "dotenv";
import cron from "node-cron";
import { cleanupExpiredBookings } from "../lib/cron/cleanup-bookings";
import { completeExpiredBookings } from "../lib/cron/complete-bookings";
import { matchAndNotifySavedSearches } from "../lib/cron/saved-search-matcher";
import { updateAreaCounts } from "../lib/cron/update-area-counts";

config();

const CLEANUP_SCHEDULE = process.env.CLEANUP_CRON_SCHEDULE || "0 * * * *";
const COMPLETE_SCHEDULE = process.env.COMPLETE_CRON_SCHEDULE || "0 2 * * *";
const SAVED_SEARCH_SCHEDULE = process.env.SAVED_SEARCH_CRON_SCHEDULE || "0 3 * * *";
const UPDATE_AREA_COUNTS_SCHEDULE = process.env.UPDATE_AREA_COUNTS_CRON_SCHEDULE || "0 4 * * *";

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

async function runSavedSearchMatcher() {
  console.log(
    `[${new Date().toISOString()}] Running saved search matcher...`,
  );

  try {
    const result = await matchAndNotifySavedSearches();

    console.log("Saved search matcher completed:", result);
  } catch (error) {
    console.error("Saved search matcher failed:", error);
  }
}

async function runUpdateAreaCounts() {
  console.log(
    `[${new Date().toISOString()}] Running update area counts...`,
  );

  try {
    await updateAreaCounts();
  } catch (error) {
    console.error("Update area counts failed:", error);
  }
}

console.log(`Starting cron jobs`);
console.log(`Cleanup schedule: ${CLEANUP_SCHEDULE}`);
console.log(`Complete schedule: ${COMPLETE_SCHEDULE}`);
console.log(`Saved search schedule: ${SAVED_SEARCH_SCHEDULE}`);
console.log(`Update area counts schedule: ${UPDATE_AREA_COUNTS_SCHEDULE}`);
console.log("Waiting for next execution...");

cron.schedule(CLEANUP_SCHEDULE, runCleanup);
cron.schedule(COMPLETE_SCHEDULE, runComplete);
cron.schedule(SAVED_SEARCH_SCHEDULE, runSavedSearchMatcher);
cron.schedule(UPDATE_AREA_COUNTS_SCHEDULE, runUpdateAreaCounts);

runCleanup();
runComplete();
runSavedSearchMatcher();
runUpdateAreaCounts();
