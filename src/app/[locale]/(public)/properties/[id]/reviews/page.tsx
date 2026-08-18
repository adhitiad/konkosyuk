"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { useParams } from "next/navigation";
import { useActionState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { StarRating } from "@/components/StarRating";
import { useState } from "react";
import { toast } from "@/components/ui/toast";
import { createReviewAction } from "@/actions/reviews";

interface Review {
  id: string;
  propertyId: string;
  userId: string;
  bookingId: string;
  rating: string;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  userName: string | null;
}

interface ReviewsResponse {
  data: Review[];
  meta: { total: number };
}

export default function ReviewsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [newRating, setNewRating] = useState(0);
  const [comment, setComment] = useState("");
  const [state, formAction, isPending] = useActionState(
    createReviewAction,
    undefined,
  );

  const { data, isLoading, isError, error } = useQuery<ReviewsResponse>({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const res = await fetch(`/api/reviews?propertyId=${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat review");
      return json;
    },
    staleTime: 30000,
    enabled: !!id,
  });

  const handleSubmit = (formData: FormData) => {
    formData.append("propertyId", id || "");
    formAction(formData);
  };

  if (state?.success) {
    queryClient.invalidateQueries({ queryKey: ["reviews", id] });
    toast({
      title: "Review submitted",
      description: "Thank you for your feedback!",
      type: "success",
    });
    setNewRating(0);
    setComment("");
  } else if (state?.error) {
    toast({
      title: "Gagal",
      description: state.error,
      type: "error",
    });
  }

  const reviews = data?.data ?? [];
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
      : 0;

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Reviews & Ratings</h1>
        <p className="text-muted-foreground">
          Lihat dan berikan review untuk properti ini
        </p>
      </div>

      {isError && (
        <Alert variant="destructive" className="mb-6">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            strokeWidth={2}
            className="size-4"
          />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Gagal memuat review."}
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Average Rating</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold">{avgRating.toFixed(1)}</span>
            <div>
              <StarRating rating={Math.round(avgRating)} readonly />
              <p className="text-sm text-muted-foreground mt-1">
                {reviews.length} reviews
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {session && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Write a Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Rating</label>
                <StarRating rating={newRating} onChange={setNewRating} />
                <input type="hidden" name="rating" value={newRating} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Comment
                </label>
                <textarea
                  name="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Bagikan pengalaman Anda..."
                  className="w-full min-h-[80px] rounded-4xl border border-input bg-input/30 px-3 py-2 text-sm"
                  required
                />
              </div>
              <input type="hidden" name="type" value="property" />
              <input type="hidden" name="bookingId" value="" />
              <Button type="submit" disabled={newRating === 0 || isPending}>
                {isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))
        ) : reviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Belum ada review untuk properti ini.
          </p>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">
                      {review.userName || "Anonymous"}
                    </p>
                    <StarRating
                      rating={Number(review.rating)}
                      readonly
                      size="sm"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString("id-ID")}
                  </span>
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
