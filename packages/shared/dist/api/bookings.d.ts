import { z } from "zod";
export declare const createBookingSchema: z.ZodObject<{
    propertyId: z.ZodString;
    unitId: z.ZodString;
    packageId: z.ZodString;
    customDuration: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    bookingType: z.ZodEnum<{
        instant: "instant";
        request: "request";
    }>;
    startDate: z.ZodString;
    endDate: z.ZodOptional<z.ZodString>;
    paymentType: z.ZodDefault<z.ZodEnum<{
        dp: "dp";
        full_payment: "full_payment";
        featured_listing: "featured_listing";
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const bookingQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    status: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const checkoutBookingSchema: z.ZodObject<{
    paymentProvider: z.ZodEnum<{
        doku: "doku";
        ipaymu: "ipaymu";
        nicepay: "nicepay";
        mock: "mock";
    }>;
}, z.core.$strip>;
export declare const checkoutFeaturedSchema: z.ZodObject<{
    paymentProvider: z.ZodEnum<{
        doku: "doku";
        ipaymu: "ipaymu";
        nicepay: "nicepay";
        mock: "mock";
    }>;
}, z.core.$strip>;
export declare const reviewBookingSchema: z.ZodObject<{
    status: z.ZodEnum<{
        rejected: "rejected";
        confirmed: "confirmed";
    }>;
    note: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const ipaymuWebhookSchema: z.ZodObject<{
    transaction_id: z.ZodOptional<z.ZodString>;
    reference_id: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    amount: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
    payment_method: z.ZodOptional<z.ZodString>;
    payment_time: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingQuery = z.infer<typeof bookingQuerySchema>;
export type CheckoutBookingInput = z.infer<typeof checkoutBookingSchema>;
export type ReviewBookingInput = z.infer<typeof reviewBookingSchema>;
export type IpaymuWebhookInput = z.infer<typeof ipaymuWebhookSchema>;
//# sourceMappingURL=bookings.d.ts.map