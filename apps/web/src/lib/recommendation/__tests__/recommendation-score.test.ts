import { describe, it, expect } from "vitest";

import { calculateRecommendationScore } from "../recommendation-score";

const mockUserVector = {
  typeWeights: { kost: 2.0, apartemen: 1.0 },
  cityWeights: { "Jakarta": 3.0, "Bandung": 1.0 },
  priceBucketWeights: { 0: 1.5, 1: 2.0, 2: 0.5 },
  amenitySet: ["wifi", "parkir", "kolam_renang"],
  areaWeights: {},
};

describe("recommendation-score.ts", () => {
  it("should return 0 for empty user vector", () => {
    const emptyVector = {
      typeWeights: {},
      cityWeights: {},
      priceBucketWeights: {},
      amenitySet: [],
      areaWeights: {},
    };

    const score = calculateRecommendationScore(emptyVector, {
      type: "kost",
      city: "Jakarta",
      basePrice: "500000",
      amenities: ["wifi"],
      metadata: {},
    });

    expect(score).toBe(0);
  });

  it("should give high score for matching type, city, price, and amenities", () => {
    const score = calculateRecommendationScore(mockUserVector, {
      type: "kost",
      city: "Jakarta",
      basePrice: "800000",
      amenities: ["wifi", "parkir"],
      metadata: {},
    });

    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("should cap score at 1", () => {
    const highVector = {
      typeWeights: { kost: 100 },
      cityWeights: { "Jakarta": 100 },
      priceBucketWeights: { 1: 100 },
      amenitySet: ["wifi", "parkir", "kolam_renang"],
      areaWeights: {},
    };

    const score = calculateRecommendationScore(highVector, {
      type: "kost",
      city: "Jakarta",
      basePrice: "800000",
      amenities: ["wifi", "parkir", "kolam_renang"],
      metadata: {},
    });

    expect(score).toBe(1);
  });

  it("should handle null basePrice gracefully", () => {
    const score = calculateRecommendationScore(mockUserVector, {
      type: "kost",
      city: "Jakarta",
      basePrice: null,
      amenities: ["wifi"],
      metadata: {},
    });

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("should calculate amenity Jaccard similarity correctly", () => {
    const vector = {
      typeWeights: {},
      cityWeights: {},
      priceBucketWeights: {},
      amenitySet: ["wifi", "parkir", "kolam_renang"],
      areaWeights: {},
    };

    const scoreWithAll = calculateRecommendationScore(vector, {
      type: "kost",
      city: "Jakarta",
      basePrice: "500000",
      amenities: ["wifi", "parkir", "kolam_renang"],
      metadata: {},
    });

    const scoreWithNone = calculateRecommendationScore(vector, {
      type: "kost",
      city: "Jakarta",
      basePrice: "500000",
      amenities: ["ac", "tv"],
      metadata: {},
    });

    expect(scoreWithAll).toBeGreaterThan(scoreWithNone);
  });
});
