import type { UserInterestVector } from "./user-interest-vector";
import type { Property } from "@/db/schema";

export function calculateRecommendationScore(
  userVector: UserInterestVector,
  property: Pick<Property, "type" | "city" | "basePrice" | "amenities" | "metadata">,
): number {
  const typeScore = userVector.typeWeights[property.type] || 0;
  const cityScore = userVector.cityWeights[property.city || ""] || 0;

  const basePrice = property.basePrice ? Number(property.basePrice) : null;
  const bucket = basePrice !== null ? getPriceBucket(basePrice) : -1;
  const priceScore = bucket >= 0 ? userVector.priceBucketWeights[bucket] || 0 : 0;

  const propertyAmenities = new Set(property.amenities || []);
  const userAmenities = new Set(userVector.amenitySet);
  const intersection = [...userAmenities].filter((a) => propertyAmenities.has(a)).length;
  const union = new Set([...userAmenities, ...propertyAmenities]).size;
  const amenityScore = union > 0 ? intersection / union : 0;

  const contentScore = 0.3 * typeScore + 0.3 * cityScore + 0.2 * priceScore + 0.2 * amenityScore;

  return Math.min(contentScore, 1);
}

function getPriceBucket(price: number): number {
  if (price < 500000) return 0;
  if (price < 1000000) return 1;
  if (price < 2000000) return 2;
  return 3;
}
