import { NextResponse } from "next/server";
import { db } from "@/db";
import { chatRooms, messages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession(["cust", "owner", "admin", "staff"] as const);
    const roomId = params.id;

    const [room] = await db
      .select()
      .from(chatRooms)
      .where(eq(chatRooms.id, roomId))
      .limit(1);

    if (!room) {
      return fail("Chat room not found", 404);
    }

    const isParticipant =
      room.tenantId === session.user.id || room.ownerId === session.user.id;

    if (!isParticipant) {
      return fail("Forbidden", 403);
    }

    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.roomId, roomId),
          eq(messages.senderId, session.user.id === room.tenantId ? room.ownerId : room.tenantId),
        ),
      );

    return ok({ success: true });
  } catch (error) {
    return handleApiError(error, "PUT /api/chat/rooms/[id]/read");
  }
}
