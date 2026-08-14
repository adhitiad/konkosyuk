"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { useSession } from "@/lib/auth-client";

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

      const response = await apiClient.get(`/api/reviews?${searchParams.toString()}`);
      return response.data.data;
    },
    enabled: !!params.propertyId || !!params.userId,
  });

  return { reviews: data, isLoading, error };
}

export function useReview(id: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["review", id],
    queryFn: async () => {
      const response = await apiClient.get(`/api/reviews/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  return { review: data, isLoading, error };
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (data: {
      type: "tenant" | "property";
      rating: number;
      comment: string;
      bookingId: string;
      reviewedUserId?: string;
      propertyId: string;
    }) => {
      const response = await apiClient.post("/api/reviews", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { rating?: number; comment?: string };
    }) => {
      const response = await apiClient.put(`/api/reviews/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/api/reviews/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}

export function useReplyReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, content }: { reviewId: string; content: string }) => {
      const response = await apiClient.post(`/api/reviews/${reviewId}/reply`, { content });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
  });
}
