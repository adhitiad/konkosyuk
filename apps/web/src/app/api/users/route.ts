import { NextRequest } from "next/server";
import { db } from "@/db";
import { users, userRole } from "@/db/schema";
import { eq, or, like, desc, and } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, handleApiError } from "@/lib/api";
import type { Role } from "@/lib/auth";

const publicFields = {
  id: users.id,
  name: users.name,
  role: users.role,
  isActive: users.isActive,
  image: users.image,
  province: users.province,
  city: users.city,
  district: users.district,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

const adminFields = {
  ...publicFields,
  email: users.email,
  emailVerified: users.emailVerified,
  phone: users.phone,
  whatsapp: users.whatsapp,
  telegram: users.telegram,
  kycStatus: users.kycStatus,
  ktpNumber: users.ktpNumber,
  ktpImageUrl: users.ktpImageUrl,
  reputationScore: users.reputationScore,
  balance: users.balance,
  isBanned: users.isBanned,
  banReason: users.banReason,
};

const staffFields = {
  ...publicFields,
  email: users.email,
  emailVerified: users.emailVerified,
  kycStatus: users.kycStatus,
  isBanned: users.isBanned,
};

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession(["admin", "staff"] as Role[]);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const role = searchParams.get("role");

    const conditions = [];
    if (search) {
      const term = `%${search}%`;
      conditions.push(or(like(users.name, term), like(users.email, term)));
    }
    if (role) {
      conditions.push(eq(users.role, role as (typeof userRole)[number]));
    }

    const where =
      conditions.length > 0
        ? conditions.length === 1
          ? conditions[0]
          : and(...conditions)
        : undefined;

    const isAdmin = session.user.role === "admin";
    const isStaff = session.user.role === "staff";
    const selectedFields = isAdmin
      ? adminFields
      : isStaff
        ? staffFields
        : publicFields;

    const data = await db
      .select(selectedFields)
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt));

    return ok({ data, meta: { total: data.length } });
  } catch (error) {
    return handleApiError(error);
  }
}
