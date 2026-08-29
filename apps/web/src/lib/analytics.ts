import type {
  AnalyticsEventName,
  AnalyticsPayload,
  BookingInitiatedPayload,
  BookingCancelledPayload,
  BookingConfirmedPayload,
  FavoriteAddedPayload,
  FavoriteRemovedPayload,
  InquiryOpenedPayload,
  InquiryRespondedPayload,
  InquirySentPayload,
  PaymentCompletedPayload,
  PaymentFailedPayload,
  PropertyCreatedPayload,
  PropertyUpdatedPayload,
  PropertyViewedPayload,
  RecommendationClickedPayload,
  ReviewSubmittedPayload,
  SearchPerformedPayload,
  SearchResultsLoadedPayload,
  SimilarViewedPayload,
} from "@/types/analytics";

export type {
  AnalyticsEventName,
  AnalyticsPayload,
  BookingInitiatedPayload,
  BookingCancelledPayload,
  BookingConfirmedPayload,
  FavoriteAddedPayload,
  FavoriteRemovedPayload,
  InquiryOpenedPayload,
  InquiryRespondedPayload,
  InquirySentPayload,
  PaymentCompletedPayload,
  PaymentFailedPayload,
  PropertyCreatedPayload,
  PropertyUpdatedPayload,
  PropertyViewedPayload,
  RecommendationClickedPayload,
  ReviewSubmittedPayload,
  SearchPerformedPayload,
  SearchResultsLoadedPayload,
  SimilarViewedPayload,
};

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

async function trackToSelfHosted(payload: AnalyticsPayload): Promise<void> {
  if (!isClient()) return;

  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: payload.event,
        properties: payload.data,
      }),
    });
  } catch {
    // Silently fail - analytics should not break the app
  }
}

export async function trackEvent(payload: AnalyticsPayload): Promise<void> {
  safeTrack(payload);
  await trackToSelfHosted(payload);
}
