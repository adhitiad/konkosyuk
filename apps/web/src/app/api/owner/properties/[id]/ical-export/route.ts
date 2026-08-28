import { NextRequest } from "next/server";
import { db } from "@/db";
import { properties, bookings } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { fail, handleApiError } from "@/lib/api";
import { generateIcalString } from "@/lib/ical/ical-generator";
import type { Role } from "@/lib/auth";

export async function GET(
  __req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession(["owner", "admin"] as Role[]);
    const { id: propertyId } = await params;

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!property) {
      return fail("Property not found", 404);
    }

    if (session.user.role !== "admin" && property.ownerId !== session.user.id) {
      return fail("Forbidden", 403);
    }

    const confirmedBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.propertyId, propertyId),
          or(
            eq(bookings.status, "confirmed"),
            eq(bookings.status, "completed"),
          ),
        ),
      );

    const bookedDates: Date[] = [];
    for (const booking of confirmedBookings) {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      const current = new Date(start);
      while (current <= end) {
        bookedDates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    }

    const icalString = generateIcalString(propertyId, bookedDates);

    return new Response(icalString, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="property-${propertyId}-booked-dates.ics"`,
      },
    });
  } catch (error) {
    return handleApiError(error, "GET /api/owner/properties/[id]/ical-export");
  }
}
