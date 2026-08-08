import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
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

export interface SessionUserWithRole {
  id: string;
  email: string;
  name: string;
  role: Role;
  image: string | null;
  phone: string | null;
  reputationScore?: number;
  kycStatus?: string;
  ktpNumber?: string | null;
  ktpImageUrl?: string | null;
  balance?: string | number | null;
  createdAt: Date;
  updatedAt: Date;
}
