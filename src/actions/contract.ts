"use server";

import { db } from "@/db";
import { userContracts, bookings, properties, units, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { generateContract } from "@/lib/pdf-generator";

const generateContractSchema = z.object({
  bookingId: z.string().uuid(),
});

export type GenerateContractState = {
  success?: boolean;
  contractUrl?: string;
  error?: string;
};

export async function generateContractAction(
  prevState: GenerateContractState | undefined,
  formData: FormData,
): Promise<GenerateContractState> {
  try {
    const validated = generateContractSchema.parse({
      bookingId: formData.get("bookingId"),
    });

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Unauthorized", success: false };
    }

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, validated.bookingId))
      .limit(1);

    if (!booking) {
      return { error: "Booking not found", success: false };
    }

    if (booking.userId !== session.user.id) {
      return { error: "Forbidden", success: false };
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, booking.propertyId))
      .limit(1);

    if (!property) {
      return { error: "Property not found", success: false };
    }

    const [unit] = await db
      .select()
      .from(units)
      .where(eq(units.id, booking.unitId))
      .limit(1);

    if (!unit) {
      return { error: "Unit not found", success: false };
    }

    const [tenant] = await db
      .select()
      .from(users)
      .where(eq(users.id, booking.userId))
      .limit(1);

    if (!tenant) {
      return { error: "Tenant not found", success: false };
    }

    const [owner] = await db
      .select()
      .from(users)
      .where(eq(users.id, property.ownerId))
      .limit(1);

    const totalPrice = Number(property.basePrice) || 0;
    const dpAmount = totalPrice * 0.35;
    const remainingAmount = totalPrice - dpAmount;

    const pdfBlob = await generateContract({
      tenantName: tenant.name,
      tenantEmail: tenant.email,
      propertyName: property.name,
      propertyAddress: property.address,
      unitName: unit.name,
      startDate: new Date(booking.startDate).toLocaleDateString("id-ID"),
      endDate: new Date(booking.endDate).toLocaleDateString("id-ID"),
      totalPrice,
      dpAmount,
      remainingAmount,
    });

    const contractUrl = `contracts/${validated.bookingId}.pdf`;

    const [existingContract] = await db
      .select()
      .from(userContracts)
      .where(eq(userContracts.bookingId, validated.bookingId))
      .limit(1);

    if (existingContract) {
      await db
        .update(userContracts)
        .set({
          contractUrl,
          status: "generated",
          updatedAt: new Date(),
        })
        .where(eq(userContracts.id, existingContract.id));
    } else {
      await db.insert(userContracts).values({
        userId: session.user.id,
        bookingId: validated.bookingId,
        propertyId: booking.propertyId,
        contractUrl,
        status: "generated",
      });
    }

    return {
      success: true,
      contractUrl,
    };
  } catch (error) {
    console.error("Contract generation error:", error);
    return { error: "Failed to generate contract", success: false };
  }
}
