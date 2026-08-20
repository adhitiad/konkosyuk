import { describe, it, expect, vi, beforeEach } from "vitest";
import { createReviewAction } from "@/actions/reviews";
import { bookings, reviews } from "@/db/schema";

interface MockReview {
  id: string;
  createdById: string;
  reviewedUserId: string | undefined;
  propertyId: string;
  type: string;
  rating: string;
  comment: string;
  bookingId: string;
}

const mockReviews: MockReview[] = [];

const mockUsers = new Map<string, { reputationScore: string }>();

let capturedUserId: string | undefined;

function resetMocks() {
  mockReviews.length = 0;
  mockUsers.clear();
  capturedUserId = undefined;
}

function createMockTx() {
  return {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockImplementation((values: Record<string, unknown>) => {
      capturedUserId = values.reviewedUserId as string | undefined;
      const review = {
        id: "review-" + Math.random().toString(36).slice(2, 9),
        createdById: values.createdById as string,
        reviewedUserId: values.reviewedUserId as string | undefined,
        propertyId: values.propertyId as string,
        type: values.type as string,
        rating: values.rating as string,
        comment: values.comment as string,
        bookingId: values.bookingId as string,
      };
      mockReviews.push(review);
      return createMockTx();
    }),
    returning: vi.fn().mockResolvedValue([
      {
        id: "review-new",
        createdById: "reviewer-1",
        reviewedUserId: "user-1",
        propertyId: "prop-1",
        type: "tenant",
        rating: "4",
        comment: "Good",
        bookingId: "booking-1",
      },
    ]),
    execute: vi.fn().mockImplementation(async () => {
      const userId = capturedUserId;
      if (!userId) return;

      const userReviews = mockReviews.filter(
        (r) => r.reviewedUserId === userId && r.type === "tenant",
      );
      if (userReviews.length === 0) {
        mockUsers.set(userId, { reputationScore: "0.00" });
        return;
      }

      const sum = userReviews.reduce((acc, r) => acc + Number(r.rating), 0);
      const avg = sum / userReviews.length;
      const formatted = avg.toFixed(2);
      mockUsers.set(userId, { reputationScore: formatted });
    }),
    delete: vi.fn().mockReturnThis(),
  };
}

const mockDb = vi.hoisted(() => ({
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockImplementation(async () => {
    const lastTable = (mockDb as unknown as { _currentTable?: string })
      ._currentTable;
    if (lastTable === "bookings") {
      return [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          userId: "reviewer-1",
          propertyId: "prop-1",
          unitId: "unit-1",
          status: "completed",
          startDate: "2020-01-01",
          endDate: "2025-01-01",
        },
      ];
    }
    if (lastTable === "reviews") {
      return mockReviews.filter(
        (r) => r.bookingId === "550e8400-e29b-41d4-a716-446655440000",
      );
    }
    return [];
  }),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  transaction: vi.fn(async (callback: (tx: unknown) => unknown) => {
    const tx = createMockTx();
    return callback(tx);
  }),
}));

mockDb.from.mockImplementation((table: unknown) => {
  if (table === bookings) {
    (mockDb as unknown as { _currentTable?: string })._currentTable =
      "bookings";
  } else if (table === reviews) {
    (mockDb as unknown as { _currentTable?: string })._currentTable = "reviews";
  }
  return mockDb;
});

vi.mock("@/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({
        user: {
          id: "reviewer-1",
          role: "owner",
          name: "Test",
          phone: "08123456789",
        },
      }),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/cache", () => ({
  invalidateCacheByTag: vi.fn().mockResolvedValue(undefined),
}));

describe("createReviewAction reputation calculation", () => {
  beforeEach(() => {
    resetMocks();
    vi.clearAllMocks();
  });

  async function callAction(
    overrides: {
      rating?: number;
      reviewedUserId?: string;
      type?: "tenant" | "property";
      bookingId?: string;
    } = {},
  ) {
    const formData = new FormData();
    formData.append("type", overrides.type ?? "tenant");
    formData.append("rating", String(overrides.rating ?? 4));
    formData.append("comment", "Nice place");
    formData.append(
      "bookingId",
      overrides.bookingId ?? "550e8400-e29b-41d4-a716-446655440000",
    );
    if (overrides.reviewedUserId) {
      formData.append("reviewedUserId", overrides.reviewedUserId);
    }

    return createReviewAction(undefined, formData);
  }

  it("calculates reputation score correctly for first review", async () => {
    mockUsers.set("550e8400-e29b-41d4-a716-446655440001", {
      reputationScore: "0.00",
    });

    const result = await callAction({
      rating: 4,
      reviewedUserId: "550e8400-e29b-41d4-a716-446655440001",
    });

    expect(result.success).toBe(true);
    expect(
      mockUsers.get("550e8400-e29b-41d4-a716-446655440001")?.reputationScore,
    ).toBe("4.00");
  });

  it("calculates average of all tenant reviews", async () => {
    mockUsers.set("550e8400-e29b-41d4-a716-446655440002", {
      reputationScore: "0.00",
    });
    mockReviews.push(
      {
        id: "r1",
        createdById: "other",
        reviewedUserId: "550e8400-e29b-41d4-a716-446655440002",
        propertyId: "prop-1",
        type: "tenant",
        rating: "3",
        comment: "OK",
        bookingId: "old-booking-1",
      },
      {
        id: "r2",
        createdById: "other",
        reviewedUserId: "550e8400-e29b-41d4-a716-446655440002",
        propertyId: "prop-1",
        type: "tenant",
        rating: "5",
        comment: "Great",
        bookingId: "old-booking-2",
      },
    );

    await callAction({
      rating: 4,
      reviewedUserId: "550e8400-e29b-41d4-a716-446655440002",
    });

    expect(
      mockUsers.get("550e8400-e29b-41d4-a716-446655440002")?.reputationScore,
    ).toBe("4.00");
  });

  it("handles decimal average correctly", async () => {
    mockUsers.set("550e8400-e29b-41d4-a716-446655440003", {
      reputationScore: "0.00",
    });
    mockReviews.push(
      {
        id: "r1",
        createdById: "other",
        reviewedUserId: "550e8400-e29b-41d4-a716-446655440003",
        propertyId: "prop-1",
        type: "tenant",
        rating: "3",
        comment: "OK",
        bookingId: "old-booking-1",
      },
      {
        id: "r2",
        createdById: "other",
        reviewedUserId: "550e8400-e29b-41d4-a716-446655440003",
        propertyId: "prop-1",
        type: "tenant",
        rating: "4",
        comment: "Good",
        bookingId: "old-booking-2",
      },
    );

    await callAction({
      rating: 5,
      reviewedUserId: "550e8400-e29b-41d4-a716-446655440003",
    });

    expect(
      mockUsers.get("550e8400-e29b-41d4-a716-446655440003")?.reputationScore,
    ).toBe("4.00");
  });

  it("does not modify reputation for non-tenant review", async () => {
    mockUsers.set("550e8400-e29b-41d4-a716-446655440004", {
      reputationScore: "4.00",
    });
    mockReviews.push({
      id: "r1",
      createdById: "other",
      reviewedUserId: "550e8400-e29b-41d4-a716-446655440004",
      propertyId: "prop-1",
      type: "tenant",
      rating: "3",
      comment: "OK",
      bookingId: "old-booking-1",
    });

    await callAction({
      rating: 5,
      reviewedUserId: "550e8400-e29b-41d4-a716-446655440004",
      type: "property",
    });

    expect(
      mockUsers.get("550e8400-e29b-41d4-a716-446655440004")?.reputationScore,
    ).toBe("4.00");
    expect(mockDb.transaction).not.toHaveBeenCalled();
  });
});
