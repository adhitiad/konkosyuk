import { NextResponse } from "next/server";
import { db } from "@/db";
import { chatRooms, messages, properties } from "@/db/schema";
import { eq, and, desc, sql, or } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { ok, fail, handleApiError } from "@/lib/api";
import { z } from "zod";

const createRoomSchema = z.object({
  propertyId: z.string().uuid(),
  tenantId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await requireSession(["cust", "owner"] as const);
    const body = await req.json();
    const { propertyId, tenantId } = createRoomSchema.parse(body);

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!property) {
      return fail("Property not found", 404);
    }

    const isOwner = session.user.role === "owner";
    const isTenant = session.user.role === "cust";

    if (isOwner && property.ownerId !== session.user.id) {
      return fail("Forbidden", 403);
    }

    if (isTenant && tenantId && tenantId !== session.user.id) {
      return fail("Forbidden", 403);
    }

    const actualTenantId = isTenant ? session.user.id : tenantId;
    const actualOwnerId = isOwner ? session.user.id : property.ownerId;

    if (!actualTenantId || !actualOwnerId) {
      return fail("Missing tenant or owner information", 400);
    }

    const [existingRoom] = await db
      .select()
      .from(chatRooms)
      .where(
        and(
          eq(chatRooms.propertyId, propertyId),
          eq(chatRooms.tenantId, actualTenantId),
          eq(chatRooms.ownerId, actualOwnerId),
        ),
      )
      .limit(1);

    if (existingRoom) {
      return ok({ room: existingRoom, created: false });
    }

    const [room] = await db
      .insert(chatRooms)
      .values({
        propertyId,
        tenantId: actualTenantId,
        ownerId: actualOwnerId,
      })
      .returning();

    return ok({ room, created: true }, 201);
  } catch (error) {
    return handleApiError(error, "POST /api/chat/rooms");
  }
}

export async function GET(req: Request) {
  try {
    const session = await requireSession([
      "cust",
      "owner",
      "admin",
      "staff",
    ] as const);
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit")) || 20;
    const offset = Number(searchParams.get("offset")) || 0;

    const userRole = session.user.role;
    const userId = session.user.id;

    let whereClause;
    if (userRole === "owner") {
      whereClause = eq(chatRooms.ownerId, userId);
    } else if (userRole === "cust") {
      whereClause = eq(chatRooms.tenantId, userId);
    } else {
      whereClause = or(
        eq(chatRooms.tenantId, userId),
        eq(chatRooms.ownerId, userId),
      );
    }

    const [rooms, [{ count }]] = await Promise.all([
      db
        .select()
        .from(chatRooms)
        .where(whereClause)
        .orderBy(desc(chatRooms.lastMessageAt ?? chatRooms.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(chatRooms)
        .where(whereClause),
    ]);

    return ok({
      data: rooms,
      meta: {
        total: Number(count),
        limit,
        offset,
      },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/chat/rooms");
  }
}
