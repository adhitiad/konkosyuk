import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/group-bookings/route";

const mockRequireSession = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ user: { id: "user-1", role: "cust", name: "User" } }),
);

vi.mock("@/lib/auth", () => ({
  requireSession: mockRequireSession,
}));

const mockDispatch = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@/lib/notification-service", () => ({
  dispatchGroupBookingInvite: mockDispatch,
}));

const mockResults: unknown[][] = [];
let resultIndex = 0;

const mockDb = vi.hoisted(() => {
  const db = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    inArray: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    transaction: vi.fn().mockImplementation(async (fn: (tx: unknown) => unknown) => fn(db)),
    then(resolve: (value: unknown) => unknown) {
      const result = mockResults[resultIndex] ?? [];
      resultIndex++;
      return Promise.resolve(result).then(resolve);
    },
  };

  return db;
});

vi.mock("@/db", () => ({
  db: mockDb,
  groupBookings: {},
  groupBookingMembers: {},
  users: {},
  properties: {},
  units: {},
}));

function setupMocks(results: unknown[][]) {
  mockResults.length = 0;
  resultIndex = 0;
  results.forEach((r) => mockResults.push(r));
}

describe("GET /api/group-bookings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireSession.mockResolvedValue({ user: { id: "user-1", role: "cust" } });
  });

  it("returns user group bookings", async () => {
    setupMocks([
      [{ id: "gb-1", status: "pending", createdAt: new Date() }],
      [{ count: 1 }],
    ]);

    const req = {
      url: "http://localhost/api/group-bookings",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.data).toHaveLength(1);
    expect(data.data.meta.total).toBe(1);
  });

  it("returns empty for owner with no properties", async () => {
    mockRequireSession.mockResolvedValue({ user: { id: "user-1", role: "owner" } });
    setupMocks([[]]);

    const req = {
      url: "http://localhost/api/group-bookings",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.data).toHaveLength(0);
    expect(data.data.meta.total).toBe(0);
  });
});

describe("POST /api/group-bookings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireSession.mockResolvedValue({ user: { id: "user-1", role: "cust", name: "User" } });
  });

  it("creates group booking with member deduplication", async () => {
    setupMocks([
      [{ id: "123e4567-e89b-12d3-a456-426614174000", ownerId: "owner-1", name: "Test Property" }],
      [{ id: "123e4567-e89b-12d3-a456-426614174001", propertyId: "123e4567-e89b-12d3-a456-426614174000" }],
      [{ id: "gb-1" }],
      [{ id: "gb-1" }],
    ]);

    const req = {
      json: () =>
        Promise.resolve({
          propertyId: "123e4567-e89b-12d3-a456-426614174000",
          unitId: "123e4567-e89b-12d3-a456-426614174001",
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          maxMembers: 10,
          memberEmails: ["existing@example.com", "new@example.com"],
        }),
    } as unknown as Parameters<typeof POST>[0];

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.id).toBe("gb-1");
  });

  it("rejects when property not found", async () => {
    setupMocks([[]]);

    const req = {
      json: () =>
        Promise.resolve({
          propertyId: "123e4567-e89b-12d3-a456-426614174000",
          unitId: "123e4567-e89b-12d3-a456-426614174001",
          startDate: "2026-08-25T00:00:00.000Z",
          endDate: "2026-08-26T00:00:00.000Z",
          maxMembers: 10,
          memberEmails: ["test@example.com"],
        }),
    } as unknown as Parameters<typeof POST>[0];

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe("BAD_REQUEST");
  });

  it("rejects when unit does not belong to property", async () => {
    setupMocks([
      [{ id: "123e4567-e89b-12d3-a456-426614174000", ownerId: "owner-1" }],
      [{ id: "123e4567-e89b-12d3-a456-426614174001", propertyId: "other-prop" }],
    ]);

    const req = {
      json: () =>
        Promise.resolve({
          propertyId: "123e4567-e89b-12d3-a456-426614174000",
          unitId: "123e4567-e89b-12d3-a456-426614174001",
          startDate: "2026-08-25T00:00:00.000Z",
          endDate: "2026-08-26T00:00:00.000Z",
          maxMembers: 10,
          memberEmails: ["test@example.com"],
        }),
    } as unknown as Parameters<typeof POST>[0];

    const response = await POST(req);

    expect(response.status).toBe(404);
  });
});
