"use client";

import { StarRating } from "@/components/reviews/StarRating";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { ReviewCardData } from "@/lib/types/reviews";

interface RatingSummaryProps {
  averageRating: number;
  totalReviews: number;
  cleanliness: number;
  security: number;
  accuracy: number;
  communication: number;
  valueForMoney: number;
  ratingDistribution: Record<number, number>;
  reviews: ReviewCardData[];
}

export function RatingSummary({
  averageRating,
  totalReviews,
  cleanliness,
  security,
  accuracy,
  communication,
  valueForMoney,
  ratingDistribution,
  reviews,
}: RatingSummaryProps) {
  const aspects = [
    { label: "Kebersihan", value: cleanliness },
    { label: "Keamanan", value: security },
    { label: "Akurasi", value: accuracy },
    { label: "Komunikasi", value: communication },
    { label: "Nilai", value: valueForMoney },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-4xl font-bold">{averageRating.toFixed(1)}</p>
          <StarRating rating={averageRating} size="md" readonly />
          <p className="mt-1 text-sm text-muted-foreground">
            {totalReviews} review
          </p>
        </div>

        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingDistribution[star] || 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

            return (
              <div key={star} className="flex items-center gap-2">
                <span className="text-sm">{star}</span>
                <StarRating rating={star} size="sm" readonly />
                <div className="flex-1 h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-yellow-400"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {aspects.map((aspect) => (
          <div key={aspect.label} className="text-center">
            <p className="text-sm text-muted-foreground">{aspect.label}</p>
            <p className="text-lg font-semibold">{aspect.value.toFixed(1)}</p>
            <StarRating rating={aspect.value} size="sm" readonly />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Review Terbaru</h3>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada review</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
