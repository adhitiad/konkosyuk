/**
 * Tipe-tipe analytics dan pelacakan peristiwa.
 */

export type AnalyticsEventName =
  | "booking_initiated"
  | "property_viewed"
  | "search_performed"
  | "payment_completed"
  | "payment_failed"
  | "review_submitted"
  | "inquiry_sent"
  | "inquiry_opened"
  | "inquiry_responded"
  | "booking_confirmed"
  | "booking_cancelled"
  | "property_created"
  | "property_updated"
  | "recommendation_clicked"
  | "similar_viewed"
  | "favorite_added"
  | "favorite_removed"
  | "search_results_loaded";

export interface BookingInitiatedPayload {
  propertyType: "ruko" | "kost";
  price: number;
  propertyId: string;
}

export interface PropertyViewedPayload {
  propertyId: string;
  propertyType: "ruko" | "kost";
  source: "search" | "map" | "recommendation" | "direct";
}

export interface SearchPerformedPayload {
  query: string;
  filters?: Record<string, unknown>;
}

export interface PaymentCompletedPayload {
  bookingId: string;
  amount: number;
  provider: string;
}

export interface PaymentFailedPayload {
  bookingId: string;
  error: string;
  provider: string;
}

export interface ReviewSubmittedPayload {
  propertyId: string;
  rating: number;
}

export interface InquirySentPayload {
  propertyId: string;
  bookingType: "instant" | "request";
  numOccupants: number;
}

export interface InquiryOpenedPayload {
  propertyId: string;
  tenantId: string;
}

export interface InquiryRespondedPayload {
  propertyId: string;
  tenantId: string;
  responseTimeHours: number;
}

export interface BookingConfirmedPayload {
  bookingId: string;
  propertyId: string;
  amount: number;
}

export interface BookingCancelledPayload {
  bookingId: string;
  propertyId: string;
  reason?: string;
}

export interface PropertyCreatedPayload {
  propertyId: string;
  propertyType: string;
  city: string;
}

export interface PropertyUpdatedPayload {
  propertyId: string;
  updatedFields: string[];
}

export interface RecommendationClickedPayload {
  propertyId: string;
  source: "search" | "homepage" | "detail_page";
  position: number;
}

export interface SimilarViewedPayload {
  propertyId: string;
  sourcePropertyId: string;
}

export interface FavoriteAddedPayload {
  propertyId: string;
}

export interface FavoriteRemovedPayload {
  propertyId: string;
}

export interface SearchResultsLoadedPayload {
  query: string;
  resultCount: number;
  filters?: Record<string, unknown>;
}

export type AnalyticsPayload =
  | { event: "booking_initiated"; data: BookingInitiatedPayload }
  | { event: "property_viewed"; data: PropertyViewedPayload }
  | { event: "search_performed"; data: SearchPerformedPayload }
  | { event: "payment_completed"; data: PaymentCompletedPayload }
  | { event: "payment_failed"; data: PaymentFailedPayload }
  | { event: "review_submitted"; data: ReviewSubmittedPayload }
  | { event: "inquiry_sent"; data: InquirySentPayload }
  | { event: "inquiry_opened"; data: InquiryOpenedPayload }
  | { event: "inquiry_responded"; data: InquiryRespondedPayload }
  | { event: "booking_confirmed"; data: BookingConfirmedPayload }
  | { event: "booking_cancelled"; data: BookingCancelledPayload }
  | { event: "property_created"; data: PropertyCreatedPayload }
  | { event: "property_updated"; data: PropertyUpdatedPayload }
  | { event: "recommendation_clicked"; data: RecommendationClickedPayload }
  | { event: "similar_viewed"; data: SimilarViewedPayload }
  | { event: "favorite_added"; data: FavoriteAddedPayload }
  | { event: "favorite_removed"; data: FavoriteRemovedPayload }
  | { event: "search_results_loaded"; data: SearchResultsLoadedPayload };

export interface TrendDataPoint {
  date: string;
  value: number;
  [key: string]: unknown;
}

export interface TrendData {
  period: string;
  data: TrendDataPoint[];
  total: number;
}

export type ChannelStatus = "success" | "failed" | "rate_limited" | "dlq";

export interface StatUpdate {
  channel: string;
  status: string;
  count: number;
}

export interface StatsPayload {
  timestamp: string;
  updates: StatUpdate[];
}

export interface UsageMetric {
  service: UsageService;
  action: UsageAction;
  count: number;
  month: string;
}

export type UsageService = "qstash" | "ably" | "redis";
export type UsageAction = "publish" | "command" | "request" | string;
