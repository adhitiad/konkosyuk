import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/properties/route";

const mockRequireSession = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  requireSession: mockRequireSession,
}));

const mockEnforceRateLimit = vi.hoisted(() => vi.fn());

vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: mockEnforceRateLimit,
  publicRateLimit: {},
}));

const mockGetCachedData = vi.hoisted(() => vi.fn());

vi.mock("@/lib/cache", () => ({
  getCachedData: mockGetCachedData,
  buildCacheKey: vi.fn((...args) => JSON.stringify(args)),
}));

const mockLogApiRequest = vi.hoisted(() => vi.fn());
const mockLogError = vi.hoisted(() => vi.fn());

vi.mock("@/lib/logger", () => ({
  logApiRequest: mockLogApiRequest,
  logError: mockLogError,
}));

const responses: unknown[] = [];
let responseIndex = 0;

const mockDb = vi.hoisted(() => {
  const mock = {} as Record<string, unknown>;

  mock.select = vi.fn().mockReturnValue(mock);
  mock.from = vi.fn().mockReturnValue(mock);
  mock.where = vi.fn().mockReturnValue(mock);
  mock.orderBy = vi.fn().mockReturnValue(mock);
  mock.limit = vi.fn().mockReturnValue(mock);
  mock.offset = vi.fn().mockReturnValue(mock);
  mock.then = (resolve: (value: unknown) => unknown) => {
    const value = responses[responseIndex++] ?? [];
    return Promise.resolve(value).then(resolve);
  };

  return {
    db: mock,
    properties: {},
    bookings: {},
    seasonalPricingRules: {},
  };
});

vi.mock("@/db", () => mockDb);

function setupMocks(mocks: unknown[]) {
  responses.length = 0;
  responseIndex = 0;
  mocks.forEach((m) => responses.push(m));
}

describe("GET /api/properties", () => {
  beforeEach(() => {
    mockRequireSession.mockClear();
    mockRequireSession.mockResolvedValue({
      user: { id: "user-1", role: "cust" },
    });
    mockEnforceRateLimit.mockClear();
    mockEnforceRateLimit.mockResolvedValue(null);
    mockGetCachedData.mockClear();
    mockLogApiRequest.mockClear();
    mockLogError.mockClear();
  });

  it("returns error for invalid latitude", async () => {
    const req = {
      url: "http://localhost/api/properties?lat=invalid&lng=106.8456&radius=30",
      nextUrl: new URL("http://localhost/api/properties?lat=invalid&lng=106.8456&radius=30"),
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).not.toBe(200);
    expect(data.success).toBe(false);
  });

  it("returns error for invalid longitude", async () => {
    const req = {
      url: "http://localhost/api/properties?lat=-6.2088&lng=invalid&radius=30",
      nextUrl: new URL("http://localhost/api/properties?lat=-6.2088&lng=invalid&radius=30"),
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).not.toBe(200);
    expect(data.success).toBe(false);
  });

  it("returns normal query without GPS params", async () => {
    setupMocks([
      [{ id: "prop-1", name: "Test", latitude: null, longitude: null }],
      [{ count: 1 }],
    ]);

    mockGetCachedData.mockImplementation((_key: string, fn: () => Promise<unknown>) => fn());

    const req = {
      url: "http://localhost/api/properties",
      nextUrl: new URL("http://localhost/api/properties"),
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockGetCachedData).toHaveBeenCalled();
  });

  it("includes distance in response when GPS params are provided", async () => {
    const propertyRow = {
      id: "prop-1",
      name: "Test Property",
      latitude: -6.1751,
      longitude: 106.8275,
      distance: 4.2,
    };

    setupMocks([
      [propertyRow],
      [{ count: 1 }],
    ]);

    mockGetCachedData.mockImplementation((_key: string, fn: () => Promise<unknown>) => fn());

    const req = {
      url: "http://localhost/api/properties?lat=-6.2088&lng=106.8456&radius=30",
      nextUrl: new URL("http://localhost/api/properties?lat=-6.2088&lng=106.8456&radius=30"),
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.data).toBeDefined();
    expect(data.data.data[0]).toBeDefined();
    expect(data.data.data[0].distance).toBeCloseTo(4.2, 0);
  });

  it("excludes properties without coordinates when GPS is active", async () => {
    setupMocks([
      [
        {
          id: "prop-1",
          name: "Property With Coords",
          latitude: -6.1751,
          longitude: 106.8275,
        },
      ],
      [{ count: 1 }],
    ]);

    mockGetCachedData.mockImplementation((_key: string, fn: () => Promise<unknown>) => fn());

    const req = {
      url: "http://localhost/api/properties?lat=-6.2088&lng=106.8456&radius=30",
      nextUrl: new URL("http://localhost/api/properties?lat=-6.2088&lng=106.8456&radius=30"),
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.data).toBeDefined();
    expect(data.data.data).toHaveLength(1);
    expect(data.data.data[0].name).toBe("Property With Coords");
  });
});
