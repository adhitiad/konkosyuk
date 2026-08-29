"use client";

import { StarRating } from "@/components/StarRating";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import Image from "next/image";
import { ReviewCardData } from "@/types/review";

interface ReviewCardProps {
  review: ReviewCardData;
  onReply?: () => void;
  showReplyForm?: boolean;
}

export function ReviewCard({
  review,
  onReply,
  showReplyForm,
}: ReviewCardProps) {
  const aspects = [
    { label: "Kebersihan", value: review.cleanliness },
    { label: "Keamanan", value: review.security },
    { label: "Akurasi", value: review.accuracy },
    { label: "Komunikasi", value: review.communication },
    { label: "Nilai", value: review.valueForMoney },
  ];

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative size-10 overflow-hidden rounded-full">
            <Image
              src={review.reviewerImage || "/avatar-placeholder.jpg"}
              alt={review.reviewerName}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="font-medium">{review.reviewerName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(review.createdAt), {
                addSuffix: true,
                locale: id,
              })}
            </p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" readonly />
      </div>

      <p className="mt-3 text-sm">{review.comment}</p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {aspects.map((aspect) => (
          <div key={aspect.label} className="text-xs">
            <p className="text-muted-foreground">{aspect.label}</p>
            <StarRating rating={aspect.value} size="sm" readonly />
          </div>
        ))}
      </div>

      {review.reply && (
        <div className="mt-4 rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Balasan Owner</p>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(review.reply.createdAt), {
                addSuffix: true,
                locale: id,
              })}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {review.reply.content}
          </p>
        </div>
      )}

      {onReply && showReplyForm && (
        <div className="mt-4">
          <button
            onClick={onReply}
            className="text-sm text-primary hover:underline"
          >
            Balas review
          </button>
        </div>
      )}
    </div>
  );
}
