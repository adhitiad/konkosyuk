/**
 * Tipe-tipe pengguna dan otentikasi.
 */
import type { UseQueryResult } from "@tanstack/react-query";
import type { User as BetterAuthUser, Session } from "better-auth";

export type Role = "cust" | "owner" | "admin" | "staff";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface SessionUserWithRole extends BetterAuthUser {
  role: Role;
  phone: string | null;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  reputationScore?: number;
  kycStatus?: string;
  ktpNumber?: string | null;
  ktpImageUrl?: string | null;
  balance?: string | number | null;
  telegram?: string | null;
  whatsapp?: string | null;
}

export interface SesiPengguna {
  session: Session;
  user: BetterAuthUser & {
    role: string;
    phone: string | null | undefined;
    twoFactorEnabled?: boolean | null;
    [key: string]: unknown;
  };
}

export interface KycStatusData {
  kycStatus: KycStatus;
  verifications: KycVerificationRecord[];
}

export type KycStatus = "none" | "pending" | "verified" | "rejected";

export type KycVerificationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired";

export interface KycVerificationRecord {
  id: string;
  userId: string;
  diditSessionId: string | null;
  status: KycVerificationStatus;
  documentType: string | null;
  ktpImageUrl: string | null;
  selfieImageUrl: string | null;
  faceMatchScore: number | null;
  livenessPassed: boolean | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UseKycStatusResult = UseQueryResult<KycStatusData> & {
  isVerified: boolean;
  kycStatus: KycStatus;
};
