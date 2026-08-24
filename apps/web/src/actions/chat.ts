"use server";

import { db } from "@/db";
import { messages, chatRooms, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { sendChatNotificationEmail } from "@/lib/notifications/email";
import { logError } from "@/lib/logger";

const sendMessageSchema = z.object({
  roomId: z.string().uuid(),
  content: z
    .string()
    .min(1, "Pesan tidak boleh kosong")
    .max(5000, "Pesan terlalu panjang"),
});

export type SendMessageState = {
  success?: boolean;
  error?: string;
  data?: {
    id: string;
    roomId: string;
    senderId: string;
    content: string;
    createdAt: Date;
    isRead: boolean;
  };
};

export async function sendMessageAction(
  prevState: SendMessageState | undefined,
  formData: FormData,
): Promise<SendMessageState> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak terotorisasi", success: false };
    }

    const validated = sendMessageSchema.parse({
      roomId: formData.get("roomId"),
      content: formData.get("content"),
    });

    const [room] = await db
      .select()
      .from(chatRooms)
      .where(eq(chatRooms.id, validated.roomId))
      .limit(1);

    if (!room) {
      return { error: "Ruang chat tidak ditemukan", success: false };
    }

    const isParticipant =
      room.tenantId === session.user.id || room.ownerId === session.user.id;

    if (!isParticipant) {
      return { error: "Tidak diizinkan", success: false };
    }

    const [message] = await db
      .insert(messages)
      .values({
        roomId: validated.roomId,
        senderId: session.user.id,
        content: validated.content.trim(),
      })
      .returning();

    const recipientId =
      room.tenantId === session.user.id ? room.ownerId : room.tenantId;

    if (recipientId) {
      const [recipient] = await db
        .select()
        .from(users)
        .where(eq(users.id, recipientId))
        .limit(1);

      if (recipient?.email) {
        sendChatNotificationEmail(
          recipient.email,
          recipient.name,
          session.user.name,
          validated.content.trim().slice(0, 200),
          `${process.env.NEXT_PUBLIC_APP_URL}/chat`,
        ).catch((err) => logError(err, "Failed to send chat notification email"));
      }
    }

    await db
      .update(chatRooms)
      .set({ lastMessageAt: new Date() })
      .where(eq(chatRooms.id, validated.roomId));

    return { success: true, data: message };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Input tidak valid",
        success: false,
      };
    }
    return { error: "Gagal mengirim pesan", success: false };
  }
}
