import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export const auth = betterAuth({
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      prompt: 'select_account' as const,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google'],
      requireLocalEmailVerified: false,
    },
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
  advanced: {
    database: {
      generateId: 'uuid',
    },
    cookies: {
      sessionToken: {
        name: "session_token",
        attributes: {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
          path: "/",
        },
      },
    },
  },
  plugins: [nextCookies()],
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-in/email") {
        const email = ctx.body?.email as string | undefined;
        if (!email) {
          return;
        }

        const [existing] = await db
          .select({
            isBanned: users.isBanned,
            banReason: users.banReason,
          })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existing?.isBanned) {
          throw new APIError("FORBIDDEN", {
            message: `Akun Anda telah diblokir. Alasan: ${existing.banReason ?? "Tidak ada alasan yang diberikan."}`,
          });
        }
      }
    }),
  },
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
