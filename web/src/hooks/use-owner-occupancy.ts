"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";

type OccupancyResponse = {
  overallOccupancy: number;
  byProperty: Array<{
    propertyId: string;
    propertyName: string;
    totalUnits: number;
    occupiedUnits: number;
    occupancyRate: number;
    avgDailyRate: number;
  }>;
  dailyData: Array<{
    date: string;
    occupied: number;
    total: number;
    rate: number;
  }>;
};

export function useOwnerOccupancy(params: {
  propertyId?: string;
  year?: number;
  month?: number;
}) {
  const { data, isLoading, error, refetch } = useQuery<OccupancyResponse>({
    queryKey: ["owner-occupancy", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.propertyId) {
        searchParams.set("propertyId", params.propertyId);
      }
      if (params.year) {
        searchParams.set("year", String(params.year));
      }
      if (params.month) {
        searchParams.set("month", String(params.month));
      }

      const { data } = await apiClient.get(
        `/api/owner/occupancy?${searchParams.toString()}`,
      );
      return data;
    },
    staleTime: 60000,
  });

  return {
    data,
    loading: isLoading,
    error,
    refetch,
  };
}
