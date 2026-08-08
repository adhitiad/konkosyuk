import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { headers } from "next/headers";

export const auth = betterAuth({
  baseURL: "http://localhost:3001",
  trustedOrigins: ["http://localhost:3001"],
  secret: process.env.BETTER_AUTH_SECRET || "super-secret-key-yang-panjang-minimal-32-karakter-random-1234567890",
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "cust",
        input: false,
      },
      phone: {
        type: "string",
        required: false,
        defaultValue: "",
        input: true,
      },
    },
  },
  cookies: {
    sessionToken: {
      name: "session_token",
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
    },
  },
  plugins: [nextCookies()],
});

export type Role = "cust" | "owner" | "admin" | "staff";

export async function requireSession(allowedRoles?: Role[]) {
  const session: any = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role as Role)) {
    throw new Error("Forbidden");
  }

  return session;
}
