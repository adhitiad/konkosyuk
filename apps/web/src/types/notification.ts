/**
 * Tipe-tipe notifikasi, termasuk channel, prioritas, event, dan preferensi pengguna.
 */

export type NotificationCategory =
  | "booking"
  | "payment"
  | "maintenance"
  | "inspection"
  | "chat"
  | "review"
  | "system";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export type ChannelType = "inApp" | "email" | "push" | "whatsapp" | "telegram";

export type NotificationType =
  | "booking_created"
  | "booking_approved"
  | "booking_rejected"
  | "booking_reminder_24h"
  | "booking_reminder_1h"
  | "payment_dp_paid"
  | "payment_full_paid"
  | "payment_failed"
  | "maintenance_created"
  | "maintenance_updated"
  | "inspection_scheduled"
  | "chat_new_message"
  | "review_new"
  | "system";

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

export interface DispatchResponse {
  success: boolean;
  channelResults: Record<string, boolean>;
  error: string;
}

export interface EmailTemplateVariables {
  recipientName?: string;
  tenantName?: string;
  ownerName?: string;
  propertyName?: string;
  unitName?: string;
  bookingUrl?: string;
  invoiceUrl?: string;
  paymentUrl?: string;
  dpAmount?: number;
  fullAmount?: number;
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: string;
  reason?: string;
  chatUrl?: string;
  senderName?: string;
  messagePreview?: string;
  referralCode?: string;
  rewardAmount?: number;
  voucherCode?: string;
  groupName?: string;
  inviterName?: string;
  updateMessage?: string;
  resolutionNote?: string;
  alertMessage?: string;
  customFields?: Record<string, string>;
  description?: string;
  propertyType?: string;
  totalAmount?: number;
  transactionId?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  refundAmount?: number;
  refundReason?: string;
  reviewRating?: number;
  reviewerName?: string;
  reviewComment?: string;
  daysRemaining?: number;
  maintenanceTitle?: string;
  maintenanceDescription?: string;
  maintenanceStatus?: string;
  inspectionDate?: string;
  inspectionType?: string;
  expirationDate?: string;
  securityCode?: string;
  otpCode?: string;
  newBalance?: number;
  oldBalance?: number;
  referralCount?: number;
  referralName?: string;
  tierName?: string;
  achievementName?: string;
  featureName?: string;
  deadline?: string;
  actionText?: string;
  actionUrl?: string;
}

export type NotificationChannel = "in_app" | "email" | "push" | "whatsapp" | "telegram";
