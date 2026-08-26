import { db } from "@/db";
import {
  users,
  properties,
  units,
  bookings,
  reviews,
  bookingRequests,
} from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export interface LeadQualityResult {
  score: number;
  tier: "platinum" | "gold" | "silver" | "bronze";
  breakdown: {
    verification: number;
    reputation: number;
    intent: number;
    fit: number;
  };
}

export async function calculateLeadQuality(
  tenantId: string,
  propertyId: string,
): Promise<LeadQualityResult | null> {
  const [tenant, property, unit] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, tenantId),
      columns: {
        id: true,
        kycStatus: true,
        emailVerified: true,
        whatsapp: true,
        reputationScore: true,
        loyaltyTier: true,
      },
    }),
    db.query.properties.findFirst({
      where: eq(properties.id, propertyId),
      columns: {
        id: true,
        basePrice: true,
        city: true,
        type: true,
      },
    }),
    db.query.units.findFirst({
      where: eq(units.propertyId, propertyId),
      columns: {
        id: true,
        capacity: true,
      },
    }),
  ]);

  if (!tenant || !property) return null;

  let verificationScore = 0;
  if (tenant.kycStatus === "verified") verificationScore += 25;
  else if (tenant.kycStatus === "pending") verificationScore += 10;
  if (tenant.emailVerified) verificationScore += 5;
  if (tenant.whatsapp) verificationScore += 5;

  const tenantBookings = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(eq(bookings.userId, tenantId))
    .limit(20);

  const tenantReviews = await db
    .select({ rating: reviews.rating })
    .from(reviews)
    .where(eq(reviews.createdById, tenantId))
    .limit(20);

  let reputationScore = 0;
  const repScore = Number(tenant.reputationScore || 0);
  reputationScore += Math.min(10, (repScore / 10) * 10);
  if (tenantBookings.length > 0) reputationScore += 5;
  if (tenantReviews.length > 0) {
    const totalRating = tenantReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
    const avgRating = totalRating / tenantReviews.length;
    if (avgRating >= 4) reputationScore += 5;
  }

  const recentRequests = await db
    .select()
    .from(bookingRequests)
    .where(
      and(
        eq(bookingRequests.tenantId, tenantId),
        eq(bookingRequests.propertyId, propertyId),
      ),
    )
    .orderBy(desc(bookingRequests.createdAt))
    .limit(5);

  let intentScore = 0;
  const latestRequest = recentRequests[0];
  if (latestRequest) {
    if (latestRequest.status === "paid") intentScore += 15;
    else if (latestRequest.status === "approved") intentScore += 10;
    else intentScore += 5;

    if (latestRequest.numOccupants >= 1) intentScore += 5;
    const startDate = new Date(latestRequest.startDate);
    const daysUntilMoveIn = (startDate.getTime() - Date.now()) / 86400000;
    if (daysUntilMoveIn >= 0 && daysUntilMoveIn <= 7) intentScore += 5;
  }

  let fitScore = 0;
  const propertyPrice = property.basePrice ? Number(property.basePrice) : 0;
  if (propertyPrice > 0 && latestRequest?.agreedPrice) {
    const agreedPrice = Number(latestRequest.agreedPrice);
    const budgetFit = 1 - Math.abs(agreedPrice - propertyPrice) / propertyPrice;
    fitScore += Math.max(0, budgetFit) * 10;
  }

  const locationFit = property.city ? 10 : 0;
  fitScore += locationFit;

  if (unit && latestRequest) {
    const unitCapacity = unit.capacity ? parseInt(unit.capacity, 10) : Infinity;
    const capacityFit = Math.min(latestRequest.numOccupants / unitCapacity, 1);
    fitScore += capacityFit * 5;
  }

  const total = Math.min(
    100,
    Math.max(0, verificationScore + reputationScore + intentScore + fitScore),
  );

  const tier =
    total >= 80 ? "platinum" : total >= 60 ? "gold" : total >= 40 ? "silver" : "bronze";

  return {
    score: Math.round(total),
    tier,
    breakdown: {
      verification: Math.min(25, Math.max(0, verificationScore)),
      reputation: Math.min(25, Math.max(0, reputationScore)),
      intent: Math.min(25, Math.max(0, intentScore)),
      fit: Math.min(25, Math.max(0, fitScore)),
    },
  };
}
