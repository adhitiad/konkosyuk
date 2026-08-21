import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/ads/[id]/click/route";
import { NextRequest } from "next/server";

const mockWithRateLimit = vi.hoisted(() => vi.fn());

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: mockWithRateLimit,
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
  mock.where = vi.fn().mockReturnValue(mock);
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

describe("POST /api/ads/[id]/click", () => {
  beforeEach(() => {
    mockWithRateLimit.mockClear();
    mockLogApiRequest.mockClear();
    mockLogError.mockClear();
  });

  it("returns 404 for non-existent ad", async () => {
    mockWithRateLimit.mockImplementation(
      (_config: unknown, _req: NextRequest, handler: () => Promise<Response>) =>
        handler(),
    );

    setupMocks([[]]);

    const req = {
      url: "http://localhost/api/ads/nonexistent/click",
      nextUrl: {
        params: Promise.resolve({ id: "nonexistent" }),
        searchParams: new URLSearchParams(),
      },
      headers: new Headers(),
    } as unknown as Parameters<typeof POST>[0];

    const response = await POST(req, { params: Promise.resolve({ id: "nonexistent" }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });

  it("returns 200 with redirectUrl when ad exists", async () => {
    mockWithRateLimit.mockImplementation(
      (_config: unknown, _req: NextRequest, handler: () => Promise<Response>) =>
        handler(),
    );

    const mockAd = {
      id: "ad-1",
      targetUrl: "https://example.com",
    };

    setupMocks([[mockAd], []]);

    const req = {
      url: "http://localhost/api/ads/ad-1/click",
      nextUrl: {
        params: Promise.resolve({ id: "ad-1" }),
        searchParams: new URLSearchParams(),
      },
      headers: new Headers(),
    } as unknown as Parameters<typeof POST>[0];

    const response = await POST(req, { params: Promise.resolve({ id: "ad-1" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.redirectUrl).toBe("https://example.com");
  });

  it("returns 200 with null redirectUrl when ad has no targetUrl", async () => {
    mockWithRateLimit.mockImplementation(
      (_config: unknown, _req: NextRequest, handler: () => Promise<Response>) =>
        handler(),
    );

    const mockAd = {
      id: "ad-1",
      targetUrl: null,
    };

    setupMocks([[mockAd], []]);

    const req = {
      url: "http://localhost/api/ads/ad-1/click",
      nextUrl: {
        params: Promise.resolve({ id: "ad-1" }),
        searchParams: new URLSearchParams(),
      },
      headers: new Headers(),
    } as unknown as Parameters<typeof POST>[0];

    const response = await POST(req, { params: Promise.resolve({ id: "ad-1" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.redirectUrl).toBeNull();
  });
});
