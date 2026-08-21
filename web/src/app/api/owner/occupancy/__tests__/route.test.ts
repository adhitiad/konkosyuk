import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/owner/occupancy/route";

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
    bookings: {},
    properties: {},
    units: {},
  };
});

vi.mock("@/db", () => mockDb);

function setupOccupancyMocks(mocks: unknown[]) {
  responses.length = 0;
  responseIndex = 0;
  mocks.forEach((m) => responses.push(m));
}

describe("GET /api/owner/occupancy", () => {
  beforeEach(() => {
    mockRequireSession.mockClear();
    mockRequireSession.mockResolvedValue({
      user: { id: "owner-1", role: "owner" },
    });
  });

  it("returns zero occupancy when owner has no properties", async () => {
    setupOccupancyMocks([[]]);

    const req = {
      url: "http://localhost/api/owner/occupancy",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.overallOccupancy).toBe(0);
    expect(data.data.byProperty).toHaveLength(0);
    expect(data.data.dailyData).toHaveLength(0);
  });

  it("calculates occupancy rate correctly", async () => {
    setupOccupancyMocks([
      [{ id: "prop-1" }],
      [{ count: 5 }],
      [{ count: 3 }],
    ]);

    const req = {
      url: "http://localhost/api/owner/occupancy",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.overallOccupancy).toBe(60);
  });

  it("filters by propertyId", async () => {
    setupOccupancyMocks([
      [{ id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }],
      [{ count: 5 }],
      [{ count: 3 }],
    ]);

    const req = {
      url: "http://localhost/api/owner/occupancy?propertyId=a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);

    expect(response.status).toBe(200);
  });

  it("returns daily data for the month", async () => {
    setupOccupancyMocks([
      [{ id: "prop-1" }],
      [{ count: 5 }],
      [{ count: 3 }],
      [
        {
          propertyId: "prop-1",
          propertyName: "Test Property",
          totalUnits: 5,
          occupiedUnits: 3,
        },
      ],
      [{ avg: 500000 }],
      ...Array.from({ length: 31 }, () => [{ count: 0 }]),
    ]);

    const req = {
      url: "http://localhost/api/owner/occupancy?year=2026&month=1",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.dailyData).toHaveLength(31);
    expect(data.data.dailyData[0]).toHaveProperty("date");
    expect(data.data.dailyData[0]).toHaveProperty("occupied");
    expect(data.data.dailyData[0]).toHaveProperty("total");
    expect(data.data.dailyData[0]).toHaveProperty("rate");
  });

  it("handles property with no units", async () => {
    setupOccupancyMocks([
      [{ id: "prop-1" }],
      [{ count: 0 }],
      [{ count: 0 }],
      [
        {
          propertyId: "prop-1",
          propertyName: "Test Property",
          totalUnits: 0,
          occupiedUnits: 0,
        },
      ],
      [{ avg: 0 }],
      ...Array.from({ length: 31 }, () => [{ count: 0 }]),
    ]);

    const req = {
      url: "http://localhost/api/owner/occupancy",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.overallOccupancy).toBe(0);
  });
});
