"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useActionState } from "react";
import {
  createReviewAction,
  updateReviewAction,
  deleteReviewAction,
  replyReviewAction,
} from "@/actions/reviews";

export function useReviews(params: {
  propertyId?: string;
  userId?: string;
  status?: string;
  rating?: number;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["reviews", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.propertyId) searchParams.set("propertyId", params.propertyId);
      if (params.userId) searchParams.set("userId", params.userId);
      if (params.status) searchParams.set("status", params.status);
      if (params.rating) searchParams.set("rating", params.rating.toString());

      const response = await fetch(`/api/reviews?${searchParams.toString()}`);
      const json = await response.json();
      return json.data;
    },
    enabled: !!params.propertyId || !!params.userId,
  });

  return { reviews: data, isLoading, error };
}

export function useReview(id: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["review", id],
    queryFn: async () => {
      const response = await fetch(`/api/reviews/${id}`);
      const json = await response.json();
      return json.data;
    },
    enabled: !!id,
  });

  return { review: data, isLoading, error };
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  const [state, formAction, isPending] = useActionState(
    createReviewAction,
    undefined,
  );

  const create = async (data: {
    type: "tenant" | "property";
    rating: number;
    comment: string;
    bookingId: string;
    reviewedUserId?: string;
    propertyId: string;
  }) => {
    const formData = new FormData();
    formData.append("type", data.type);
    formData.append("rating", data.rating.toString());
    formData.append("comment", data.comment);
    formData.append("bookingId", data.bookingId);
    if (data.reviewedUserId) {
      formData.append("reviewedUserId", data.reviewedUserId);
    }
    formData.append("propertyId", data.propertyId);
    await formAction(formData);
    queryClient.invalidateQueries({ queryKey: ["reviews"] });
  };

  return { create, state, isPending };
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  const [state, formAction, isPending] = useActionState(
    updateReviewAction,
    undefined,
  );

  const update = async ({
    id,
    data,
  }: {
    id: string;
    data: { rating?: number; comment?: string };
  }) => {
    const formData = new FormData();
    formData.append("id", id);
    if (data.rating !== undefined) formData.append("rating", data.rating.toString());
    if (data.comment !== undefined) formData.append("comment", data.comment);
    await formAction(formData);
    queryClient.invalidateQueries({ queryKey: ["reviews"] });
  };

  return { update, state, isPending };
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  const [state, formAction, isPending] = useActionState(
    deleteReviewAction,
    undefined,
  );

  const remove = async (id: string) => {
    const formData = new FormData();
    formData.append("id", id);
    await formAction(formData);
    queryClient.invalidateQueries({ queryKey: ["reviews"] });
  };

  return { remove, state, isPending };
}

export function useReplyReview() {
  const queryClient = useQueryClient();
  const [state, formAction, isPending] = useActionState(
    replyReviewAction,
    undefined,
  );

  const reply = async ({
    reviewId,
    content,
  }: {
    reviewId: string;
    content: string;
  }) => {
    const formData = new FormData();
    formData.append("reviewId", reviewId);
    formData.append("content", content);
    await formAction(formData);
    queryClient.invalidateQueries({ queryKey: ["reviews"] });
  };

  return { reply, state, isPending };
}
