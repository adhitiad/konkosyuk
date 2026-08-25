import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/loyalty/rewards/route";

const mockRequireSession = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
);

vi.mock("@/lib/auth", () => ({
  requireSession: mockRequireSession,
}));

const mockDispatch = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@/lib/notification-service", () => ({
  dispatchNotification: mockDispatch,
}));

const mockResults: unknown[][] = [];
let resultIndex = 0;

const mockTx = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  for: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi
    .fn()
    .mockImplementation(() => Promise.resolve([{ id: "redemption-1" }])),
  then(resolve: (value: unknown) => unknown) {
    const result = mockResults[resultIndex] ?? [];
    resultIndex++;
    return Promise.resolve(result).then(resolve);
  },
};

const mockDb = vi.hoisted(() => {
  const db = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    transaction: vi
      .fn()
      .mockImplementation(async (fn: (tx: unknown) => unknown) => fn(mockTx)),
    for: vi.fn().mockReturnThis(),
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
  rewards: {},
  rewardRedemptions: {},
  loyaltyTransactions: {},
  users: {},
}));

function setupMocks(results: unknown[][]) {
  mockResults.length = 0;
  resultIndex = 0;
  results.forEach((r) => mockResults.push(r));
}

describe("GET /api/loyalty/rewards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireSession.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("returns active rewards by default", async () => {
    setupMocks([
      [
        {
          id: "reward-1",
          name: "Test Reward",
          pointsCost: 100,
          isActive: true,
        },
      ],
    ]);

    const req = {
      url: "http://localhost/api/loyalty/rewards",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.data).toHaveLength(1);
    expect(data.data.data[0].name).toBe("Test Reward");
  });

  it("returns all rewards when active=false", async () => {
    setupMocks([
      [
        {
          id: "reward-1",
          name: "Test Reward",
          pointsCost: 100,
          isActive: false,
        },
      ],
    ]);

    const req = {
      url: "http://localhost/api/loyalty/rewards?active=false",
      headers: new Headers(),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.data).toHaveLength(1);
  });
});

describe("POST /api/loyalty/rewards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireSession.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("redeems reward successfully with sufficient balance", async () => {
    setupMocks([
      [
        {
          id: "reward-1",
          pointsCost: 100,
          name: "Test Reward",
          isActive: true,
        },
      ],
      [{ id: "user-1" }],
      [{ balance: 500 }],
      [{ id: "redemption-1" }],
    ]);

    const req = {
      json: () =>
        Promise.resolve({ rewardId: "123e4567-e89b-12d3-a456-426614174000" }),
    } as unknown as Parameters<typeof POST>[0];

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.id).toBe("redemption-1");
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("rejects inactive reward", async () => {
    setupMocks([[{ id: "reward-1", pointsCost: 100, isActive: false }]]);

    const req = {
      json: () => Promise.resolve({ rewardId: "reward-1" }),
    } as unknown as Parameters<typeof POST>[0];

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe("BAD_REQUEST");
  });

  it("rejects non-existent reward", async () => {
    setupMocks([[]]);

    const req = {
      json: () =>
        Promise.resolve({ rewardId: "00000000-0000-0000-0000-000000000000" }),
    } as unknown as Parameters<typeof POST>[0];

    const response = await POST(req);

    expect(response.status).toBe(404);
  });
});
