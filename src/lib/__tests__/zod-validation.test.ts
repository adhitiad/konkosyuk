import { describe, it, expect } from "vitest";
import {
  createBookingSchema,
  createPropertySchema,
  addBankAccountSchema,
  createWithdrawalSchema,
  updateUserProfileSchema,
  propertyQuerySchema,
  createUnitSchema,
} from "@/lib/zod";

describe("createBookingSchema", () => {
  it("validates correct booking data", () => {
    const validBooking = {
      propertyId: "123e4567-e89b-12d3-a456-426614174000",
      unitId: "123e4567-e89b-12d3-a456-426614174001",
      packageId: "pkg-1",
      bookingType: "instant" as const,
      startDate: "2026-09-01T00:00:00.000Z",
    };

    const result = createBookingSchema.parse(validBooking);
    expect(result.propertyId).toBe(validBooking.propertyId);
    expect(result.unitId).toBe(validBooking.unitId);
    expect(result.bookingType).toBe("instant");
  });

  it("rejects invalid booking type", () => {
    const invalidBooking = {
      propertyId: "123e4567-e89b-12d3-a456-426614174000",
      unitId: "123e4567-e89b-12d3-a456-426614174001",
      packageId: "pkg-1",
      bookingType: "invalid",
      startDate: "2026-09-01T00:00:00.000Z",
    };

    expect(() => createBookingSchema.parse(invalidBooking)).toThrow();
  });

  it("rejects missing required fields", () => {
    expect(() => createBookingSchema.parse({})).toThrow();
  });
});

describe("createPropertySchema", () => {
  it("validates correct property data", () => {
    const validProperty = {
      title: "Kost Melati",
      type: "kost",
      address: "Jl. Sudirman No. 1",
      city: "Jakarta",
      basePrice: "1500000",
    };

    const result = createPropertySchema.parse(validProperty);
    expect(result.title).toBe("Kost Melati");
    expect(result.type).toBe("kost");
  });

  it("rejects invalid property type", () => {
    const invalidProperty = {
      title: "Test",
      type: "invalid",
    };

    expect(() => createPropertySchema.parse(invalidProperty)).toThrow();
  });

  it("accepts optional fields when provided", () => {
    const property = {
      title: "Kost Melati",
      type: "kost",
      description: "Test description",
      amenities: ["wifi", "ac"],
      images: ["https://example.com/image.jpg"],
    };

    const result = createPropertySchema.parse(property);
    expect(result.description).toBe("Test description");
    expect(result.amenities).toContain("wifi");
  });
});

describe("addBankAccountSchema", () => {
  it("validates correct bank account data", () => {
    const validAccount = {
      account_type: "bank",
      provider_name: "BCA",
      account_number: "1234567890",
      account_name: "John Doe",
    };

    const result = addBankAccountSchema.parse(validAccount);
    expect(result.account_number).toBe("1234567890");
    expect(result.provider_name).toBe("BCA");
  });

  it("rejects account number with non-numeric characters", () => {
    const invalidAccount = {
      account_type: "bank",
      provider_name: "BCA",
      account_number: "ABC123",
      account_name: "John Doe",
    };

    expect(() => addBankAccountSchema.parse(invalidAccount)).toThrow();
  });

  it("rejects short account numbers", () => {
    const invalidAccount = {
      account_type: "bank",
      provider_name: "BCA",
      account_number: "1234",
      account_name: "John Doe",
    };

    expect(() => addBankAccountSchema.parse(invalidAccount)).toThrow();
  });
});

describe("createWithdrawalSchema", () => {
  it("validates correct withdrawal data", () => {
    const validWithdrawal = {
      bank_account_id: "123e4567-e89b-12d3-a456-426614174000",
      amount: 100000,
    };

    const result = createWithdrawalSchema.parse(validWithdrawal);
    expect(result.amount).toBe(100000);
  });

  it("rejects zero or negative amount", () => {
    expect(() =>
      createWithdrawalSchema.parse({ bank_account_id: "123", amount: 0 }),
    ).toThrow();
    expect(() =>
      createWithdrawalSchema.parse({ bank_account_id: "123", amount: -1000 }),
    ).toThrow();
  });
});

describe("updateUserProfileSchema", () => {
  it("validates correct profile data", () => {
    const validProfile = {
      phone: "081234567890",
      whatsapp: "081234567890",
      telegram: "johndoe",
      email: "john@example.com",
    };

    const result = updateUserProfileSchema.parse(validProfile);
    expect(result.phone).toBe("081234567890");
    expect(result.email).toBe("john@example.com");
  });

  it("rejects invalid email format", () => {
    expect(() =>
      updateUserProfileSchema.parse({
        phone: "081234567890",
        email: "invalid-email",
      }),
    ).toThrow();
  });

  it("rejects short phone numbers", () => {
    expect(() =>
      updateUserProfileSchema.parse({
        phone: "123",
        email: "john@example.com",
      }),
    ).toThrow();
  });
});

describe("propertyQuerySchema", () => {
  it("applies default values", () => {
    const result = propertyQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.radiusKm).toBe(5);
  });

  it("validates positive limit", () => {
    expect(() => propertyQuerySchema.parse({ limit: -1 })).toThrow();
  });

  it("validates max limit", () => {
    expect(() => propertyQuerySchema.parse({ limit: 200 })).toThrow();
  });
});

describe("createUnitSchema", () => {
  it("validates correct unit data", () => {
    const validUnit = {
      propertyId: "123e4567-e89b-12d3-a456-426614174000",
      name: "Unit 1",
      price: "1500000",
      capacity: "2",
    };

    const result = createUnitSchema.parse(validUnit);
    expect(result.name).toBe("Unit 1");
    expect(result.price).toBe("1500000");
  });

  it("rejects invalid UUID", () => {
    expect(() =>
      createUnitSchema.parse({
        propertyId: "not-a-uuid",
        name: "Unit 1",
        price: "1500000",
      }),
    ).toThrow();
  });
});
