import { describe, it, expect, vi, beforeEach } from "vitest";
import { replyReviewAction } from "@/actions/reviews";
import { reviews, properties } from "@/db/schema";

const mockReplies: Array<{
  id: string;
  reviewId: string;
  userId: string;
  content: string;
}> = [];

let currentTable: string | undefined;

const mockDb = vi.hoisted(() => ({
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockImplementation(async () => {
    if (currentTable === "reviews") {
      return [
        {
          id: "123e4567-e89b-12d3-a456-426614174000",
          propertyId: "123e4567-e89b-12d3-a456-426614174001",
          reviewedUserId: "123e4567-e89b-12d3-a456-426614174002",
          createdById: "reviewer-1",
        },
      ];
    }
    if (currentTable === "properties") {
      return [
        {
          id: "123e4567-e89b-12d3-a456-426614174001",
          name: "Kost Melati",
          ownerId: "123e4567-e89b-12d3-a456-426614174003",
        },
      ];
    }
    return [];
  }),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockImplementation((values: Record<string, unknown>) => {
    const reply = {
      id: "reply-" + Math.random().toString(36).slice(2, 9),
      reviewId: values.reviewId as string,
      userId: values.userId as string,
      content: values.content as string,
    };
    mockReplies.push(reply);
    return mockDb;
  }),
  returning: vi.fn().mockResolvedValue([
    {
      id: "reply-new",
      reviewId: "123e4567-e89b-12d3-a456-426614174000",
      userId: "123e4567-e89b-12d3-a456-426614174003",
      content: "Terima kasih",
    },
  ]),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
}));

mockDb.from.mockImplementation((table: unknown) => {
  if (table === reviews) {
    currentTable = "reviews";
  } else if (table === properties) {
    currentTable = "properties";
  } else {
    currentTable = undefined;
  }
  return mockDb;
});

const mockCreateNotification = vi.hoisted(() => vi.fn());
const mockEventEmitter = vi.hoisted(() => ({
  emit: vi.fn(),
}));
const mockSendWebPushNotification = vi.hoisted(() => vi.fn());

vi.mock("@/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({
        user: {
          id: "123e4567-e89b-12d3-a456-426614174003",
          role: "owner",
          name: "Owner Name",
        },
      }),
    },
  },
}));

vi.mock("@/lib/api-auth", () => ({
  validateActionCsrf: vi.fn().mockResolvedValue(null),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: "test-csrf-token" }),
  }),
}));

vi.mock("@/lib/cache", () => ({
  invalidateCacheByTag: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/notification-client", () => ({
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
  sendWebPushNotification: (...args: unknown[]) =>
    mockSendWebPushNotification(...args),
  dispatchNotification: vi.fn(),
  dispatchBookingReminder: vi.fn(),
  dispatchPricingAlert: vi.fn(),
  dispatchReferralReward: vi.fn(),
  dispatchReferralStatusUpdate: vi.fn(),
  dispatchReferralVoucherConverted: vi.fn(),
  dispatchReferralOffsetApplied: vi.fn(),
  dispatchGroupBookingInvite: vi.fn(),
  dispatchGroupBookingUpdated: vi.fn(),
  getUserPreferences: vi.fn(),
  updateUserPreferences: vi.fn(),
  shouldSendNotification: vi.fn(),
  getDefaultPreferences: vi.fn(),
  getNotificationSettings: vi.fn(),
  upsertNotificationSettings: vi.fn(),
  encryptNotificationValue: vi.fn(),
  decryptNotificationValue: vi.fn(),
  eventEmitter: mockEventEmitter,
  sendMaintenanceReportCreatedEmail: vi.fn(),
  sendMaintenanceReportUpdatedEmail: vi.fn(),
  sendApprovalEmail: vi.fn(),
  sendBookingRequestEmail: vi.fn(),
  sendBookingRejectionEmail: vi.fn(),
  sendPaymentReceivedEmail: vi.fn(),
  sendChatNotificationEmail: vi.fn(),
  sendMaintenanceWhatsApp: vi.fn(),
  sendApprovalWhatsApp: vi.fn(),
  sendRefundApprovalWhatsApp: vi.fn(),
}));

describe("replyReviewAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReplies.length = 0;
    currentTable = undefined;
  });

  it("sends notification to reviewed user when owner replies", async () => {
    const formData = new FormData();
    formData.append("reviewId", "123e4567-e89b-12d3-a456-426614174000");
    formData.append("content", "Terima kasih");

    const result = await replyReviewAction(undefined, formData);

    expect(result.success).toBe(true);
    expect(mockCreateNotification).toHaveBeenCalledWith(
      "123e4567-e89b-12d3-a456-426614174002",
      "review_reply",
      "Owner membalas review Anda",
      "Owner Name membalas review Anda untuk Kost Melati",
      "123e4567-e89b-12d3-a456-426614174000",
    );
    expect(mockEventEmitter.emit).toHaveBeenCalledWith("notification", {
      userId: "123e4567-e89b-12d3-a456-426614174002",
      id: expect.any(String),
      type: "review_reply",
      title: "Owner membalas review Anda",
      message: "Owner Name membalas review Anda untuk Kost Melati",
      referenceId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(mockSendWebPushNotification).toHaveBeenCalledWith(
      "123e4567-e89b-12d3-a456-426614174002",
      "Owner membalas review Anda",
      "Owner Name membalas review Anda untuk Kost Melati",
    );
  });

  it("does not send notification when reviewedUserId is null", async () => {
    const reviewLimit = mockDb.limit;
    mockDb.limit = vi.fn().mockImplementation(async () => {
      if (currentTable === "reviews") {
        return [
          {
            id: "123e4567-e89b-12d3-a456-426614174000",
            propertyId: "123e4567-e89b-12d3-a456-426614174001",
            reviewedUserId: null,
            createdById: "reviewer-1",
          },
        ];
      }
      if (currentTable === "properties") {
        return [
          {
            id: "123e4567-e89b-12d3-a456-426614174001",
            name: "Kost Melati",
            ownerId: "123e4567-e89b-12d3-a456-426614174003",
          },
        ];
      }
      return [];
    });

    const formData = new FormData();
    formData.append("reviewId", "123e4567-e89b-12d3-a456-426614174000");
    formData.append("content", "Test reply");

    const result = await replyReviewAction(undefined, formData);

    expect(result.success).toBe(true);
    expect(mockCreateNotification).not.toHaveBeenCalled();
    expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    expect(mockSendWebPushNotification).not.toHaveBeenCalled();

    mockDb.limit = reviewLimit;
  });

  it("does not send notification when owner replies to their own review", async () => {
    const reviewLimit = mockDb.limit;
    mockDb.limit = vi.fn().mockImplementation(async () => {
      if (currentTable === "reviews") {
        return [
          {
            id: "123e4567-e89b-12d3-a456-426614174000",
            propertyId: "123e4567-e89b-12d3-a456-426614174001",
            reviewedUserId: "123e4567-e89b-12d3-a456-426614174003",
            createdById: "reviewer-1",
          },
        ];
      }
      if (currentTable === "properties") {
        return [
          {
            id: "123e4567-e89b-12d3-a456-426614174001",
            name: "Kost Melati",
            ownerId: "123e4567-e89b-12d3-a456-426614174003",
          },
        ];
      }
      return [];
    });

    const formData = new FormData();
    formData.append("reviewId", "123e4567-e89b-12d3-a456-426614174000");
    formData.append("content", "Self reply");

    const result = await replyReviewAction(undefined, formData);

    expect(result.success).toBe(true);
    expect(mockCreateNotification).not.toHaveBeenCalled();

    mockDb.limit = reviewLimit;
  });

  it("does not block reply when notification send fails", async () => {
    mockCreateNotification.mockRejectedValueOnce(
      new Error("Notification failed"),
    );

    const formData = new FormData();
    formData.append("reviewId", "123e4567-e89b-12d3-a456-426614174000");
    formData.append("content", "Reply despite failure");

    const result = await replyReviewAction(undefined, formData);

    expect(result.success).toBe(true);
  });
});
