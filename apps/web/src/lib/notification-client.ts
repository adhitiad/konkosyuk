import { NotificationGrpcClient } from "@konkosyuk/shared/lib/notification-grpc-client";

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "localhost:50052";

let client: NotificationGrpcClient | null = null;

function getClient(): NotificationGrpcClient {
  if (!client) {
    client = new NotificationGrpcClient(NOTIFICATION_SERVICE_URL);
  }
  return client;
}

export type NotificationCategory =
  | "booking"
  | "payment"
  | "maintenance"
  | "inspection"
  | "chat"
  | "review"
  | "system";

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
  metadata?: Record<string, string>;
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

export async function getUserPreferences(
  userId: string,
): Promise<UserPreferences> {
  const client = getClient();
  return client.getPreferences(userId);
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
): Promise<void> {
  const client = getClient();
  await client.updatePreferences(userId, updates);
}

export async function dispatchNotification(
  event: NotificationEvent,
): Promise<void> {
  const client = getClient();
  await client.dispatch({
    ...event,
    category: event.category,
    priority: event.priority || "normal",
  });
}

export async function dispatchBookingReminder(
  userId: string,
  bookingId: string,
  propertyName: string,
  unitName: string,
  startDate: Date,
  reminderType: "24h" | "1h",
): Promise<void> {
  const client = getClient();
  const type =
    reminderType === "24h" ? "booking_reminder_24h" : "booking_reminder_1h";
  const title =
    reminderType === "24h" ? "Booking Dimulai Besok" : "Booking Dimulai Segera";
  const message = `Booking Anda untuk ${propertyName} - ${unitName} akan dimulai pada ${startDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}.`;

  await client.dispatch({
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
  const client = getClient();
  await client.dispatch({
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
  const client = getClient();
  await client.dispatch({
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
  const client = getClient();
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

  await client.dispatch({
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
  const client = getClient();
  await client.dispatch({
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
  const client = getClient();
  await client.dispatch({
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
  const client = getClient();
  await client.dispatch({
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
  const client = getClient();
  await client.dispatch({
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

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  referenceId?: string,
): Promise<void> {
  const client = getClient();
  await client.dispatch({
    userId,
    type,
    category: "system",
    priority: "normal",
    title,
    message,
    referenceId,
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  const client = getClient();
  return client.getUnreadCount(userId);
}

export async function markAsRead(notificationId: string): Promise<void> {
  const client = getClient();
  await client.markRead(notificationId, "");
}

export async function sendWebPushNotification(
  userId: string,
  title: string,
  message: string,
): Promise<void> {
  const client = getClient();
  await client.dispatch({
    userId,
    type: "system",
    category: "system",
    priority: "normal",
    title,
    message,
  });
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const client = getClient();
  return client.getSettings();
}

export async function upsertNotificationSettings(
  data: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  const client = getClient();
  return client.updateSettings(data);
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
  parameters: string[],
): Promise<void> {
  await dispatchNotification({
    userId,
    type: templateName,
    category: "maintenance",
    priority: "normal",
    title: `[${templateName}]`,
    message: parameters.join(", "),
    metadata: {
      tenantPhone: to,
      recipientName: parameters[0] || "",
      propertyName: parameters[1] || "",
      category: parameters[2] || "",
      description: parameters[3] || "",
    },
  });
}

export async function sendApprovalWhatsApp(
  userId: string,
  tenantPhone: string,
  tenantName: string,
  propertyName: string,
  dpAmount: number,
  invoiceURL: string,
): Promise<void> {
  await dispatchNotification({
    userId,
    type: "booking_approved",
    category: "booking",
    priority: "high",
    title: "Permintaan Sewa Disetujui",
    message: `Halo ${tenantName}, permintaan sewa Anda untuk ${propertyName} telah disetujui`,
    metadata: {
      tenantPhone,
      tenantName,
      propertyName,
      dpAmount: String(dpAmount),
      invoiceUrl: invoiceURL,
    },
  });
}

export async function sendRefundApprovalWhatsApp(
  userId: string,
  tenantPhone: string,
  tenantName: string,
  refundAmount: number,
  bookingCode: string,
): Promise<void> {
  await dispatchNotification({
    userId,
    type: "payment_refunded",
    category: "payment",
    priority: "high",
    title: "Pengembalian Dana Disetujui",
    message: `Pengembalian dana untuk booking ${bookingCode} sebesar Rp ${refundAmount.toLocaleString("id-ID")} telah disetujui`,
    metadata: {
      tenantPhone,
      tenantName,
      refundAmount: String(refundAmount),
      bookingCode,
    },
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
