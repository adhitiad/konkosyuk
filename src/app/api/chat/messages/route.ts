import { NextResponse } from "next/server";
import { db } from "@/db";
import { messages, chatRooms } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";

const sendMessageSchema = z.object({
  roomId: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession(["cust", "owner", "admin", "staff"] as const);
    const body = await req.json();
    const { roomId, content } = sendMessageSchema.parse(body);

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

    const [message] = await db
      .insert(messages)
      .values({
        roomId,
        senderId: session.user.id,
        content: content.trim(),
      })
      .returning();

    await db
      .update(chatRooms)
      .set({ lastMessageAt: new Date() })
      .where(eq(chatRooms.id, roomId));

    return ok(message, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/chat/messages");
  }
}

export async function GET(req: Request) {
  try {
    const session = await requireSession(["cust", "owner", "admin", "staff"] as const);
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return fail("roomId is required", 400);
    }

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

    const limit = Number(searchParams.get("limit")) || 50;
    const offset = Number(searchParams.get("offset")) || 0;

    const messageList = await db
      .select()
      .from(messages)
      .where(eq(messages.roomId, roomId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    return ok({ data: messageList.reverse() });
  } catch (error) {
    return handleApiError(error, "GET /api/chat/messages");
  }
}
