import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { twoFactor } from "better-auth/plugins/two-factor";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { logSecurityEvent } from "@/lib/logger";

export const auth = betterAuth({
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    process.env.NEXT_PUBLIC_APP_URL1,
    process.env.NEXT_PUBLIC_APP_URL2,
  ].filter((origin): origin is string => Boolean(origin)),
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      prompt: "select_account" as const,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      requireLocalEmailVerified: true,
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
      generateId: "uuid",
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
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  plugins: [
    nextCookies(),
    twoFactor({
      issuer: "KonkosYuk",
      totpOptions: {
        digits: 6,
        period: 30,
      },
      accountLockout: {
        enabled: true,
        maxFailedAttempts: 5,
        durationSeconds: 900,
      },
    }),
  ],
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
    logSecurityEvent("auth_failed", { reason: "no_session" });
    throw new Error("Unauthorized");
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role as Role)) {
    logSecurityEvent("authz_failed", {
      userId: session.user.id,
      role: session.user.role,
      requiredRoles: allowedRoles,
    });
    throw new Error("Forbidden");
  }

  return session;
}
