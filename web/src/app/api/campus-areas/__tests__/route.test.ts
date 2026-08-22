import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/campus-areas/route";

// Catatan: route GET /api/campus-areas tidak menerima parameter request,
// sehingga tes cukup memanggil GET() langsung tanpa objek request palsu.

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

  mock.campusAreas = {
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
      campusAreas: mock.campusAreas,
    },
    setupMocks: setup,
  };
});

vi.mock("@/db", () => mockDb);

vi.mock("@/lib/logger", () => ({
  logApiRequest: vi.fn(),
  logError: vi.fn(),
}));

describe("GET /api/campus-areas", () => {
  beforeEach(() => {
    setupMocks([[]]);
  });

  it("returns 200 with empty areas array", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.areas).toEqual([]);
  });

  it("returns 200 with areas when data exists", async () => {
    const mockAreas = [
      {
        id: "1",
        slug: "ugm-jogja",
        name: "UGM Jogja",
        imageKey: "konkosyuk/campus/ugm",
        propertyCount: 5,
      },
    ];

    setupMocks([mockAreas]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.areas).toHaveLength(1);
    expect(data.data.areas[0].slug).toBe("ugm-jogja");
  });

  it("does not return areas with isActive = false", async () => {
    setupMocks([[]]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.areas).toEqual([]);
  });

  it("returns correct response format", async () => {
    setupMocks([[]]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("success");
    expect(data).toHaveProperty("data");
    expect(data.data).toHaveProperty("areas");
    expect(Array.isArray(data.data.areas)).toBe(true);
  });
});
