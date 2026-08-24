import { z } from "zod";
import {
  BOOKING_TYPES,
  PAYMENT_PROVIDERS,
  PAYMENT_PURPOSES,
} from "../constants/enums";

export const createBookingSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid(),
  packageId: z.string().min(1),
  customDuration: z.coerce.number().int().positive().optional(),
  bookingType: z.enum(BOOKING_TYPES),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  paymentType: z.enum(PAYMENT_PURPOSES).default("dp"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const bookingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  status: z.string().optional(),
});

export const checkoutBookingSchema = z.object({
  paymentProvider: z.enum(PAYMENT_PROVIDERS),
});

export const checkoutFeaturedSchema = z.object({
  paymentProvider: z.enum(PAYMENT_PROVIDERS),
});

export const reviewBookingSchema = z.object({
  status: z.enum(["confirmed", "rejected"]),
  note: z.string().optional(),
});

export const ipaymuWebhookSchema = z.object({
  transaction_id: z.string().optional(),
  reference_id: z.string().optional(),
  status: z.string().optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  payment_method: z.string().optional(),
  payment_time: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingQuery = z.infer<typeof bookingQuerySchema>;
export type CheckoutBookingInput = z.infer<typeof checkoutBookingSchema>;
export type ReviewBookingInput = z.infer<typeof reviewBookingSchema>;
export type IpaymuWebhookInput = z.infer<typeof ipaymuWebhookSchema>;
