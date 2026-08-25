"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";

export function useFeatureFlag(key: string) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["feature-flag", key],
    queryFn: async () => {
      const response = await apiClient.get(
        `/api/feature-flags/${encodeURIComponent(key)}`,
      );
      return response.data.data.enabled as boolean;
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  return {
    enabled: data ?? false,
    loading: isLoading,
    refetch,
  };
}
