"use client";

import { useQuery, UseQueryResult } from "@tanstack/react-query";

export type KycVerificationRecord = {
  id: string;
  userId: string;
  diditSessionId: string | null;
  status: "pending" | "approved" | "rejected" | "expired";
  documentType: string | null;
  ktpImageUrl: string | null;
  selfieImageUrl: string | null;
  faceMatchScore: number | null;
  livenessPassed: boolean | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type KycStatus = "none" | "pending" | "verified" | "rejected";

export interface KycStatusData {
  kycStatus: KycStatus;
  verifications: KycVerificationRecord[];
}

export type UseKycStatusResult = UseQueryResult<KycStatusData> & {
  isVerified: boolean;
  kycStatus: KycStatus;
};

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
