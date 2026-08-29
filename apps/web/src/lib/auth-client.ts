import { createAuthClient } from "better-auth/react";
import type { Role, SessionUserWithRole } from "@/types/user";

const appUrl =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VERCEL_URL ||
      "https://konkosyuk.com";

export const authClient = createAuthClient({
  baseURL: appUrl,
  basePath: "/api/auth",
});

export const { signIn, signUp, signOut, useSession } = authClient;

export type { Role, SessionUserWithRole };

export const roleRedirectMap: Record<Role, string> = {
  cust: "/dashboard",
  owner: "/owner",
  admin: "/admin",
  staff: "/staff",
};
