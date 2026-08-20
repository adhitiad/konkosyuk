import { db } from "@/db";
import {
  payments,
  bookings,
  units,
  properties,
  webhookEvents,
  bookingRequests,
  users,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getPaymentProvider } from "./index";
import type { WebhookContext, NormalizedWebhook } from "./types";
import { sendPaymentReceivedEmail } from "@/lib/notifications/email";
import { dispatchNotification } from "@/lib/notification-service";
import crypto from "node:crypto";

export async function handleWebhookRequest(
  providerName: string,
  ctx: WebhookContext,
) {
  const adapter = getPaymentProvider(providerName);
  if (!adapter) {
    return new Response("Unknown provider", { status: 400 });
  }

  const isValid = await adapter.verifyWebhookSignature(ctx);
  if (!isValid) {
    return new Response("Invalid signature", { status: 401 });
  }

  let normalized: NormalizedWebhook;
  try {
    normalized = await adapter.normalizeWebhook(ctx);
  } catch {
    return new Response("Invalid webhook payload", { status: 400 });
  }

  const webhookHash = crypto
    .createHash("sha256")
    .update(ctx.rawBody)
    .digest("hex");

  const [existingByHash] = await db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.payloadHash, webhookHash))
    .limit(1);

  if (existingByHash) {
    return new Response("Duplicate webhook payload detected", { status: 200 });
  }

  const [event] = await db
    .insert(webhookEvents)
    .values({
      provider: normalized.provider,
      eventId: normalized.eventId,
      payload: Object.fromEntries(ctx.headers.entries()),
      payloadHash: webhookHash,
      signatureValid: true,
    })
    .onConflictDoNothing({
      target: [webhookEvents.provider, webhookEvents.eventId],
    })
    .returning();

  if (!event) {
    return new Response("Event already processed", { status: 200 });
  }

  const newStatus =
    normalized.status === "success"
      ? "success"
      : normalized.status === "failed"
        ? "failed"
        : normalized.status === "expired"
          ? "expired"
          : "pending";

  await db.transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.transactionId, normalized.transactionId))
      .for("update")
      .limit(1);

    if (!payment) {
      return new Response("Payment not found", { status: 404 });
    }

    if (payment.status === "success") {
      await tx
        .update(webhookEvents)
        .set({ processedAt: new Date() })
        .where(eq(webhookEvents.id, event.id));

      return new Response("Already processed", { status: 200 });
    }

    const expectedAmount = Number(payment.amount);
    const receivedAmount = Number(normalized.amount);

    if (Math.abs(expectedAmount - receivedAmount) > 100) {
      await tx
        .update(webhookEvents)
        .set({
          processedAt: new Date(),
          details: {
            amountMismatch: true,
            expected: expectedAmount,
            received: receivedAmount,
          } as Record<string, unknown>,
        })
        .where(eq(webhookEvents.id, event.id));

      return new Response("Amount mismatch - manual review required", {
        status: 400,
      });
    }

    await tx
      .update(payments)
      .set({
        status: newStatus,
        paidAt: normalized.paidAt,
        rawResponse: normalized.metadata,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    let booking:
      | {
          id: string;
          userId: string;
          propertyId: string;
          bookingType: string;
          unitId: string;
        }
      | undefined;

    if (newStatus === "success") {
      if (payment.purpose === "featured_listing" && payment.propertyId) {
        const featuredUntil = new Date();
        featuredUntil.setDate(featuredUntil.getDate() + 30);

        await tx
          .update(properties)
          .set({
            isFeatured: true,
            featuredUntil,
            updatedAt: new Date(),
          })
          .where(eq(properties.id, payment.propertyId));
      } else if (payment.purpose === "full_payment") {
        const [foundBooking] = await tx
          .select()
          .from(bookings)
          .where(eq(bookings.id, payment.bookingId))
          .for("update")
          .limit(1);

        if (foundBooking) {
          booking = foundBooking;

          await tx
            .update(bookings)
            .set({ status: "confirmed", updatedAt: new Date() })
            .where(eq(bookings.id, foundBooking.id));

          await tx
            .update(units)
            .set({ status: "booked", updatedAt: new Date() })
            .where(eq(units.id, foundBooking.unitId));
        }
      } else if (payment.purpose === "dp") {
        const [foundBooking] = await tx
          .select()
          .from(bookings)
          .where(eq(bookings.id, payment.bookingId))
          .for("update")
          .limit(1);

        if (foundBooking) {
          booking = foundBooking;

          const nextStatus =
            foundBooking.bookingType === "request"
              ? "awaiting_owner_approval"
              : "awaiting_full_payment";

          await tx
            .update(bookings)
            .set({ status: nextStatus, updatedAt: new Date() })
            .where(eq(bookings.id, foundBooking.id));
        }
      }

      let targetPropertyId = payment.propertyId;
      let tenantName: string | undefined;

      if (payment.bookingId) {
        const [relatedBooking] = await tx
          .select()
          .from(bookings)
          .where(eq(bookings.id, payment.bookingId))
          .limit(1);

        if (relatedBooking) {
          targetPropertyId ??= relatedBooking.propertyId;

          const [tenant] = await tx
            .select()
            .from(users)
            .where(eq(users.id, relatedBooking.userId))
            .limit(1);

          tenantName = tenant?.name;
        }
      }

      if (targetPropertyId) {
        const [property] = await tx
          .select()
          .from(properties)
          .where(eq(properties.id, targetPropertyId))
          .limit(1);

        if (property) {
          const [owner] = await tx
            .select()
            .from(users)
            .where(eq(users.id, property.ownerId))
            .limit(1);

          if (owner?.email) {
            sendPaymentReceivedEmail(
              owner.email,
              owner.name,
              tenantName ?? "Tenant",
              property.name,
              Number(payment.amount),
              `${process.env.NEXT_PUBLIC_APP_URL}/owner/payments`,
            ).catch((err) =>
              console.error("Failed to send payment received email:", err),
            );
          }

          if (payment.purpose === "full_payment" && booking) {
            dispatchNotification({
              userId: booking.userId,
              type: "payment_full_paid",
              category: "payment",
              priority: "normal",
              title: "Pembayaran Lengkap Diterima",
              message: `Pembayaran lengkap untuk ${property.name} telah diterima.`,
              actionUrl: "/dashboard/bookings",
              referenceId: booking.id,
              referenceType: "booking",
              metadata: {
                ownerEmail: owner?.email,
                ownerName: owner?.name,
                propertyName: property.name,
                unitName: booking.unitId,
                amount: Number(payment.amount),
                paymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings`,
              },
            }).catch((err) =>
              console.error("Failed to dispatch payment notification:", err),
            );
          } else if (payment.purpose === "dp" && booking) {
            dispatchNotification({
              userId: booking.userId,
              type: "payment_dp_paid",
              category: "payment",
              priority: "normal",
              title: "DP Diterima",
              message: `DP untuk ${property.name} telah diterima. Menunggu approval owner.`,
              actionUrl: "/dashboard/bookings",
              referenceId: booking.id,
              referenceType: "booking",
            }).catch((err) =>
              console.error("Failed to dispatch dp notification:", err),
            );
          }
        }
      }
    }

    if (newStatus === "failed" || newStatus === "expired") {
      if (payment.purpose !== "featured_listing") {
        const [foundBooking] = await tx
          .select()
          .from(bookings)
          .where(eq(bookings.id, payment.bookingId))
          .for("update")
          .limit(1);

        if (foundBooking) {
          booking = foundBooking;

          await tx
            .update(bookings)
            .set({ status: "cancelled", updatedAt: new Date() })
            .where(eq(bookings.id, foundBooking.id));

          dispatchNotification({
            userId: foundBooking.userId,
            type: "payment_failed",
            category: "payment",
            priority: "high",
            title: "Pembayaran Gagal",
            message:
              "Pembayaran Anda gagal atau kadaluarsa. Booking telah dibatalkan.",
            actionUrl: "/dashboard/bookings",
            referenceId: foundBooking.id,
            referenceType: "booking",
          }).catch((err) =>
            console.error(
              "Failed to dispatch payment failed notification:",
              err,
            ),
          );

          const [bookingRequest] = await tx
            .select()
            .from(bookingRequests)
            .where(
              and(
                eq(bookingRequests.tenantId, booking.userId),
                eq(bookingRequests.unitId, booking.unitId),
                eq(bookingRequests.propertyId, booking.propertyId),
                eq(bookingRequests.status, "approved"),
              ),
            )
            .for("update")
            .limit(1);

          if (bookingRequest) {
            await tx
              .update(bookingRequests)
              .set({ status: "cancelled", updatedAt: new Date() })
              .where(eq(bookingRequests.id, bookingRequest.id));

            await tx
              .update(units)
              .set({ status: "available", updatedAt: new Date() })
              .where(eq(units.id, booking.unitId));
          }
        }
      }
    }

    await tx
      .update(webhookEvents)
      .set({ processedAt: new Date() })
      .where(eq(webhookEvents.id, event.id));
  });

  return new Response("Webhook processed", { status: 200 });
}
