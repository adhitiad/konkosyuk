import { Resend } from "resend";
import webpush from "web-push";
import { createDb } from "@konkosyuk/shared/db";
import {
  notifications,
  pushSubscriptions,
  userNotificationPreferences,
  notificationSettings,
} from "@konkosyuk/shared/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { logError, logWarn } from "@/lib/logger";
import { notificationType } from "@konkosyuk/shared/db/schema";
import type {
  NotificationCategory,
  NotificationPriority,
  NotificationEvent,
  ChannelPreferences,
  UserPreferences,
  NotificationSettings,
  DispatchResponse,
  EmailTemplateVariables,
} from "@/types/notification";

export type {
  NotificationCategory,
  NotificationPriority,
  NotificationEvent,
  ChannelPreferences,
  UserPreferences,
  NotificationSettings,
  DispatchResponse,
  EmailTemplateVariables,
};

const db = createDb(process.env.DATABASE_URL!, {
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@konkosyuk.app",
    vapidPublicKey,
    vapidPrivateKey,
  );
}

const DEFAULT_PREFERENCES: Record<string, ChannelPreferences> = {
  booking_created: { inApp: true, email: true, push: true },
  booking_approved: { inApp: true, email: true, push: true },
  booking_rejected: { inApp: true, email: true, push: true },
  booking_completed: { inApp: true, email: false, push: true },
  booking_cancelled: { inApp: true, email: true, push: false },
  payment_dp_paid: { inApp: true, email: false, push: true },
  payment_full_paid: { inApp: true, email: true, push: true },
  payment_failed: { inApp: true, email: true, push: true },
  payment_refunded: { inApp: true, email: true, push: true },
  maintenance_created: { inApp: true, email: true, push: true },
  maintenance_updated: { inApp: true, email: true, push: true },
  maintenance_resolved: { inApp: true, email: false, push: true },
  inspection_created: { inApp: true, email: false, push: true },
  inspection_completed: { inApp: true, email: true, push: true },
  inspection_disputed: { inApp: true, email: true, push: true },
  chat_message: { inApp: true, email: false, push: true },
  review_received: { inApp: true, email: false, push: false },
  booking_reminder_24h: { inApp: true, email: true, push: true },
  booking_reminder_1h: { inApp: true, email: false, push: true },
  pricing_alert: { inApp: true, email: false, push: true },
  referral_created: { inApp: true, email: true, push: false },
  referral_verifying: { inApp: true, email: true, push: true },
  referral_eligible: { inApp: true, email: true, push: true },
  referral_failed: { inApp: true, email: true, push: true },
  referral_completed: { inApp: true, email: true, push: true },
  referral_voucher_converted: { inApp: true, email: true, push: true },
  referral_offset_applied: { inApp: true, email: true, push: true },
  referral_reward_earned: { inApp: true, email: true, push: true },
  group_booking_invite: { inApp: true, email: true, push: true },
  group_booking_updated: { inApp: true, email: false, push: true },
  system: { inApp: true, email: false, push: false },
};

async function getResendClient() {
  const settings = await getNotificationSettings();
  const apiKey = settings.resendApiKey || process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

async function getFromEmail() {
  const settings = await getNotificationSettings();
  return (
    settings.resendFromEmail ||
    process.env.RESEND_FROM_EMAIL ||
    "KonkosYuk <onboarding@resend.dev>"
  );
}

async function getUserPrefs(userId: string): Promise<UserPreferences> {
  const [prefs] = await db
    .select()
    .from(userNotificationPreferences)
    .where(eq(userNotificationPreferences.userId, userId))
    .limit(1);

  if (!prefs) {
    return {
      preferences: { ...DEFAULT_PREFERENCES },
      emailDigest: "immediate",
      timezone: "Asia/Jakarta",
    };
  }

  return {
    preferences: (prefs.preferences as Record<string, ChannelPreferences>) || {
      ...DEFAULT_PREFERENCES,
    },
    emailDigest: (prefs.emailDigest as UserPreferences["emailDigest"]) || "immediate",
    quietHoursStart: prefs.quietHoursStart,
    quietHoursEnd: prefs.quietHoursEnd,
    timezone: prefs.timezone || "Asia/Jakarta",
  };
}

async function sendEmail(to: string, subject: string, html: string) {
  const client = await getResendClient();
  const from = await getFromEmail();
  if (!client) {
    logWarn("RESEND_API_KEY belum dikonfigurasi, email dilewati", { to, subject });
    return false;
  }

  try {
    const result = await client.emails.send({
      from,
      to,
      subject,
      html,
    });
    return result.error === undefined;
  } catch (error) {
    logError(error, "Gagal mengirim email via Resend", { to, subject });
    return false;
  }
}

async function sendPush(userId: string, title: string, message: string) {
  try {
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (subscriptions.length === 0) {
      return false;
    }

    const payload = JSON.stringify({ title, message, icon: "/icon-192.png" });

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload,
          );
        } catch (error: unknown) {
          if (error && typeof error === "object" && "statusCode" in error) {
            const statusCode = (error as { statusCode?: number }).statusCode;
            if (statusCode === 410) {
              await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
            }
          }
        }
      }),
    );

    return true;
  } catch (error) {
    logError(error, "Gagal mengirim push notification", { userId, title });
    return false;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const [settings] = await db.select().from(notificationSettings).limit(1);

  if (!settings) {
    return {
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
  }

  return {
    id: settings.id,
    resendApiKey: settings.resendApiKey,
    resendFromEmail: settings.resendFromEmail,
    metaAccessToken: settings.metaAccessToken,
    metaPhoneNumberId: settings.metaPhoneNumberId,
    metaMaintenanceCreatedTemplate: settings.metaMaintenanceCreatedTemplate,
    metaMaintenanceUpdatedTemplate: settings.metaMaintenanceUpdatedTemplate,
    createdAt: settings.createdAt.toISOString(),
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export async function updateNotificationSettings(
  data: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  const [existing] = await db.select().from(notificationSettings).limit(1);

  if (!existing) {
    const [created] = await db.insert(notificationSettings).values({
      resendApiKey: data.resendApiKey ?? null,
      resendFromEmail: data.resendFromEmail ?? null,
      metaAccessToken: data.metaAccessToken ?? null,
      metaPhoneNumberId: data.metaPhoneNumberId ?? null,
      metaMaintenanceCreatedTemplate: data.metaMaintenanceCreatedTemplate ?? null,
      metaMaintenanceUpdatedTemplate: data.metaMaintenanceUpdatedTemplate ?? null,
    }).returning();
    return {
      id: created.id,
      resendApiKey: created.resendApiKey,
      resendFromEmail: created.resendFromEmail,
      metaAccessToken: created.metaAccessToken,
      metaPhoneNumberId: created.metaPhoneNumberId,
      metaMaintenanceCreatedTemplate: created.metaMaintenanceCreatedTemplate,
      metaMaintenanceUpdatedTemplate: created.metaMaintenanceUpdatedTemplate,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  const [updated] = await db
    .update(notificationSettings)
    .set({
      resendApiKey: data.resendApiKey ?? existing.resendApiKey,
      resendFromEmail: data.resendFromEmail ?? existing.resendFromEmail,
      metaAccessToken: data.metaAccessToken ?? existing.metaAccessToken,
      metaPhoneNumberId: data.metaPhoneNumberId ?? existing.metaPhoneNumberId,
      metaMaintenanceCreatedTemplate:
        data.metaMaintenanceCreatedTemplate ?? existing.metaMaintenanceCreatedTemplate,
      metaMaintenanceUpdatedTemplate:
        data.metaMaintenanceUpdatedTemplate ?? existing.metaMaintenanceUpdatedTemplate,
      updatedAt: new Date(),
    })
    .where(eq(notificationSettings.id, existing.id))
    .returning();

  return {
    id: updated.id,
    resendApiKey: updated.resendApiKey,
    resendFromEmail: updated.resendFromEmail,
    metaAccessToken: updated.metaAccessToken,
    metaPhoneNumberId: updated.metaPhoneNumberId,
    metaMaintenanceCreatedTemplate: updated.metaMaintenanceCreatedTemplate,
    metaMaintenanceUpdatedTemplate: updated.metaMaintenanceUpdatedTemplate,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function getUserPreferences(
  userId: string,
): Promise<UserPreferences> {
  return getUserPrefs(userId);
}

export async function updateUserPreferences(
  userId: string,
  updates: Partial<
    Pick<
      UserPreferences,
      | "preferences"
      | "emailDigest"
      | "quietHoursStart"
      | "quietHoursEnd"
      | "timezone"
    >
  >,
): Promise<UserPreferences> {
  const existing = await db
    .select()
    .from(userNotificationPreferences)
    .where(eq(userNotificationPreferences.userId, userId))
    .limit(1);

  const current = existing[0] || {
    preferences: { ...DEFAULT_PREFERENCES },
    emailDigest: "immediate",
    timezone: "Asia/Jakarta",
  };

  const merged: UserPreferences = {
    preferences:
      updates.preferences && Object.keys(updates.preferences).length > 0
        ? { ...(current.preferences as Record<string, ChannelPreferences>), ...updates.preferences }
        : (current.preferences as Record<string, ChannelPreferences>),
    emailDigest: updates.emailDigest || current.emailDigest || "immediate",
    quietHoursStart: updates.quietHoursStart ?? current.quietHoursStart,
    quietHoursEnd: updates.quietHoursEnd ?? current.quietHoursEnd,
    timezone: updates.timezone || current.timezone || "Asia/Jakarta",
  };

  if (existing.length === 0) {
    await db.insert(userNotificationPreferences).values({
      userId,
      preferences: merged.preferences,
      emailDigest: merged.emailDigest,
      quietHoursStart: merged.quietHoursStart,
      quietHoursEnd: merged.quietHoursEnd,
      timezone: merged.timezone,
    });
  } else {
    await db
      .update(userNotificationPreferences)
      .set({
        preferences: merged.preferences,
        emailDigest: merged.emailDigest,
        quietHoursStart: merged.quietHoursStart,
        quietHoursEnd: merged.quietHoursEnd,
        timezone: merged.timezone,
        updatedAt: new Date(),
      })
      .where(eq(userNotificationPreferences.userId, userId));
  }

  return merged;
}

export async function createNotification(
  userId: string,
  type: typeof notificationType[number],
  title: string,
  message: string,
  referenceId?: string,
): Promise<void> {
  await db.insert(notifications).values({
    userId,
    type: type as unknown as typeof notificationType[number],
    title,
    message,
    referenceId: referenceId ? sql`${referenceId}::uuid` : undefined,
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return Number(result[0]?.count || 0);
}

export async function markAsRead(notificationId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, notificationId));
}

export async function dispatchNotification(
  event: NotificationEvent,
): Promise<void> {
  const prefs = await getUserPrefs(event.userId);
  const channelPrefs = prefs.preferences[event.type] || {
    inApp: true,
    email: false,
    push: false,
  };

  if (channelPrefs.inApp) {
    try {
      await db.insert(notifications).values({
        userId: event.userId,
        type: event.type as unknown as typeof notificationType[number],
        title: event.title,
        message: event.message,
        referenceId: event.referenceId ? sql`${event.referenceId}::uuid` : undefined,
      });
    } catch (error) {
      logError(error, "Gagal membuat notifikasi in-app", { event });
    }
  }

  if (channelPrefs.email) {
    const emailTo = event.metadata?.email;
    if (emailTo) {
      const html = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">${escapeHtml(event.title)}</h2>
          <p>${escapeHtml(event.message)}</p>
          ${event.actionUrl ? `<a href="${escapeHtml(event.actionUrl)}" style="color: #2563eb;">${escapeHtml(event.actionLabel || "Lihat Detail")}</a>` : ""}
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">Email ini dikirim secara otomatis oleh sistem KonkosYuk.</p>
        </div>
      `;
      await sendEmail(emailTo, event.title, html);
    }
  }

  if (channelPrefs.push) {
    await sendPush(event.userId, event.title, event.message);
  }
}

export async function dispatchBookingReminder(
  userId: string,
  bookingId: string,
  propertyName: string,
  unitName: string,
  startDate: Date,
  reminderType: "24h" | "1h",
): Promise<void> {
  const type =
    reminderType === "24h" ? "booking_reminder_24h" : "booking_reminder_1h";
  const title =
    reminderType === "24h" ? "Booking Dimulai Besok" : "Booking Dimulai Segera";
  const message = `Booking Anda untuk ${propertyName} - ${unitName} akan dimulai pada ${startDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}.`;

  await dispatchNotification({
    userId,
    type,
    category: "booking",
    priority: reminderType === "1h" ? "high" : "normal",
    title,
    message,
    actionUrl: "/dashboard/bookings",
    referenceId: bookingId,
    referenceType: "booking",
  });
}

export async function dispatchPricingAlert(
  userId: string,
  propertyId: string,
  propertyName: string,
  alertMessage: string,
): Promise<void> {
  await dispatchNotification({
    userId,
    type: "pricing_alert",
    category: "system",
    priority: "normal",
    title: `Pricing Alert: ${propertyName}`,
    message: alertMessage,
    actionUrl: `/properties/${propertyId}`,
    referenceId: propertyId,
    referenceType: "property",
  });
}

export async function dispatchReferralReward(
  userId: string,
  rewardAmount: number,
  referralCode: string,
): Promise<void> {
  await dispatchNotification({
    userId,
    type: "referral_reward_earned",
    category: "system",
    priority: "normal",
    title: "Referral Reward Diterima",
    message: `Anda mendapatkan reward Rp ${rewardAmount.toLocaleString("id-ID")} dari kode referral ${referralCode}.`,
    actionUrl: "/dashboard/referrals",
  });
}

export async function dispatchReferralStatusUpdate(
  userId: string,
  referralCode: string,
  status: "verifying" | "eligible" | "failed" | "completed",
  meta?: Record<string, unknown>,
): Promise<void> {
  const titles: Record<string, string> = {
    verifying: "Referral Sedang Diverifikasi",
    eligible: "Referral Layak Cair",
    failed: "Referral Gagal",
    completed: "Referral Selesai",
  };
  const messages: Record<string, string> = {
    verifying: `Referral ${referralCode} sedang dalam masa verifikasi 5 hari tanpa refund.`,
    eligible: `Referral ${referralCode} lolos verifikasi dan layak dicairkan.`,
    failed: `Referral ${referralCode} gagal karena refund/pembatalan/dispute.`,
    completed: `Referral ${referralCode} telah selesai dan dana telah masuk saldo.`,
  };

  await dispatchNotification({
    userId,
    type: `referral_${status}`,
    category: "system",
    priority: status === "eligible" ? "high" : "normal",
    title: titles[status] || "Update Referral",
    message: messages[status] || `Status referral ${referralCode} diperbarui.`,
    actionUrl: "/dashboard/referrals",
    metadata: meta as Record<string, string>,
  });
}

export async function dispatchReferralVoucherConverted(
  userId: string,
  referralCode: string,
  voucherCode: string,
): Promise<void> {
  await dispatchNotification({
    userId,
    type: "referral_voucher_converted",
    category: "system",
    priority: "normal",
    title: "Voucher Referral Aktif",
    message: `Saldo referral ${referralCode} berhasil dikonversi menjadi voucher ${voucherCode}.`,
    actionUrl: "/dashboard/referrals",
  });
}

export async function dispatchReferralOffsetApplied(
  userId: string,
  referralCode: string,
): Promise<void> {
  await dispatchNotification({
    userId,
    type: "referral_offset_applied",
    category: "system",
    priority: "normal",
    title: "Offset Tagihan Referral",
    message: `Saldo referral ${referralCode} berhasil dipotong dari tagihan sewa Anda.`,
    actionUrl: "/dashboard/bookings",
  });
}

export async function dispatchGroupBookingInvite(
  userId: string,
  groupId: string,
  groupName: string,
  inviterName: string,
): Promise<void> {
  await dispatchNotification({
    userId,
    type: "group_booking_invite",
    category: "booking",
    priority: "normal",
    title: "Undangan Group Booking",
    message: `${inviterName} mengundang Anda ke group booking "${groupName}".`,
    actionUrl: `/group-bookings/${groupId}`,
    referenceId: groupId,
    referenceType: "group_booking",
  });
}

export async function dispatchGroupBookingUpdated(
  userId: string,
  groupId: string,
  groupName: string,
  updateMessage: string,
): Promise<void> {
  await dispatchNotification({
    userId,
    type: "group_booking_updated",
    category: "booking",
    priority: "normal",
    title: `Group Booking Updated: ${groupName}`,
    message: updateMessage,
    actionUrl: `/group-bookings/${groupId}`,
    referenceId: groupId,
    referenceType: "group_booking",
  });
}

export function getDefaultPreferences(): Record<string, ChannelPreferences> {
  return { ...DEFAULT_PREFERENCES };
}

export async function sendWebPushNotification(
  userId: string,
  title: string,
  message: string,
): Promise<void> {
  await sendPush(userId, title, message);
}

export async function getNotificationSettingsDirect(): Promise<NotificationSettings> {
  return getNotificationSettings();
}

export async function upsertNotificationSettings(
  data: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  return updateNotificationSettings(data);
}

export function encryptNotificationValue(_plaintext: string): string {
  return _plaintext;
}

export function decryptNotificationValue(value: unknown): string | null {
  if (!value || typeof value !== "string") {
    return null;
  }
  return value;
}

export async function sendMaintenanceReportCreatedEmail(
  userId: string,
  to: string,
  recipientName: string,
  propertyName: string,
  category: string,
  description: string,
): Promise<void> {
  await dispatchNotification({
    userId,
    type: "maintenance_created",
    category: "maintenance",
    priority: "normal",
    title: "Laporan Masalah Baru",
    message: `Ada laporan "${category}" di properti ${propertyName}`,
    metadata: {
      email: to,
      recipientName,
      propertyName,
      category,
      description,
    },
  });
}

export async function sendMaintenanceReportUpdatedEmail(
  userId: string,
  to: string,
  recipientName: string,
  status: string,
  resolutionNote?: string | null,
): Promise<void> {
  await dispatchNotification({
    userId,
    type: "maintenance_updated",
    category: "maintenance",
    priority: "normal",
    title: "Status Laporan Masalah Diperbarui",
    message: `Status laporan Anda berubah menjadi ${status}`,
    metadata: {
      email: to,
      recipientName,
      status,
      resolutionNote: resolutionNote || "",
    },
  });
}

export async function sendApprovalEmail(
  userId: string,
  tenantEmail: string,
  tenantName: string,
  propertyName: string,
  unitName: string,
  dpAmount: number,
  invoiceUrl: string,
): Promise<void> {
  await dispatchNotification({
    userId,
    type: "booking_approved",
    category: "booking",
    priority: "high",
    title: "Permintaan Sewa Anda Disetujui",
    message: `Permintaan sewa Anda untuk ${propertyName} - ${unitName} telah disetujui`,
    metadata: {
      tenantEmail,
      tenantName,
      propertyName,
      unitName,
      dpAmount: String(dpAmount),
      invoiceUrl: invoiceUrl,
    },
  });
}

export async function sendBookingRequestEmail(
  userId: string,
  ownerEmail: string,
  ownerName: string,
  tenantName: string,
  propertyName: string,
  unitName: string,
  bookingUrl: string,
): Promise<void> {
  await dispatchNotification({
    userId,
    type: "booking_created",
    category: "booking",
    priority: "normal",
    title: "Permintaan Booking Baru",
    message: `Ada permintaan booking baru dari ${tenantName} untuk ${propertyName}`,
    metadata: {
      ownerEmail,
      ownerName,
      tenantName,
      propertyName,
      unitName,
      bookingUrl,
    },
  });
}

export async function sendBookingRejectionEmail(
  userId: string,
  tenantEmail: string,
  tenantName: string,
  propertyName: string,
  unitName: string,
  reason?: string,
): Promise<void> {
  await dispatchNotification({
    userId,
    type: "booking_rejected",
    category: "booking",
    priority: "normal",
    title: "Permintaan Booking Ditolak",
    message: `Permintaan booking Anda untuk ${propertyName} - ${unitName} telah ditolak`,
    metadata: {
      tenantEmail,
      tenantName,
      propertyName,
      unitName,
      reason: reason || "",
    },
  });
}

export async function sendPaymentReceivedEmail(
  userId: string,
  ownerEmail: string,
  ownerName: string,
  tenantName: string,
  propertyName: string,
  amount: number,
  paymentUrl: string,
): Promise<void> {
  await dispatchNotification({
    userId,
    type: "payment_dp_paid",
    category: "payment",
    priority: "normal",
    title: "Pembayaran Diterima",
    message: `Pembayaran dari ${tenantName} telah diterima untuk ${propertyName}`,
    metadata: {
      ownerEmail,
      ownerName,
      tenantName,
      propertyName,
      amount: String(amount),
      paymentUrl,
    },
  });
}

export async function sendChatNotificationEmail(
  userId: string,
  to: string,
  recipientName: string,
  senderName: string,
  messagePreview: string,
  chatUrl: string,
): Promise<void> {
  await dispatchNotification({
    userId,
    type: "chat_message",
    category: "chat",
    priority: "normal",
    title: `Pesan baru dari ${senderName}`,
    message: messagePreview,
    metadata: {
      email: to,
      recipientName,
      senderName,
      chatUrl,
    },
  });
}

export async function sendMaintenanceWhatsApp(
  userId: string,
  to: string,
  templateName: string,
  __parameters: string[],
): Promise<void> {
  logWarn("WhatsApp tidak didukung pada arsitektur serverless TypeScript", {
    userId,
    to,
    templateName,
  });
}

export async function sendApprovalWhatsApp(
  userId: string,
  tenantPhone: string,
  __tenantName: string,
  __propertyName: string,
  __dpAmount: number,
  __invoiceURL: string,
): Promise<void> {
  logWarn("WhatsApp tidak didukung pada arsitektur serverless TypeScript", {
    userId,
    tenantPhone,
  });
}

export async function sendRefundApprovalWhatsApp(
  userId: string,
  tenantPhone: string,
  __tenantName: string,
  __refundAmount: number,
  __bookingCode: string,
): Promise<void> {
  logWarn("WhatsApp tidak didukung pada arsitektur serverless TypeScript", {
    userId,
    tenantPhone,
  });
}

export const eventEmitter = {
  emit(
    event: string,
    data: { userId?: string; id?: string; [key: string]: unknown },
  ) {
    if (event !== "notification" || !data.userId) return false;
    return true;
  },
};