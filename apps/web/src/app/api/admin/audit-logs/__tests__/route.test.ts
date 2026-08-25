import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/admin/audit-logs/route";

const originalLogs = [
  {
    id: "log-1",
    adminId: "admin-1",
    action: "create",
    targetType: "property",
    targetId: "prop-1",
    details: { name: "Kost Melati" },
    createdAt: new Date("2025-01-01T00:00:00Z"),
    userName: "Admin User",
    userEmail: "admin@example.com",
  },
  {
    id: "log-2",
    adminId: "admin-1",
    action: "update",
    targetType: "booking",
    targetId: "book-1",
    details: { status: "confirmed" },
    createdAt: new Date("2025-01-02T00:00:00Z"),
    userName: "Admin User",
    userEmail: "admin@example.com",
  },
];

const mockAuditLogs = [...originalLogs];

let isCountQuery = false;

const mockDb = vi.hoisted(() => ({
  select: vi.fn().mockImplementation((...args: unknown[]) => {
    if (
      args.length > 0 &&
      typeof args[0] === "object" &&
      args[0] !== null &&
      "count" in args[0]
    ) {
      isCountQuery = true;
    }
    return mockDb;
  }),
  from: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  where: vi.fn().mockImplementation(() => {
    if (isCountQuery) {
      isCountQuery = false;
      return Promise.resolve([{ count: mockAuditLogs.length }]);
    }
    return mockDb;
  }),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockImplementation(async () => mockAuditLogs),
}));

vi.mock("@/db", () => ({
  db: mockDb,
  auditLogs: {},
  users: {},
}));

vi.mock("@/lib/auth", () => ({
  requireSession: vi.fn().mockResolvedValue({
    user: { id: "admin-1", role: "admin" },
  }),
}));

vi.mock("@/lib/admin-rate-limit", () => ({
  withAdminRateLimit: vi.fn().mockResolvedValue(null),
}));

describe("GET /api/admin/audit-logs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isCountQuery = false;
    mockAuditLogs.length = 0;
    mockAuditLogs.push(...originalLogs);
  });

  it("returns paginated logs with default params", async () => {
    const req = {
      url: "http://localhost/api/admin/audit-logs",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.data).toHaveLength(2);
    expect(data.data.meta).toEqual({
      page: 1,
      limit: 50,
      total: 2,
      totalPages: 1,
    });
  });

  it("filters by action", async () => {
    mockAuditLogs.length = 0;
    mockAuditLogs.push(originalLogs[0]);

    const req = {
      url: "http://localhost/api/admin/audit-logs?action=create",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.data).toHaveLength(1);
    expect(data.data.data[0].action).toBe("create");
  });

  it("filters by date range", async () => {
    mockAuditLogs.length = 0;
    mockAuditLogs.push(originalLogs[0]);

    const req = {
      url: "http://localhost/api/admin/audit-logs?startDate=2025-01-01T00:00:00Z&endDate=2025-01-01T23:59:59Z",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.data).toHaveLength(1);
    expect(data.data.data[0].id).toBe("log-1");
  });

  it("searches in details JSON", async () => {
    mockAuditLogs.length = 0;
    mockAuditLogs.push(originalLogs[0]);

    const req = {
      url: "http://localhost/api/admin/audit-logs?search=Kost",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.data).toHaveLength(1);
    expect(data.data.data[0].id).toBe("log-1");
  });

  it("enforces max limit of 200", async () => {
    const req = {
      url: "http://localhost/api/admin/audit-logs?limit=500",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(422);
    expect(data.success).toBe(false);
  });
});
