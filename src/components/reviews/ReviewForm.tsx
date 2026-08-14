"use client";

import { useState, useActionState } from "react";
import { StarRating } from "@/components/reviews/StarRating";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createReviewAction } from "@/actions/reviews";

interface ReviewFormProps {
  bookingId: string;
  propertyId: string;
  reviewedUserId?: string;
  type: "tenant" | "property";
  onCancel?: () => void;
}

export function ReviewForm({
  bookingId,
  propertyId,
  reviewedUserId,
  type,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [state, formAction, isPending] = useActionState(
    createReviewAction,
    undefined
  );

  const aspects = [
    { key: "cleanliness", label: "Kebersihan" },
    { key: "security", label: "Keamanan" },
    { key: "accuracy", label: "Akurasi" },
    { key: "communication", label: "Komunikasi" },
    { key: "valueForMoney", label: "Nilai untuk Uang" },
  ] as const;

  const handleSubmit = (formData: FormData) => {
    formData.append("type", type);
    formData.append("rating", rating.toString());
    formData.append("comment", comment);
    formData.append("bookingId", bookingId);
    if (reviewedUserId) {
      formData.append("reviewedUserId", reviewedUserId);
    }
    formData.append("propertyId", propertyId);
    formAction(formData);
  };

  if (state?.success) {
    return (
      <div className="text-center py-4">
        <p className="text-green-600 font-medium">Review berhasil dikirim!</p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4">
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

      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending || rating === 0}>
          {isPending ? "Mengirim..." : "Kirim Review"}
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
