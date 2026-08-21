import { describe, it, expect, vi, beforeEach } from "vitest";
import { matchAndNotifySavedSearches } from "@/lib/cron/saved-search-matcher";
import { db } from "@/db";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  savedSearches: {},
  properties: {},
  users: {},
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
  sendWebPushNotification: vi.fn().mockResolvedValue(undefined),
}));

describe("matchAndNotifySavedSearches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return zero stats when no active searches", async () => {
    const result = await matchAndNotifySavedSearches();

    expect(result).toEqual({ matched: 0, notified: 0, errors: 0 });
  });

  it("should skip notification if less than 24 hours since last notified", async () => {
    const recentSearch = {
      id: "search-1",
      userId: "user-1",
      name: "Test Search",
      filters: { type: "kost" },
      isActive: true,
      lastMatchedAt: null,
      lastNotifiedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([recentSearch]),
          }),
        }),
      }),
    } as never);

    const result = await matchAndNotifySavedSearches();

    expect(result.matched).toBe(0);
    expect(result.notified).toBe(0);
  });

  it("should notify when new properties match", async () => {
    const search = {
      id: "search-1",
      userId: "user-1",
      name: "Test Search",
      filters: { type: "kost" },
      isActive: true,
      lastMatchedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      lastNotifiedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([search]),
          }),
        }),
      }),
    } as never);

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: "prop-1" }]),
        }),
      }),
    } as never);

    const result = await matchAndNotifySavedSearches();

    expect(result.matched).toBe(1);
    expect(result.notified).toBe(1);
  });

  it("should not notify when no properties match", async () => {
    const search = {
      id: "search-1",
      userId: "user-1",
      name: "Test Search",
      filters: { type: "kost" },
      isActive: true,
      lastMatchedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      lastNotifiedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([search]),
          }),
        }),
      }),
    } as never);

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as never);

    const result = await matchAndNotifySavedSearches();

    expect(result.matched).toBe(0);
    expect(result.notified).toBe(0);
  });

  it("should update lastMatchedAt even when no match", async () => {
    const search = {
      id: "search-1",
      userId: "user-1",
      name: "Test Search",
      filters: { type: "kost" },
      isActive: true,
      lastMatchedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      lastNotifiedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([search]),
          }),
        }),
      }),
    } as never);

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as never);

    await matchAndNotifySavedSearches();

    expect(db.update).toHaveBeenCalled();
  });
});
