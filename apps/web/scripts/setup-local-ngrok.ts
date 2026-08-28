import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { Client, HTTPMethods } from "@upstash/qstash";

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const NGROK_API_URL = process.env.NGROK_API_URL || "http://127.0.0.1:4040/api/tunnels";
const WORKER_PATH = "/api/qstash/worker";
const DLQ_PATH = "/api/qstash/dlq";

if (!QSTASH_TOKEN) {
  console.error("❌ QSTASH_TOKEN environment variable is required");
  process.exit(1);
}

const client = new Client({
  token: QSTASH_TOKEN,
  baseUrl: process.env.QSTASH_URL,
});

interface NgrokTunnel {
  public_url: string;
  proto: string;
  config: {
    addr: string;
  };
}

async function getNgrokUrl(): Promise<string> {
  try {
    const response = await fetch(NGROK_API_URL);
    if (!response.ok) {
      throw new Error(`Ngrok API returned ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as { tunnels: NgrokTunnel[] };
    const httpsTunnel = data.tunnels.find((tunnel) => tunnel.proto === "https");

    if (!httpsTunnel) {
      throw new Error("No HTTPS tunnel found in ngrok");
    }

    return httpsTunnel.public_url;
  } catch (error) {
    console.error("❌ Failed to get ngrok URL:", error);
    throw error;
  }
}

function getExistingScheduleUrl(schedule: { destination: string }): string | null {
  const dest = schedule.destination;
  if (dest.includes(WORKER_PATH) || dest.includes(DLQ_PATH)) {
    return dest;
  }
  return null;
}

function buildNewUrl(ngrokUrl: string, path: string): string {
  return `${ngrokUrl}${path}`;
}

async function updateQStashUrls(ngrokUrl: string) {
  console.log(`🔍 Current ngrok URL: ${ngrokUrl}\n`);

  const schedules = await client.schedules.list();
  const workerSchedules = schedules.filter((s) => s.destination?.includes(WORKER_PATH));
  const dlqSchedules = schedules.filter((s) => s.destination?.includes(DLQ_PATH));

  let updated = false;

  for (const schedule of [...workerSchedules, ...dlqSchedules]) {
    const currentUrl = getExistingScheduleUrl(schedule);
    if (!currentUrl) continue;

    const path = currentUrl.includes(WORKER_PATH) ? WORKER_PATH : DLQ_PATH;
    const newUrl = buildNewUrl(ngrokUrl, path);

    if (currentUrl === newUrl) {
      console.log(`⏭️  Schedule ${schedule.scheduleId} already points to ${newUrl}`);
      continue;
    }

    try {
      await client.schedules.create({
        scheduleId: schedule.scheduleId,
        destination: newUrl,
        cron: schedule.cron,
        body: schedule.body,
        method: (schedule.method || "POST") as HTTPMethods,
        retries: schedule.retries ?? 3,
        label: schedule.label,
      });
      console.log(`✅ Updated schedule ${schedule.scheduleId}: ${currentUrl} → ${newUrl}`);
      updated = true;
    } catch (error) {
      console.error(`❌ Failed to update schedule ${schedule.scheduleId}:`, error);
    }
  }

  try {
    await fetch("https://qstash.upstash.io/v2/dlq/config", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${QSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: buildNewUrl(ngrokUrl, DLQ_PATH),
      }),
    });
    console.log(`✅ DLQ URL updated to ${buildNewUrl(ngrokUrl, DLQ_PATH)}`);
    updated = true;
  } catch (error) {
    console.error("❌ Failed to update DLQ URL:", error);
  }

  if (updated) {
    console.log(`\n🎉 QStash webhooks updated to point to: ${ngrokUrl}`);
  } else {
    console.log(`\n✅ QStash webhooks already pointing to: ${ngrokUrl}`);
  }
}

async function main() {
  console.log("🚀 Setting up QStash local ngrok URLs...\n");

  const ngrokUrl = await getNgrokUrl();
  await updateQStashUrls(ngrokUrl);

  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Setup failed:", error);
  process.exit(1);
});