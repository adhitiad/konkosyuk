import { Client } from "@upstash/qstash";
import { trackUsage } from "@/lib/usage-tracker";
import type {
  QStashJobType,
  QStashJobPayload,
  PublishToQStashOptions,
} from "@/types/infrastructure";

export type { QStashJobType, QStashJobPayload, PublishToQStashOptions };

export async function publishToQStash(
  job: QStashJobPayload,
  options?: PublishToQStashOptions,
): Promise<{ messageId: string }> {
  const client = getQStashClient();

  const targetUrl =
    options?.url || process.env.QSTASH_WORKER_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/qstash/worker`;

  const response = await client.publishJSON({
    url: targetUrl,
    body: job,
    method: "POST",
    retries: options?.retries ?? 3,
    retryDelay: options?.retryDelay ?? "pow(2, retried)",
    label: options?.label ?? job.type,
  });

  void trackUsage("qstash", "publish");

  return {
    messageId: response.messageId,
  };
}

export async function publishNotificationJob(
  userId: string,
  notificationType: string,
  data: Record<string, unknown>,
): Promise<{ messageId: string }> {
  return publishToQStash(
    {
      type: "SEND_NOTIFICATION",
      payload: {
        userId,
        notificationType,
        data,
      },
    },
    {
      label: `notification-${notificationType}`,
    },
  );
}

export async function publishAnalyticsSyncJob(
  data: Record<string, unknown>,
): Promise<{ messageId: string }> {
  return publishToQStash(
    {
      type: "SYNC_ANALYTICS",
      payload: data,
    },
    {
      label: "analytics-sync",
    },
  );
}

let qstashClient: Client | null = null;

export function getQStashClient(): Client {
  if (!qstashClient) {
    qstashClient = new Client({
      token: process.env.QSTASH_TOKEN,
      baseUrl: process.env.QSTASH_URL,
    });
  }
  return qstashClient;
}