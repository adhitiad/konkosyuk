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
import { logSecurityEvent, logInfo } from "@/lib/logger";
import type { Session, User } from "better-auth";

interface SesiPengguna {
  session: Session;
  user: User & {
    role: string;
    phone: string | null | undefined;
    twoFactorEnabled?: boolean | null;
    [key: string]: unknown;
  };
}

export const auth = betterAuth({
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    process.env.BETTER_AUTH_URL,
    process.env.BETTER_AUTH_URL_SECONDARY,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_APP_URL_SECONDARY,
  ].filter((origin): origin is string => Boolean(origin)),
  rateLimit: {
    enabled: process.env.NODE_ENV === "production",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": {
        window: 10,
        max: 5,
      },
      "/sign-up/email": {
        window: 10,
        max: 5,
      },
      "/forgot-password": {
        window: 10,
        max: 3,
      },
      "/reset-password": {
        window: 10,
        max: 5,
      },
      "/two-factor/verify": {
        window: 10,
        max: 3,
      },
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification:
      process.env.NODE_ENV === "production" &&
      Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST),
    minPasswordLength: 8,
    sendResetPasswordToken: async (data: {
      token: string;
      user: { email: string };
    }) => {
      const { user } = data;
      logInfo("Password reset email sent", { email: user.email });
    },
  },
  socialProviders: {
    // Daftarkan provider Google hanya jika credential tersedia,
    // agar tidak muncul WARN "missing clientId or clientSecret".
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            prompt: "select_account" as const,
          },
        }
      : {}),
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
    nextCookies(),
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
  const session: SesiPengguna | null = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    logSecurityEvent("auth_failed", { reason: "no_session" });
    throw new Error("Tidak berwenang");
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role as Role)) {
    logSecurityEvent("authz_failed", {
      userId: session.user.id,
      role: session.user.role,
      requiredRoles: allowedRoles,
    });
    throw new Error("Dilarang");
  }

  return session;
}
