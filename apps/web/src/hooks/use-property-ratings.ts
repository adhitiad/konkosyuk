"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";

export function usePropertyRatings(propertyId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["propertyRatings", propertyId],
    queryFn: async () => {
      const response = await apiClient.get(
        `/api/properties/${propertyId}/ratings`,
      );
      return response.data.data;
    },
    enabled: !!propertyId,
  });

  return {
    ratings: data,
    isLoading,
    error,
    averageRating: data?.averageRating || 0,
    totalReviews: data?.totalReviews || 0,
    cleanliness: data?.cleanliness || 0,
    security: data?.security || 0,
    accuracy: data?.accuracy || 0,
    communication: data?.communication || 0,
    valueForMoney: data?.valueForMoney || 0,
    ratingDistribution: data?.ratingDistribution || {},
    recentReviews: data?.recentReviews || [],
  };
}
