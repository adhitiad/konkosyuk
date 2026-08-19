"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StarRating } from "@/components/StarRating";
import { reviewType } from "@/db/schema";
import { createReviewAction } from "@/actions/reviews";

interface ReviewFormProps {
  bookingId: string;
  type: (typeof reviewType)[number];
  targetId: string;
  targetName: string;
  onSuccess?: () => void;
}

export default function ReviewForm({
  bookingId,
  type,
  targetId,
  targetName,
  onSuccess,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [state, formAction, isPending] = useActionState(
    createReviewAction,
    undefined,
  );

  const handleSubmit = (formData: FormData) => {
    formData.append("bookingId", bookingId);
    formData.append("type", type);
    if (type === "tenant") {
      formData.append("reviewedUserId", targetId);
    } else {
      formData.append("propertyId", targetId);
    }
    formAction(formData);
  };

  if (state?.success) {
    setRating(0);
    setComment("");
    onSuccess?.();
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {state?.error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {state?.success && (
        <Alert variant="default">
          <AlertTitle>Berhasil</AlertTitle>
          <AlertDescription>
            Review untuk {targetName} berhasil dikirim
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>Rating</Label>
        <StarRating rating={rating} onChange={setRating} />
        <input type="hidden" name="rating" value={rating} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Komentar</Label>
        <Textarea
          id="comment"
          name="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={`Bagaimana pengalaman Anda dengan ${targetName}?`}
          rows={4}
          maxLength={1000}
          required
        />
        <p className="text-xs text-muted-foreground">
          {comment.length}/1000 karakter
        </p>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isPending || rating === 0}
      >
        {isPending ? "Mengirim..." : "Kirim Review"}
      </Button>
    </form>
  );
}
