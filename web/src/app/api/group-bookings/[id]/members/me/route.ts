import { NextRequest } from "next/server";
import { db } from "@/db";
import { groupBookingMembers } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

const respondToInviteSchema = z.object({
  status: z.enum(["accepted", "rejected"]),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const [membership] = await db
      .select()
      .from(groupBookingMembers)
      .where(
        and(
          eq(groupBookingMembers.groupBookingId, id),
          eq(groupBookingMembers.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!membership) {
      return fail("Anda bukan anggota group booking ini", 403);
    }

    return ok(membership);
  } catch (error) {
    return handleApiError(error, "GET /api/group-bookings/[id]/members/me");
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = respondToInviteSchema.parse(await req.json());

    const [membership] = await db
      .select()
      .from(groupBookingMembers)
      .where(
        and(
          eq(groupBookingMembers.groupBookingId, id),
          eq(groupBookingMembers.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!membership) {
      return fail("Anda bukan anggota group booking ini", 403);
    }

    if (membership.status !== "invited") {
      return fail("Undangan sudah direspon", 400);
    }

    const [updated] = await db
      .update(groupBookingMembers)
      .set({
        status: body.status,
        joinedAt: body.status === "accepted" ? new Date() : null,
      })
      .where(eq(groupBookingMembers.id, membership.id))
      .returning();

    return ok(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail(error.issues[0]?.message || "Input tidak valid", 400);
    }
    return handleApiError(error, "PUT /api/group-bookings/[id]/members/me");
  }
}
