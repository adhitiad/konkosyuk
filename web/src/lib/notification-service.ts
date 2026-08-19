import { db } from "@/db";
import { userNotificationPreferences, notificationType } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createNotification } from "./notifications";
import { sendWebPushNotification } from "./notifications";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export type NotificationCategory = "booking" | "payment" | "maintenance" | "inspection" | "chat" | "review" | "system";
export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export interface NotificationEvent {
  userId: string;
  type: string;
  category: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  referenceId?: string;
  referenceType?: string;
  metadata?: Record<string, unknown>;
}

export interface ChannelPreferences {
  inApp: boolean;
  email: boolean;
  push: boolean;
}

export interface UserPreferences {
  preferences: Record<string, ChannelPreferences>;
  emailDigest: "immediate" | "daily" | "weekly" | "never";
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  timezone: string;
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

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
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
    preferences: { ...DEFAULT_PREFERENCES, ...(prefs.preferences as Record<string, ChannelPreferences>) },
    emailDigest: prefs.emailDigest,
    quietHoursStart: prefs.quietHoursStart,
    quietHoursEnd: prefs.quietHoursEnd,
    timezone: prefs.timezone,
  };
}

export async function updateUserPreferences(
  userId: string,
  updates: Partial<Pick<UserPreferences, "preferences" | "emailDigest" | "quietHoursStart" | "quietHoursEnd" | "timezone">>,
): Promise<void> {
  const existing = await db
    .select()
    .from(userNotificationPreferences)
    .where(eq(userNotificationPreferences.userId, userId))
    .limit(1);

  const currentPrefs = existing.length > 0 ? existing[0] : null;

  const updateData: Record<string, unknown> = {
    preferences: updates.preferences ?? currentPrefs?.preferences ?? { ...DEFAULT_PREFERENCES },
    emailDigest: updates.emailDigest ?? currentPrefs?.emailDigest ?? "immediate",
    quietHoursStart: updates.quietHoursStart ?? currentPrefs?.quietHoursStart ?? null,
    quietHoursEnd: updates.quietHoursEnd ?? currentPrefs?.quietHoursEnd ?? null,
    timezone: updates.timezone ?? currentPrefs?.timezone ?? "Asia/Jakarta",
    updatedAt: new Date(),
  };

  if (currentPrefs) {
    await db
      .update(userNotificationPreferences)
      .set(updateData)
      .where(eq(userNotificationPreferences.userId, userId));
  } else {
    await db.insert(userNotificationPreferences).values({
      userId,
      preferences: updateData.preferences as Record<string, ChannelPreferences>,
      emailDigest: updateData.emailDigest as UserPreferences["emailDigest"],
      quietHoursStart: updateData.quietHoursStart as string | null,
      quietHoursEnd: updateData.quietHoursEnd as string | null,
      timezone: updateData.timezone as string,
    });
  }
}

function isInQuietHours(prefs: UserPreferences): boolean {
  if (!prefs.quietHoursStart || !prefs.quietHoursEnd) return false;

  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);

  if (prefs.quietHoursStart > prefs.quietHoursEnd) {
    return currentTime >= prefs.quietHoursStart || currentTime <= prefs.quietHoursEnd;
  }

  return currentTime >= prefs.quietHoursStart && currentTime <= prefs.quietHoursEnd;
}

export async function shouldSendNotification(
  userId: string,
  type: string,
  priority: NotificationPriority = "normal",
): Promise<{ inApp: boolean; email: boolean; push: boolean }> {
  const prefs = await getUserPreferences(userId);

  const typePrefs = prefs.preferences[type] || DEFAULT_PREFERENCES[type] || { inApp: true, email: false, push: false };

  if (!typePrefs.inApp && !typePrefs.email && !typePrefs.push) {
    return { inApp: false, email: false, push: false };
  }

  if (isInQuietHours(prefs) && priority !== "urgent") {
    if (typePrefs.push) typePrefs.push = false;
    if (typePrefs.email && prefs.emailDigest !== "immediate") typePrefs.email = false;
  }

  if (prefs.emailDigest !== "immediate") {
    typePrefs.email = false;
  }

  return { ...typePrefs };
}

export async function dispatchNotification(event: NotificationEvent): Promise<void> {
  const channels = await shouldSendNotification(event.userId, event.type, event.priority);

  if (!channels.inApp && !channels.email && !channels.push) {
    return;
  }

  const promises: Promise<void>[] = [];

  if (channels.inApp) {
    promises.push(
      createNotification(event.userId, event.type as typeof notificationType[number], event.title, event.message, event.referenceId),
    );
  }

  if (channels.push) {
    promises.push(
      sendWebPushNotification(event.userId, event.title, event.message).catch(() => {}),
    );
  }

  await Promise.allSettled(promises);

  if (channels.email) {
    await sendEmailNotification(event);
  }
}

export async function dispatchBookingReminder(
  userId: string,
  bookingId: string,
  propertyName: string,
  unitName: string,
  startDate: Date,
  reminderType: "24h" | "1h",
) {
  const type = reminderType === "24h" ? "booking_reminder_24h" : "booking_reminder_1h";
  const title = reminderType === "24h" ? "Booking Dimulai Besok" : "Booking Dimulai Segera";
  const message = `Booking Anda untuk ${propertyName} - ${unitName} akan dimulai pada ${format(startDate, "dd MMMM yyyy", { locale: idLocale })}.`;

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
) {
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
) {
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
) {
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
    metadata: meta,
  });
}

export async function dispatchReferralVoucherConverted(
  userId: string,
  referralCode: string,
  voucherCode: string,
) {
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
) {
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
) {
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
) {
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

async function sendEmailNotification(event: NotificationEvent): Promise<void> {
  const { sendApprovalEmail, sendBookingRequestEmail, sendBookingRejectionEmail, sendPaymentReceivedEmail, sendChatNotificationEmail } = await import("./notifications/email");

  switch (event.type) {
    case "booking_approved":
      if (event.metadata?.tenantEmail && event.metadata?.tenantName && event.metadata?.propertyName && event.metadata?.unitName && event.metadata?.dpAmount && event.metadata?.invoiceUrl) {
        await sendApprovalEmail(
          event.metadata.tenantEmail as string,
          event.metadata.tenantName as string,
          event.metadata.propertyName as string,
          event.metadata.unitName as string,
          event.metadata.dpAmount as number,
          event.metadata.invoiceUrl as string,
        );
      }
      break;
    case "booking_created":
      if (event.metadata?.ownerEmail && event.metadata?.ownerName && event.metadata?.tenantName && event.metadata?.propertyName && event.metadata?.unitName && event.metadata?.bookingUrl) {
        await sendBookingRequestEmail(
          event.metadata.ownerEmail as string,
          event.metadata.ownerName as string,
          event.metadata.tenantName as string,
          event.metadata.propertyName as string,
          event.metadata.unitName as string,
          event.metadata.bookingUrl as string,
        );
      }
      break;
    case "booking_rejected":
      if (event.metadata?.tenantEmail && event.metadata?.tenantName && event.metadata?.propertyName && event.metadata?.unitName) {
        await sendBookingRejectionEmail(
          event.metadata.tenantEmail as string,
          event.metadata.tenantName as string,
          event.metadata.propertyName as string,
          event.metadata.unitName as string,
        );
      }
      break;
    case "payment_full_paid":
    case "payment_dp_paid":
      if (event.metadata?.ownerEmail && event.metadata?.ownerName && event.metadata?.propertyName && event.metadata?.unitName && event.metadata?.amount && event.metadata?.paymentUrl) {
        await sendPaymentReceivedEmail(
          event.metadata.ownerEmail as string,
          event.metadata.ownerName as string,
          event.metadata.propertyName as string,
          event.metadata.unitName as string,
          event.metadata.amount as number,
          event.metadata.paymentUrl as string,
        );
      }
      break;
    case "chat_message":
      if (event.metadata?.email && event.metadata?.senderName && event.metadata?.propertyName && event.metadata?.chatUrl) {
        await sendChatNotificationEmail(
          event.metadata.email as string,
          event.metadata.senderName as string,
          event.metadata.senderName as string,
          event.message,
          event.metadata.chatUrl as string,
        );
      }
      break;
    default:
      break;
  }
}

export function getDefaultPreferences(): Record<string, ChannelPreferences> {
  return { ...DEFAULT_PREFERENCES };
}
