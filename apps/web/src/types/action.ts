/**
 * Tipe-tipe state untuk Server Actions.
 * Setiap aksi mengembalikan state dalam format { success?, error?, data? }.
 */

import type { users, properties } from "@/db/schema";

export type ApproveKycState = {
  success?: boolean;
  error?: string;
  message?: string;
};

export type CreateLedgerEntryState = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

export type UpsertPaymentGatewayState = {
  success?: boolean;
  error?: string;
  data?: {
    id: string;
    provider: string;
    config: Record<string, unknown>;
    environment: string | null;
    isActive: boolean | null;
    updatedAt: Date | null;
  };
};

export type DeletePaymentGatewayState = {
  success?: boolean;
  error?: string;
  message?: string;
};

export type CreateManualPaymentState = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

export type CancelPaymentState = {
  success?: boolean;
  error?: string;
  message?: string;
};

export type ReviewRefundState = {
  success?: boolean;
  error?: string;
};

export type UpdateUserState = {
  success?: boolean;
  error?: string;
  message?: string;
};

export type DeleteUserState = {
  success?: boolean;
  error?: string;
  message?: string;
};

export type ReprocessWebhookState = {
  success?: boolean;
  error?: string;
};

export type ProcessWithdrawalState = {
  success?: boolean;
  error?: string;
  message?: string;
};

export type AddBankAccountState = {
  success?: boolean;
  error?: string;
  errorCode?: string;
  data?: {
    id: string;
    accountType: string;
    providerName: string;
    accountNumber: string;
    accountName: string;
    isPrimary: boolean;
    createdAt: Date;
  };
};

export type UpdateBankAccountState = {
  success?: boolean;
  error?: string;
  data?: {
    id: string;
    accountType: string;
    providerName: string;
    accountNumber: string;
    accountName: string;
    isPrimary: boolean;
    createdAt: Date;
  };
};

export type DeleteBankAccountState = {
  success?: boolean;
  error?: string;
};

export type CreateBookingRequestState = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

export type ReviewBookingRequestState = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

export type CreateBookingState = {
  success?: boolean;
  error?: string;
  data?: {
    id: string;
    propertyId: string;
    unitId: string;
    bookingType: string;
    status: string;
    startDate: Date;
    endDate: Date;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
    payment: {
      totalPrice: number;
      dpAmount: number;
      remainingAmount: number;
    };
  };
};

export type ReviewBookingState = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

export type SendMessageState = {
  success?: boolean;
  error?: string;
  data?: {
    id: string;
    roomId: string;
    senderId: string;
    content: string;
    createdAt: Date;
    isRead: boolean;
  };
};

export type CreateGroupBookingState = {
  success?: boolean;
  error?: string;
  data?: {
    id: string;
    propertyId: string;
    unitId: string;
    status: string;
    startDate: Date;
    endDate: Date;
  };
};

export type CreateMaintenanceTicketState = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

export type UpdateMaintenanceTicketState = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

export type UpdateNotificationState = {
  success?: boolean;
  error?: string;
  data?: { success: boolean };
};

export type AdminUpdateNotificationState = {
  success?: boolean;
  error?: string;
  data?: { success: boolean };
};

export type MarkAllNotificationsReadState = {
  success?: boolean;
  error?: string;
  data?: { success: boolean; count?: number };
};

export type UpdateProfileState = {
  success?: boolean;
  error?: string;
  data?: typeof users.$inferSelect;
};

export type UpdateUserProfileState = {
  success?: boolean;
  error?: string;
  data?: typeof users.$inferSelect;
};

export type CreatePropertyState = {
  success?: boolean;
  error?: string;
  data?: {
    id: string;
    name: string;
    ownerId: string;
    createdAt: Date;
  };
};

export type UpdatePropertyState = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

export type CreateReviewState = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

export type UpdateReviewState = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

export type DeleteReviewState = {
  success?: boolean;
  error?: string;
};

export type ReplyReviewState = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

export type CreateReportState = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

export type UpdateReportState = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

export type CreateUnitState = {
  success?: boolean;
  error?: string;
  data?: {
    id: string;
    propertyId: string;
    name: string;
    description: string | null;
    price: string;
    capacity: string | null;
    size: string | null;
    status: string;
    createdAt: Date;
  };
};

export type UpdateUnitState = {
  success?: boolean;
  error?: string;
  data?: {
    id: string;
    propertyId: string;
    name: string;
    description: string | null;
    price: string;
    capacity: string | null;
    size: string | null;
    status: string;
    updatedAt: Date;
  };
};

export type DeleteUnitState = {
  success?: boolean;
  error?: string;
};

export type UploadImageState = {
  success?: boolean;
  error?: string;
  data?: {
    url: string;
    provider: string;
  };
};

export type ToggleWishlistState = {
  success?: boolean;
  error?: string;
  favorited?: boolean;
};

export type CreateWithdrawalState = {
  success?: boolean;
  error?: string;
  data?: {
    id: string;
    amount: string;
    status: string;
    bankAccountId: string;
    createdAt: Date;
  };
};

export type ActionState = {
  success?: boolean;
  error?: string;
  data?: unknown;
};

export type ReconcilePaymentState = {
  success?: boolean;
  error?: string;
};

export type BanUserState = {
  success?: boolean;
  error?: string;
  message?: string;
};

export type CreateUserState = {
  success?: boolean;
  error?: string;
  message?: string;
  data?: unknown;
};

export type RequestRefundState = {
  success?: boolean;
  error?: string;
};

export type DeletePropertyState = {
  success?: boolean;
  error?: string;
};

export type FeaturePropertyState = {
  success?: boolean;
  error?: string;
  data?: typeof properties.$inferSelect;
};

export type ApprovePropertyState = {
  success?: boolean;
  error?: string;
  data?: typeof properties.$inferSelect;
};

export type CheckoutFeaturedState = {
  success?: boolean;
  error?: string;
  data?: {
    paymentId: string;
    invoiceNumber: string;
    redirectUrl?: string;
    qrCode?: string;
    vaNumber?: string;
    expiresAt?: Date;
  };
};

export type LinkReferralResult = {
  success: boolean;
  error?: string;
};

export type CreateKycDocumentState = {
  success?: boolean;
  error?: string;
};

export type UploadKycImageState = {
  success?: boolean;
  error?: string;
  data?: { url: string };
};
