"use server";

import { db } from "@/db";
import { webhookEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit-log";
import { getPaymentProvider } from "@/lib/payments";
import { handleWebhookRequest } from "@/lib/payments/webhook";
import type { WebhookContext } from "@/lib/payments/types";

const reprocessWebhookSchema = z.object({
  webhookId: z.string().uuid(),
});

export type ReprocessWebhookState = {
  success?: boolean;
  error?: string;
};

export async function reprocessWebhookAction(
  prevState: ReprocessWebhookState | undefined,
  formData: FormData,
): Promise<ReprocessWebhookState> {
  try {
    const validated = reprocessWebhookSchema.parse({
      webhookId: formData.get("webhookId"),
    });

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const [webhook] = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.id, validated.webhookId))
      .limit(1);

    if (!webhook) {
      return { error: "Webhook tidak ditemukan", success: false };
    }

    if (webhook.processedAt) {
      return { error: "Webhook sudah diproses sebelumnya", success: false };
    }

    if (!webhook.signatureValid) {
      return {
        error:
          "Tidak dapat memproses ulang webhook dengan signature tidak valid. Selidiki secara manual.",
        success: false,
      };
    }

    const adapter = getPaymentProvider(webhook.provider);
    if (!adapter) {
      return {
        error: "Provider tidak dikenal untuk webhook ini",
        success: false,
      };
    }

    const payload = webhook.payload as Record<string, unknown>;
    const rawBody = JSON.stringify(payload);
    const headersObj = (payload.headers as Record<string, string>) ?? {};
    const ctx: WebhookContext = {
      provider: webhook.provider as "ipaymu" | "doku" | "nicepay",
      headers: new Headers(headersObj),
      rawBody,
      eventId: webhook.eventId,
    };

    const isValid = await adapter.verifyWebhookSignature(ctx);
    if (!isValid) {
      return {
        error: "Verifikasi signature webhook gagal saat pemrosesan ulang",
        success: false,
      };
    }

    await handleWebhookRequest(webhook.provider, ctx);

    await db
      .update(webhookEvents)
      .set({
        processedAt: new Date(),
        signatureValid: true,
      })
      .where(eq(webhookEvents.id, validated.webhookId));

    await createAuditLog({
      action: "update",
      targetType: "webhook",
      targetId: validated.webhookId,
      adminId: session.user.id,
      details: {
        provider: webhook.provider,
        eventId: webhook.eventId,
        action: "reprocess",
      },
    });

    return { success: true };
  } catch {
    return { error: "Gagal memproses ulang webhook", success: false };
  }
}
