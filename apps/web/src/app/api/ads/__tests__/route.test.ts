import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/ads/route";

const mockEnforceRateLimit = vi.hoisted(() => vi.fn());

vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: mockEnforceRateLimit,
  publicRateLimit: {},
}));

const mockLogApiRequest = vi.hoisted(() => vi.fn());
const mockLogError = vi.hoisted(() => vi.fn());

vi.mock("@/lib/logger", () => ({
  logApiRequest: mockLogApiRequest,
  logError: mockLogError,
}));

const { mockDb, setupMocks } = vi.hoisted(() => {
  const responses: unknown[] = [];
  let responseIndex = 0;

  const mock = {} as Record<string, unknown>;

  mock.select = vi.fn().mockReturnValue(mock);
  mock.from = vi.fn().mockReturnValue(mock);
  mock.leftJoin = vi.fn().mockReturnValue(mock);
  mock.where = vi.fn().mockReturnValue(mock);
  mock.orderBy = vi.fn().mockReturnValue(mock);
  mock.limit = vi.fn().mockReturnValue(mock);
  mock.update = vi.fn().mockReturnValue(mock);
  mock.set = vi.fn().mockReturnValue(mock);
  mock.then = (resolve: (value: unknown) => unknown) => {
    const value = responses[responseIndex++] ?? [];
    return Promise.resolve(value).then(resolve);
  };

  mock.propertyAds = { id: "id" };

  function setup(mocks: unknown[]) {
    responses.length = 0;
    responseIndex = 0;
    mocks.forEach((m) => responses.push(m));
  }

  return {
    mockDb: {
      db: mock,
      propertyAds: mock.propertyAds,
    },
    setupMocks: setup,
  };
});

vi.mock("@/db", () => mockDb);

describe("GET /api/ads", () => {
  beforeEach(() => {
    mockEnforceRateLimit.mockClear();
    mockEnforceRateLimit.mockResolvedValue(null);
    mockLogApiRequest.mockClear();
    mockLogError.mockClear();
  });

  it("returns 200 with empty ads array", async () => {
    setupMocks([[]]);

    const req = {
      url: "http://localhost/api/ads",
      nextUrl: new URL("http://localhost/api/ads"),
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.ads).toEqual([]);
  });

  it("returns 200 with ads when type filter is provided", async () => {
    const mockAds = [
      {
        id: "ad-1",
        title: "Test Ad",
        description: "Test description",
        imageUrl: "https://example.com/image.jpg",
        targetUrl: "https://example.com",
        location: "Jakarta",
        price: "Rp 1.500.000",
        type: "kos",
        advertiserName: "Test Advertiser",
      },
    ];

    setupMocks([mockAds, []]);

    const req = {
      url: "http://localhost/api/ads?type=kos",
      nextUrl: new URL("http://localhost/api/ads?type=kos"),
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.ads).toHaveLength(1);
    expect(data.data.ads[0].title).toBe("Test Ad");
  });

  it("returns 200 when limit is provided", async () => {
    setupMocks([[]]);

    const req = {
      url: "http://localhost/api/ads?limit=5",
      nextUrl: new URL("http://localhost/api/ads?limit=5"),
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
