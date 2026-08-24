import { status } from "@grpc/grpc-js";
import { auth } from "../lib/auth-instance.js";
import { requireAuth } from "../interceptors/auth.interceptor.js";
import { createDb } from "@konkosyuk/shared/db";
import { users, sessions, accounts } from "@konkosyuk/shared/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const db = createDb(process.env.DATABASE_URL!, {
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export async function register(
  call: any,
  callback: (error: any, response?: any) => void,
) {
  try {
    const { email, password, name, phone, role } = call.request;

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      callback({ code: status.ALREADY_EXISTS, message: "Email sudah terdaftar" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [user] = await db.insert(users).values({
      email,
      name,
      phone: phone ?? "",
      role: role?.toLowerCase() ?? "cust",
    }).returning();

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(sessions).values({
      userId: user.id,
      token: sessionToken,
      expiresAt,
    });

    callback(null, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone ?? "",
        role: user.role as any,
        is_active: user.isActive,
        kyc_status: user.kycStatus ?? "none",
        created_at: user.createdAt.toISOString(),
        updated_at: user.updatedAt.toISOString(),
      },
      token: sessionToken,
    } satisfies any);
  } catch (error) {
    callback({ code: status.INTERNAL, message: (error as Error).message });
  }
}

export async function login(
  call: any,
  callback: (error: any, response?: any) => void,
) {
  try {
    const { email, password } = call.request;

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      callback({ code: status.NOT_FOUND, message: "Email tidak ditemukan" });
      return;
    }

    const passwordRecord = await db.select().from(accounts).where(eq(accounts.userId, user.id)).limit(1);
    if (passwordRecord.length === 0 || !passwordRecord[0].password) {
      callback({ code: status.UNAUTHENTICATED, message: "Akun tidak memiliki password" });
      return;
    }

    const valid = await bcrypt.compare(password, passwordRecord[0].password);
    if (!valid) {
      callback({ code: status.UNAUTHENTICATED, message: "Password salah" });
      return;
    }

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(sessions).values({
      userId: user.id,
      token: sessionToken,
      expiresAt,
    });

    callback(null, {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone ?? "",
        role: user.role as any,
        is_active: user.isActive,
        kyc_status: user.kycStatus ?? "none",
        created_at: user.createdAt.toISOString(),
        updated_at: user.updatedAt.toISOString(),
      },
      token: sessionToken,
    } satisfies any);
  } catch (error) {
    callback({ code: status.INTERNAL, message: (error as Error).message });
  }
}

export async function refreshSession(
  call: any,
  callback: (error: any, response?: any) => void,
) {
  try {
    const { refresh_token } = call.request;

    const [session] = await db.select().from(sessions).where(eq(sessions.token, refresh_token)).limit(1);
    if (!session) {
      callback({ code: status.UNAUTHENTICATED, message: "Refresh token tidak valid" });
      return;
    }

    const newToken = crypto.randomUUID();
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.update(sessions).set({ token: newToken, expiresAt: newExpiresAt }).where(eq(sessions.id, session.id));

    callback(null, {
      session: {
        id: session.id,
        user_id: session.userId,
        expires_at: newExpiresAt.toISOString(),
        created_at: session.createdAt.toISOString(),
        updated_at: new Date().toISOString(),
      },
      token: newToken,
    } satisfies any);
  } catch (error) {
    callback({ code: status.UNAUTHENTICATED, message: (error as Error).message });
  }
}

export async function getMe(
  call: any,
  callback: (error: any, response?: any) => void,
) {
  try {
    const session = await requireAuth(call);

    callback(null, {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        phone: session.user.phone ?? "",
        role: (session.user.role ?? "cust") as any,
        is_active: true,
        kyc_status: "none",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    } satisfies any);
  } catch (error) {
    callback({ code: status.UNAUTHENTICATED, message: (error as Error).message });
  }
}

export async function logout(
  call: any,
  callback: (error: any, response?: any) => void,
) {
  try {
    const session = await requireAuth(call);
    await db.delete(sessions).where(eq(sessions.userId, session.user.id));
    callback(null, { success: true, message: "Logged out" } satisfies any);
  } catch (error) {
    callback({ code: status.UNAUTHENTICATED, message: (error as Error).message });
  }
}
