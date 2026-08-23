"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";

type RevenuePeriod = "month" | "quarter" | "year";

type RevenueResponse = {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  comparedToPreviousPeriod: {
    revenueChange: number;
    transactionChange: number;
  };
  monthlyData: Array<{
    label: string;
    revenue: number;
    transactions: number;
  }>;
  topProperties: Array<{
    propertyId: string;
    propertyName: string;
    revenue: number;
    transactions: number;
    occupancyRate: number;
  }>;
};

export function useOwnerRevenue(params: {
  period: RevenuePeriod;
  propertyId?: string;
  year?: number;
  month?: number;
}) {
  const { data, isLoading, error, refetch } = useQuery<RevenueResponse>({
    queryKey: ["owner-revenue", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set("period", params.period);
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
        `/api/owner/revenue?${searchParams.toString()}`,
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
