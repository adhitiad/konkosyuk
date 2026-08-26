export function calculateListingRankScore(property: {
  images: string[] | null;
  description: string | null;
  amenities: string[] | null;
  gpsVerified: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  viewCount?: number;
  inquiryCount?: number;
  bookingConversionRate?: number;
}): number {
  let score = 0;

  if ((property.images?.length || 0) >= 5) score += 15;
  if ((property.description?.length || 0) >= 200) score += 10;
  if ((property.amenities?.length || 0) >= 5) score += 8;
  if (property.gpsVerified) score += 7;
  if (property.isFeatured) score += 10;

  const qualityScore = Math.min(score, 50);

  const now = Date.now();
  const daysSinceCreated = (now - new Date(property.createdAt).getTime()) / 86400000;
  const daysSinceUpdated = (now - new Date(property.updatedAt).getTime()) / 86400000;
  const freshnessScore = Math.max(0, 20 - daysSinceCreated * 0.5 - daysSinceUpdated * 0.2);

  const performanceScore =
    Math.min((property.viewCount || 0) * 0.5, 5) +
    Math.min((property.inquiryCount || 0) * 5, 5) +
    Math.min((property.bookingConversionRate || 0) * 5, 5);

  return qualityScore + freshnessScore + performanceScore;
}
