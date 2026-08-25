import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/loyalty/transactions/route";

const mockRequireSession = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
);

vi.mock("@/lib/auth", () => ({
  requireSession: mockRequireSession,
}));

const mockResults: unknown[][] = [];
let resultIndex = 0;

const mockDb = vi.hoisted(() => {
  const db = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    and: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
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
  loyaltyTransactions: {
    userId: "userId",
    createdAt: "createdAt",
    type: "type",
    amount: "amount",
  },
}));

function setupMocks(results: unknown[][]) {
  mockResults.length = 0;
  resultIndex = 0;
  results.forEach((r) => mockResults.push(r));
}

describe("GET /api/loyalty/transactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns transactions with balance", async () => {
    setupMocks([
      [
        {
          id: "tx-1",
          type: "earn",
          amount: 100,
          createdAt: new Date("2024-01-01"),
        },
        {
          id: "tx-2",
          type: "redeem",
          amount: -50,
          createdAt: new Date("2024-01-02"),
        },
      ],
      [{ count: 2 }],
      [{ balance: 50 }],
    ]);

    const req = {
      url: "http://localhost/api/loyalty/transactions",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.data).toHaveLength(2);
    expect(data.data.balance).toBe(50);
    expect(data.data.meta.total).toBe(2);
  });

  it("filters by type", async () => {
    setupMocks([
      [
        {
          id: "tx-1",
          type: "earn",
          amount: 100,
          createdAt: new Date("2024-01-01"),
        },
      ],
      [{ count: 1 }],
      [{ balance: 100 }],
    ]);

    const req = {
      url: "http://localhost/api/loyalty/transactions?type=earn",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.data).toHaveLength(1);
    expect(data.data.data[0].type).toBe("earn");
  });

  it("returns empty balance when no transactions", async () => {
    setupMocks([[], [{ count: 0 }], [{ balance: null }]]);

    const req = {
      url: "http://localhost/api/loyalty/transactions",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.balance).toBe(0);
  });

  it("returns 500 when not authenticated", async () => {
    mockRequireSession.mockRejectedValue(new Error("Unauthorized"));

    const req = {
      url: "http://localhost/api/loyalty/transactions",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);

    expect(response.status).toBe(500);
  });
});
