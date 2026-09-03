import { NextRequest } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { chatRooms, messages } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { fail, handleApiError, ok } from "@/lib/api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession([
      "cust",
      "owner",
      "admin",
      "staff",
    ] as const);
    const { id: roomId } = await params;

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

    const roomMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.roomId, roomId))
      .orderBy(asc(messages.createdAt))
      .limit(200);

    return ok({ room, messages: roomMessages });
  } catch (error) {
    return handleApiError(error, "GET /api/chat/rooms/[id]");
  }
}
