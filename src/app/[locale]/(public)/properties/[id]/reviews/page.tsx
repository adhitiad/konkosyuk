"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import StarRating from "@/components/star-rating";
import { useState } from "react";
import { toast } from "@/components/ui/toast";
import { apiClient } from "@/lib/axios";

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

  const { data, isLoading, isError, error } = useQuery<ReviewsResponse>({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/reviews", {
        params: { propertyId: id },
      });
      return data;
    },
    staleTime: 30000,
    enabled: !!id,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      bookingId: string;
      rating: number;
      comment?: string;
    }) => {
      const { data } = await apiClient.post("/api/reviews", {
        ...payload,
        propertyId: id,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", id] });
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
        type: "success",
      });
      setNewRating(0);
      setComment("");
    },
    onError: (err) => {
      toast({
        title: "Gagal",
        description:
          err instanceof Error ? err.message : "Gagal submit review.",
        type: "error",
      });
    },
  });

  const reviews = data?.data ?? [];
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
      : 0;

  const handleSubmit = () => {
    if (newRating === 0) return;
    createMutation.mutate({
      bookingId: "",
      rating: newRating,
      comment: comment || undefined,
    });
  };

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
            <div>
              <label className="text-sm font-medium mb-2 block">Rating</label>
              <StarRating rating={newRating} onRatingChange={setNewRating} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Comment</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Bagikan pengalaman Anda..."
                className="w-full min-h-[80px] rounded-4xl border border-input bg-input/30 px-3 py-2 text-sm"
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={newRating === 0 || createMutation.isPending}
            >
              {createMutation.isPending ? "Submitting..." : "Submit Review"}
            </Button>
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
