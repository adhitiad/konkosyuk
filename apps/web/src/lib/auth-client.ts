import { createAuthClient } from "better-auth/react";
import type { User as BetterAuthUser } from "better-auth";

const appUrl =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: appUrl,
  basePath: "/api/auth",
});

export const { signIn, signUp, signOut, useSession } = authClient;

export type Role = "cust" | "owner" | "admin" | "staff";

export const roleRedirectMap: Record<Role, string> = {
  cust: "/dashboard",
  owner: "/owner",
  admin: "/admin",
  staff: "/staff",
};

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
