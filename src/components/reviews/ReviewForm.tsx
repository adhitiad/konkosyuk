"use client";

import { useState } from "react";
import { StarRating } from "@/components/reviews/StarRating";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createReviewSchema } from "@/lib/validations/reviews";

interface ReviewFormProps {
  bookingId: string;
  propertyId: string;
  reviewedUserId?: string;
  type: "tenant" | "property";
  onSubmit: (data: {
    type: "tenant" | "property";
    rating: number;
    comment: string;
    bookingId: string;
    reviewedUserId?: string;
    propertyId: string;
  }) => Promise<void>;
  onCancel?: () => void;
}

export function ReviewForm({
  bookingId,
  propertyId,
  reviewedUserId,
  type,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aspects = [
    { key: "cleanliness", label: "Kebersihan" },
    { key: "security", label: "Keamanan" },
    { key: "accuracy", label: "Akurasi" },
    { key: "communication", label: "Komunikasi" },
    { key: "valueForMoney", label: "Nilai untuk Uang" },
  ] as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const data = createReviewSchema.parse({
        type,
        rating,
        comment,
        bookingId,
        reviewedUserId,
        propertyId,
      });

      setIsSubmitting(true);
      await onSubmit(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan saat mengirim review");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Rating</label>
        <StarRating
          rating={rating}
          onChange={setRating}
          size="lg"
        />
        {rating === 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Pilih rating dari 1-5 bintang
          </p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Review</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ceritakan pengalaman Anda..."
          rows={4}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {comment.length}/1000 karakter
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting || rating === 0}>
          {isSubmitting ? "Mengirim..." : "Kirim Review"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
        )}
      </div>
    </form>
  );
}
