import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/admin/feature-flags/route";

const mockFlags = vi.hoisted(() => [
  {
    id: "flag-1",
    key: "new_payment_flow",
    name: "New Payment Flow",
    description: "Test description",
    enabled: true,
    rolloutPercentage: 50,
    allowedRoles: ["admin"],
    allowedUsers: [],
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
  },
]);

const mockDb = vi.hoisted(() => {
  const orderByResult: unknown = mockFlags;
  const limitResult: unknown = [];
  const returningResult: unknown = mockFlags;

  const db = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockImplementation(() => Promise.resolve(orderByResult)),
    limit: vi.fn().mockImplementation(() => Promise.resolve(limitResult)),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockImplementation(() => Promise.resolve(returningResult)),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockResolvedValue(undefined),
  };

  return db;
});

vi.mock("@/db", () => ({
  db: mockDb,
  featureFlags: {},
}));

vi.mock("@/lib/api-auth", () => ({
  validateAdminRequest: vi.fn().mockResolvedValue({
    session: { user: { id: "admin-1", role: "admin" } },
    ipAddress: "127.0.0.1",
    userAgent: "test",
  }),
}));

vi.mock("@/lib/admin-rate-limit", () => ({
  withAdminRateLimit: vi.fn().mockResolvedValue(null),
}));

describe("GET /api/admin/feature-flags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all feature flags", async () => {
    const req = {
      url: "http://localhost/api/admin/feature-flags",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].key).toBe("new_payment_flow");
  });
});

describe("POST /api/admin/feature-flags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new feature flag", async () => {
    const req = {
      url: "http://localhost/api/admin/feature-flags",
      headers: new Headers(),
      json: async () => ({
        key: "new_payment_flow",
        name: "New Payment Flow",
        enabled: true,
        rolloutPercentage: 50,
        allowedRoles: ["admin"],
        allowedUsers: [],
      }),
    } as unknown as Parameters<typeof POST>[0];

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.key).toBe("new_payment_flow");
  });

  it("returns 409 for duplicate key", async () => {
    mockDb.limit.mockResolvedValue([mockFlags[0]]);

    const req = {
      url: "http://localhost/api/admin/feature-flags",
      headers: new Headers(),
      json: async () => ({
        key: "new_payment_flow",
        name: "New Payment Flow",
      }),
    } as unknown as Parameters<typeof POST>[0];

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
  });
});
