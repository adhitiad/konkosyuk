import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { Client } from "@upstash/qstash";

const CRON_SECRET = process.env.CRON_SECRET;
const NODE_ENV = process.env.NODE_ENV || "development";

if (!CRON_SECRET && NODE_ENV === "production") {
  throw new Error("CRON_SECRET environment variable is required in production");
}

if (!process.env.QSTASH_TOKEN) {
  throw new Error("QSTASH_TOKEN environment variable is required");
}

const client = new Client({
  token: process.env.QSTASH_TOKEN,
  baseUrl: process.env.QSTASH_URL,
});

interface CronJobConfig {
  name: string;
  destination: string;
  cron: string;
  body: Record<string, unknown>;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  retries?: number;
  label?: string;
}

const CRON_JOBS: CronJobConfig[] = [
  {
    name: "SYNC_ANALYTICS",
    destination: "/api/qstash/worker",
    cron: "0 0 * * *",
    body: { type: "SYNC_ANALYTICS" },
    method: "POST",
    retries: 3,
    label: "konkosyuk-cron-sync-analytics",
  },
  {
    name: "CLEANUP_EXPIRED_BOOKINGS",
    destination: "/api/qstash/worker",
    cron: "0 * * * *",
    body: { type: "CLEANUP_EXPIRED_BOOKINGS" },
    method: "POST",
    retries: 3,
    label: "konkosyuk-cron-cleanup-expired-bookings",
  },
];

async function setupCrons() {
  console.log("🚀 Setting up QStash cron jobs...\n");

  let existingSchedules;
  try {
    const result = await client.schedules.list();
    existingSchedules = result;
  } catch (error) {
    console.error("❌ Failed to fetch existing schedules:", error);
    process.exit(1);
  }

  const scheduleMap = new Map<string, { scheduleId: string; cron: string }>();
  for (const schedule of existingSchedules) {
    const allLabels = schedule.labels || (schedule.label ? [schedule.label] : []);
    for (const lbl of allLabels) {
      scheduleMap.set(lbl, { scheduleId: schedule.scheduleId, cron: schedule.cron });
    }
  }

  for (const job of CRON_JOBS) {
    const label = job.label || `konkosyuk-cron-${job.name.toLowerCase()}`;
    const existing = scheduleMap.get(label);

    if (existing) {
      console.log(`🔄 Updating existing cron job: ${job.name}`);
      try {
        await client.schedules.create({
          scheduleId: existing.scheduleId,
          destination: job.destination,
          cron: job.cron,
          body: JSON.stringify(job.body),
          method: job.method || "POST",
          retries: job.retries ?? 3,
          label,
        });
        console.log(`   ✅ Updated: ${job.name} (${job.cron})\n`);
      } catch (error) {
        console.error(`   ❌ Failed to update ${job.name}:`, error);
      }
    } else {
      console.log(`✨ Creating new cron job: ${job.name}`);
      try {
        await client.schedules.create({
          destination: job.destination,
          cron: job.cron,
          body: JSON.stringify(job.body),
          method: job.method || "POST",
          retries: job.retries ?? 3,
          label,
        });
        console.log(`   ✅ Created: ${job.name} (${job.cron})\n`);
      } catch (error) {
        console.error(`   ❌ Failed to create ${job.name}:`, error);
      }
    }
  }

  console.log("📋 Current QStash schedules:");
  const updatedSchedules = await client.schedules.list();
  for (const schedule of updatedSchedules) {
    const labels = schedule.labels?.join(", ") || schedule.label || "no-label";
    console.log(`   - ${schedule.scheduleId}: ${schedule.cron} → ${schedule.destination} [${labels}]`);
  }

  console.log("\n✅ Cron job setup completed!");
}

setupCrons().catch((error) => {
  console.error("❌ Setup failed:", error);
  process.exit(1);
});