import { describe, it, expect, vi, beforeEach } from "vitest";

const mockTenant = {
  id: "tenant-1",
  kycStatus: "verified",
  emailVerified: true,
  whatsapp: "+628123456789",
  reputationScore: 85,
  loyaltyTier: "gold",
};

const mockProperty = {
  id: "property-1",
  basePrice: 1500000,
  city: "Jakarta",
  type: "kost",
};

const mockUnit = {
  id: "unit-1",
  capacity: 2,
};

const mockRecentRequests = [
  {
    id: "request-1",
    agreedPrice: 1500000,
    status: "paid",
    numOccupants: 2,
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const createQueryChain = (recentRequests: unknown[] = []) => {
  const makeLimit = (data: unknown[]) =>
    vi.fn().mockResolvedValue(data);

  const defaultLimit = makeLimit([]);
  const recentLimit = makeLimit(recentRequests);

  const orderBy = vi.fn().mockReturnValue({ limit: recentLimit });
  const where = vi.fn().mockReturnValue({ orderBy, limit: defaultLimit });
  const from = vi.fn().mockReturnValue({ where });

  return { from, where, orderBy, limit: defaultLimit };
};

const mockSelect = vi.fn().mockImplementation(() => createQueryChain([]));

const mockDb = {
  query: {
    users: {
      findFirst: vi.fn().mockResolvedValue(mockTenant),
    },
    properties: {
      findFirst: vi.fn().mockResolvedValue(mockProperty),
    },
    units: {
      findFirst: vi.fn().mockResolvedValue(mockUnit),
    },
    bookings: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
    reviews: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
    bookingRequests: {
      findFirst: vi.fn().mockResolvedValue(mockRecentRequests[0]),
    },
  },
  select: mockSelect,
};

vi.mock("@/db", () => ({
  db: mockDb,
}));

describe("lead-quality-scorer.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockDb.query.users.findFirst.mockResolvedValue(mockTenant);
    mockDb.query.properties.findFirst.mockResolvedValue(mockProperty);
    mockDb.query.units.findFirst.mockResolvedValue(mockUnit);
    mockDb.query.bookings.findFirst.mockResolvedValue(null);
    mockDb.query.reviews.findFirst.mockResolvedValue(null);
    mockSelect.mockImplementation(() => createQueryChain([]));
  });

  it("should return null when tenant or property is missing", async () => {
    mockDb.query.users.findFirst.mockResolvedValue(null);
    const { calculateLeadQuality } = await import("../lead-quality-scorer");
    const result = await calculateLeadQuality("tenant-1", "property-1");
    expect(result).toBeNull();
  });

  it("should calculate platinum tier for high-quality lead", async () => {
    mockSelect.mockImplementation(() => createQueryChain(mockRecentRequests));
    const { calculateLeadQuality } = await import("../lead-quality-scorer");
    const result = await calculateLeadQuality("tenant-1", "property-1");

    expect(result).not.toBeNull();
    expect(result!.tier).toBe("platinum");
    expect(result!.score).toBeGreaterThanOrEqual(80);
    expect(result!.score).toBeLessThanOrEqual(100);
  });

  it("should calculate bronze tier for low-quality lead", async () => {
    const lowQualityTenant = {
      id: "tenant-low",
      kycStatus: "none",
      emailVerified: false,
      whatsapp: null,
      reputationScore: 0,
      loyaltyTier: "bronze",
    };

    mockDb.query.users.findFirst.mockResolvedValue(lowQualityTenant);
    mockDb.query.bookingRequests.findFirst.mockResolvedValue(null);
    mockSelect.mockImplementation(() => createQueryChain([]));

    const { calculateLeadQuality } = await import("../lead-quality-scorer");
    const result = await calculateLeadQuality("tenant-low", "property-1");

    expect(result).not.toBeNull();
    expect(result!.tier).toBe("bronze");
    expect(result!.score).toBeLessThan(40);
  });

  it("should have valid tier boundaries", async () => {
    const { calculateLeadQuality } = await import("../lead-quality-scorer");
    const result = await calculateLeadQuality("tenant-1", "property-1");

    expect(result).not.toBeNull();
    const validTiers = ["platinum", "gold", "silver", "bronze"];
    expect(validTiers).toContain(result!.tier);
  });

  it("should include breakdown in result", async () => {
    const { calculateLeadQuality } = await import("../lead-quality-scorer");
    const result = await calculateLeadQuality("tenant-1", "property-1");

    expect(result).not.toBeNull();
    expect(result!.breakdown).toBeDefined();
    expect(typeof result!.breakdown.verification).toBe("number");
    expect(typeof result!.breakdown.reputation).toBe("number");
    expect(typeof result!.breakdown.intent).toBe("number");
    expect(typeof result!.breakdown.fit).toBe("number");
  });
});
