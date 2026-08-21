import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/owner/revenue/route";

const mockRequireSession = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  requireSession: mockRequireSession,
}));

const responses: unknown[] = [];
let responseIndex = 0;

const mockDb = vi.hoisted(() => {
  const mock = {} as Record<string, unknown>;

  mock.select = vi.fn().mockReturnValue(mock);
  mock.from = vi.fn().mockReturnValue(mock);
  mock.where = vi.fn().mockReturnValue(mock);
  mock.innerJoin = vi.fn().mockReturnValue(mock);
  mock.leftJoin = vi.fn().mockReturnValue(mock);
  mock.groupBy = vi.fn().mockReturnValue(mock);
  mock.orderBy = vi.fn().mockReturnValue(mock);
  mock.limit = vi.fn().mockReturnValue(mock);
  mock.then = (resolve: (value: unknown) => unknown) => {
    const value = responses[responseIndex++] ?? [];
    return Promise.resolve(value).then(resolve);
  };

  return {
    db: mock,
    payments: {},
    bookings: {},
    properties: {},
    units: {},
  };
});

vi.mock("@/db", () => mockDb);

function setupRevenueMocks(mocks: unknown[]) {
  responses.length = 0;
  responseIndex = 0;
  mocks.forEach((m) => responses.push(m));
}

describe("GET /api/owner/revenue", () => {
  beforeEach(() => {
    mockRequireSession.mockClear();
    mockRequireSession.mockResolvedValue({
      user: { id: "owner-1", role: "owner" },
    });
  });

  it("returns 401 if not logged in", async () => {
    mockRequireSession.mockRejectedValueOnce(new Error("Tidak berwenang"));

    const req = {
      url: "http://localhost/api/owner/revenue",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it("returns zero values when owner has no properties", async () => {
    setupRevenueMocks([[]]);

    const req = {
      url: "http://localhost/api/owner/revenue",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.totalRevenue).toBe(0);
    expect(data.data.totalTransactions).toBe(0);
    expect(data.data.monthlyData).toHaveLength(0);
    expect(data.data.topProperties).toHaveLength(0);
  });

  it("returns revenue summary with default params", async () => {
    setupRevenueMocks([
      [{ id: "prop-1" }],
      [{ sum: 15000000 }],
      [{ count: 10 }],
      [{ sum: 10000000 }],
      [{ count: 8 }],
      ...Array.from({ length: 12 }, () => [{ sum: 0 }, { count: 0 }]).flat(),
      [
        {
          propertyId: "prop-1",
          propertyName: "Test Property",
          revenue: 15000000,
          transactions: 10,
          avgDailyRate: 500000,
        },
      ],
      [{ days: 15 }],
    ]);

    const req = {
      url: "http://localhost/api/owner/revenue",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.totalRevenue).toBe(15000000);
    expect(data.data.totalTransactions).toBe(10);
    expect(data.data.monthlyData).toHaveLength(12);
    expect(data.data.topProperties).toHaveLength(1);
  });

  it("filters by propertyId", async () => {
    setupRevenueMocks([
      [{ id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }],
      [{ sum: 0 }],
      [{ count: 0 }],
      [{ sum: 0 }],
      [{ count: 0 }],
      ...Array.from({ length: 12 }, () => [{ sum: 0 }, { count: 0 }]).flat(),
      [
        {
          propertyId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          propertyName: "Test Property",
          revenue: 0,
          transactions: 0,
          avgDailyRate: 0,
        },
      ],
      [{ days: 0 }],
    ]);

    const req = {
      url: "http://localhost/api/owner/revenue?propertyId=a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);

    expect(response.status).toBe(200);
  });

  it("handles month period", async () => {
    const monthlyMocks: unknown[] = [];
    for (let m = 0; m < 12; m++) {
      monthlyMocks.push([{ sum: 0 }], [{ count: 0 }]);
    }

    setupRevenueMocks([
      [{ id: "prop-1" }],
      [{ sum: 0 }],
      [{ count: 0 }],
      [{ sum: 0 }],
      [{ count: 0 }],
      ...monthlyMocks,
      [
        {
          propertyId: "prop-1",
          propertyName: "Test Property",
          revenue: 0,
          transactions: 0,
          avgDailyRate: 0,
        },
      ],
      [{ days: 0 }],
    ]);

    const req = {
      url: "http://localhost/api/owner/revenue?period=month",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.monthlyData).toHaveLength(12);
  });

  it("handles quarter period", async () => {
    const quarterlyMocks: unknown[] = [];
    for (let q = 0; q < 4; q++) {
      quarterlyMocks.push([{ sum: 0 }], [{ count: 0 }]);
    }

    setupRevenueMocks([
      [{ id: "prop-1" }],
      [{ sum: 0 }],
      [{ count: 0 }],
      [{ sum: 0 }],
      [{ count: 0 }],
      ...quarterlyMocks,
      [
        {
          propertyId: "prop-1",
          propertyName: "Test Property",
          revenue: 0,
          transactions: 0,
          avgDailyRate: 0,
        },
      ],
      [{ days: 0 }],
    ]);

    const req = {
      url: "http://localhost/api/owner/revenue?period=quarter",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.monthlyData).toHaveLength(4);
  });

  it("handles year period", async () => {
    const yearlyMocks: unknown[] = [];
    for (let y = 0; y < 5; y++) {
      yearlyMocks.push([{ sum: 0 }], [{ count: 0 }]);
    }

    setupRevenueMocks([
      [{ id: "prop-1" }],
      [{ sum: 0 }],
      [{ count: 0 }],
      [{ sum: 0 }],
      [{ count: 0 }],
      ...yearlyMocks,
      [
        {
          propertyId: "prop-1",
          propertyName: "Test Property",
          revenue: 0,
          transactions: 0,
          avgDailyRate: 0,
        },
      ],
      [{ days: 0 }],
    ]);

    const req = {
      url: "http://localhost/api/owner/revenue?period=year",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data.monthlyData).toHaveLength(5);
  });

  it("calculates comparison to previous period correctly", async () => {
    setupRevenueMocks([
      [{ id: "prop-1" }],
      [{ sum: 12000000 }],
      [{ count: 8 }],
      [{ sum: 10000000 }],
      [{ count: 10 }],
      ...Array.from({ length: 12 }, () => [{ sum: 0 }, { count: 0 }]).flat(),
      [
        {
          propertyId: "prop-1",
          propertyName: "Test Property",
          revenue: 12000000,
          transactions: 8,
          avgDailyRate: 500000,
        },
      ],
      [{ days: 15 }],
    ]);

    const req = {
      url: "http://localhost/api/owner/revenue?period=month",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.totalRevenue).toBe(12000000);
    expect(data.data.comparedToPreviousPeriod.revenueChange).toBe(20);
  });
});
