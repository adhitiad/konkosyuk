import { db } from "@/db";
import { notificationSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  encryptNotificationValue,
  decryptNotificationValue,
} from "@/lib/notification-crypto";

export interface NotificationSettings {
  id: string;
  resendApiKey: string | null;
  resendFromEmail: string | null;
  metaAccessToken: string | null;
  metaPhoneNumberId: string | null;
  metaMaintenanceCreatedTemplate: string | null;
  metaMaintenanceUpdatedTemplate: string | null;
  createdAt: string;
  updatedAt: string;
}

const EMPTY_SETTINGS: NotificationSettings = {
  id: "",
  resendApiKey: null,
  resendFromEmail: null,
  metaAccessToken: null,
  metaPhoneNumberId: null,
  metaMaintenanceCreatedTemplate: null,
  metaMaintenanceUpdatedTemplate: null,
  createdAt: "",
  updatedAt: "",
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const [row] = await db.select().from(notificationSettings).limit(1);
  if (!row) return EMPTY_SETTINGS;

  return {
    id: row.id,
    resendApiKey: decryptNotificationValue(row.resendApiKey),
    resendFromEmail: row.resendFromEmail,
    metaAccessToken: decryptNotificationValue(row.metaAccessToken),
    metaPhoneNumberId: row.metaPhoneNumberId,
    metaMaintenanceCreatedTemplate: row.metaMaintenanceCreatedTemplate,
    metaMaintenanceUpdatedTemplate: row.metaMaintenanceUpdatedTemplate,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function upsertNotificationSettings(data: {
  resendApiKey?: string;
  resendFromEmail?: string;
  metaAccessToken?: string;
  metaPhoneNumberId?: string;
  metaMaintenanceCreatedTemplate?: string;
  metaMaintenanceUpdatedTemplate?: string;
}): Promise<NotificationSettings> {
  const existing = await getNotificationSettings();
  const existingId = existing.id;

  const values = {
    id: existingId || "00000000-0000-0000-0000-000000000001",
    resendApiKey:
      data.resendApiKey !== undefined
        ? JSON.stringify(encryptNotificationValue(data.resendApiKey))
        : existing.resendApiKey,
    resendFromEmail: data.resendFromEmail ?? existing.resendFromEmail,
    metaAccessToken:
      data.metaAccessToken !== undefined
        ? JSON.stringify(encryptNotificationValue(data.metaAccessToken))
        : existing.metaAccessToken,
    metaPhoneNumberId: data.metaPhoneNumberId ?? existing.metaPhoneNumberId,
    metaMaintenanceCreatedTemplate:
      data.metaMaintenanceCreatedTemplate ??
      existing.metaMaintenanceCreatedTemplate,
    metaMaintenanceUpdatedTemplate:
      data.metaMaintenanceUpdatedTemplate ??
      existing.metaMaintenanceUpdatedTemplate,
    updatedAt: new Date(),
  };

  const [row] = await db
    .insert(notificationSettings)
    .values(values)
    .onConflictDoUpdate({
      target: notificationSettings.id,
      set: values,
    })
    .returning();

  return {
    id: row.id,
    resendApiKey: decryptNotificationValue(row.resendApiKey),
    resendFromEmail: row.resendFromEmail,
    metaAccessToken: decryptNotificationValue(row.metaAccessToken),
    metaPhoneNumberId: row.metaPhoneNumberId,
    metaMaintenanceCreatedTemplate: row.metaMaintenanceCreatedTemplate,
    metaMaintenanceUpdatedTemplate: row.metaMaintenanceUpdatedTemplate,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
