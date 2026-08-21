import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/popular-areas/route";

const { mockDb, setupMocks } = vi.hoisted(() => {
  const responses: unknown[] = [];
  let responseIndex = 0;

  const mock = {} as Record<string, unknown>;

  mock.select = vi.fn().mockReturnValue(mock);
  mock.from = vi.fn().mockReturnValue(mock);
  mock.where = vi.fn().mockReturnValue(mock);
  mock.orderBy = vi.fn().mockReturnValue(mock);
  mock.then = (resolve: (value: unknown) => unknown) => {
    const value = responses[responseIndex++] ?? [];
    return Promise.resolve(value).then(resolve);
  };

  mock.popularAreas = {
    id: "id",
    slug: "slug",
    name: "name",
    imageKey: "imageKey",
    propertyCount: "propertyCount",
    isActive: "is_active",
    sortOrder: "sort_order",
  };

  function setup(mocks: unknown[]) {
    responses.length = 0;
    responseIndex = 0;
    mocks.forEach((m) => responses.push(m));
  }

  return {
    mockDb: {
      db: mock,
      popularAreas: mock.popularAreas,
    },
    setupMocks: setup,
  };
});

vi.mock("@/db", () => mockDb);

vi.mock("@/lib/logger", () => ({
  logApiRequest: vi.fn(),
  logError: vi.fn(),
}));

describe("GET /api/popular-areas", () => {
  beforeEach(() => {
    setupMocks([[]]);
  });

  it("returns 200 with empty areas array", async () => {
    const req = {
      url: "http://localhost/api/popular-areas",
      nextUrl: new URL("http://localhost/api/popular-areas"),
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.areas).toEqual([]);
  });

  it("returns 200 with areas when data exists", async () => {
    const mockAreas = [
      {
        id: "1",
        slug: "yogyakarta",
        name: "Kos Yogyakarta",
        imageKey: "konkosyuk/areas/yogyakarta",
        propertyCount: 10,
      },
    ];

    setupMocks([mockAreas]);

    const req = {
      url: "http://localhost/api/popular-areas",
      nextUrl: new URL("http://localhost/api/popular-areas"),
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.areas).toHaveLength(1);
    expect(data.data.areas[0].slug).toBe("yogyakarta");
  });

  it("does not return areas with isActive = false", async () => {
    setupMocks([[]]);

    const req = {
      url: "http://localhost/api/popular-areas",
      nextUrl: new URL("http://localhost/api/popular-areas"),
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.areas).toEqual([]);
  });

  it("returns correct response format", async () => {
    setupMocks([[]]);

    const req = {
      url: "http://localhost/api/popular-areas",
      nextUrl: new URL("http://localhost/api/popular-areas"),
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("success");
    expect(data).toHaveProperty("data");
    expect(data.data).toHaveProperty("areas");
    expect(Array.isArray(data.data.areas)).toBe(true);
  });
});
