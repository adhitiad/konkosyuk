import { NextRequest } from "next/server";
import { db } from "@/db";
import { inspections, inspectionItems, bookings } from "@/db/schema";
import { ok, fail, handleApiError } from "@/lib/api";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return fail("bookingId wajib diisi", 400);
    }

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return fail("Booking tidak ditemukan", 404);
    }

    const moveIn = await db
      .select()
      .from(inspections)
      .where(
        and(
          eq(inspections.bookingId, bookingId),
          eq(inspections.type, "move_in"),
        ),
      )
      .limit(1);

    const moveOut = await db
      .select()
      .from(inspections)
      .where(
        and(
          eq(inspections.bookingId, bookingId),
          eq(inspections.type, "move_out"),
        ),
      )
      .limit(1);

    if (moveIn.length === 0 || moveOut.length === 0) {
      return fail("Move-in atau move-out inspection belum lengkap", 400);
    }

    const moveInItems = await db
      .select()
      .from(inspectionItems)
      .where(eq(inspectionItems.inspectionId, moveIn[0].id))
      .orderBy(desc(inspectionItems.createdAt));

    const moveOutItems = await db
      .select()
      .from(inspectionItems)
      .where(eq(inspectionItems.inspectionId, moveOut[0].id))
      .orderBy(desc(inspectionItems.createdAt));

    const comparison = moveOutItems.map((moveOutItem) => {
      const matchingMoveIn = moveInItems.find(
        (mi) =>
          mi.category === moveOutItem.category &&
          mi.itemName === moveOutItem.itemName,
      );

      const isNewDamage =
        moveOutItem.isNewDamage ||
        ((moveOutItem.condition === "damaged" ||
          moveOutItem.condition === "missing") &&
          (!matchingMoveIn ||
            matchingMoveIn.condition === "excellent" ||
            matchingMoveIn.condition === "good"));

      return {
        category: moveOutItem.category,
        itemName: moveOutItem.itemName,
        moveInCondition: matchingMoveIn?.condition || "unknown",
        moveOutCondition: moveOutItem.condition,
        isNewDamage,
        repairCost: moveOutItem.repairCost,
        notes: moveOutItem.notes,
      };
    });

    const totalDamageCost = comparison.reduce(
      (sum, item) => sum + Number(item.repairCost || 0),
      0,
    );

    return ok({
      moveIn: {
        ...moveIn[0],
        items: moveInItems,
      },
      moveOut: {
        ...moveOut[0],
        items: moveOutItems,
      },
      comparison,
      summary: {
        totalItems: comparison.length,
        damagedItems: comparison.filter((i) => i.isNewDamage).length,
        totalDamageCost,
      },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/inspections/compare");
  }
}
