"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  KycStatusData,
  UseKycStatusResult,
} from "@/types/user";

export function useKycStatus(): UseKycStatusResult {
  const query = useQuery<KycStatusData>({
    queryKey: ["owner-kyc-status"],
    queryFn: async () => {
      const res = await fetch("/api/kyc/status");
      if (!res.ok) throw new Error("Gagal memuat status KYC");
      const body = await res.json();
      return (body.data ?? body) as KycStatusData;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  return {
    ...query,
    isVerified: query.data?.kycStatus === "verified",
    kycStatus: query.data?.kycStatus ?? "none",
  };
}
