export type AnalyticsEventName =
  | "booking_initiated"
  | "property_viewed"
  | "search_performed"
  | "payment_completed"
  | "payment_failed"
  | "review_submitted";

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

export type AnalyticsPayload =
  | { event: "booking_initiated"; data: BookingInitiatedPayload }
  | { event: "property_viewed"; data: PropertyViewedPayload }
  | { event: "search_performed"; data: SearchPerformedPayload }
  | { event: "payment_completed"; data: PaymentCompletedPayload }
  | { event: "payment_failed"; data: PaymentFailedPayload }
  | { event: "review_submitted"; data: ReviewSubmittedPayload };

function isClient(): boolean {
  return typeof window !== "undefined";
}

function safeTrack(payload: AnalyticsPayload): void {
  if (!isClient()) return;

  const win = window as unknown as {
    va?: (name: string, properties: Record<string, unknown>) => void;
  };

  const data = Object.fromEntries(Object.entries(payload.data)) as Record<
    string,
    unknown
  >;

  win.va?.(payload.event, data);
}

export function trackEvent(payload: AnalyticsPayload): void {
  safeTrack(payload);

  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] ${payload.event}:`, payload.data);
  }
}
