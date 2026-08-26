import { z } from "zod";
export declare const createReferralSchema: z.ZodObject<{
    refereeEmail: z.ZodString;
    refereeName: z.ZodString;
    category: z.ZodDefault<z.ZodEnum<{
        owner: "owner";
        tenant: "tenant";
    }>>;
    propertyId: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const referralQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    category: z.ZodOptional<z.ZodEnum<{
        owner: "owner";
        tenant: "tenant";
    }>>;
    status: z.ZodOptional<z.ZodEnum<{
        pending: "pending";
        cancelled: "cancelled";
        completed: "completed";
        failed: "failed";
        verifying: "verifying";
        eligible: "eligible";
    }>>;
}, z.core.$strip>;
export declare const redeemRewardSchema: z.ZodObject<{
    rewardId: z.ZodString;
}, z.core.$strip>;
export declare const loyaltyTransactionSchema: z.ZodObject<{
    userId: z.ZodString;
    amount: z.ZodCoercedNumber<unknown>;
    type: z.ZodEnum<{
        earn: "earn";
        redeem: "redeem";
        expire: "expire";
        bonus: "bonus";
    }>;
    description: z.ZodString;
    referenceId: z.ZodOptional<z.ZodString>;
    referenceType: z.ZodOptional<z.ZodString>;
    expiresAt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const loyaltyQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    type: z.ZodOptional<z.ZodEnum<{
        earn: "earn";
        redeem: "redeem";
        expire: "expire";
        bonus: "bonus";
    }>>;
}, z.core.$strip>;
export declare const createGroupBookingSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    propertyId: z.ZodString;
    unitId: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodString;
    maxMembers: z.ZodCoercedNumber<unknown>;
    memberIds: z.ZodArray<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const updateGroupBookingSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        pending: "pending";
        cancelled: "cancelled";
        confirmed: "confirmed";
        completed: "completed";
    }>>;
    maxMembers: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const groupBookingQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    status: z.ZodOptional<z.ZodEnum<{
        pending: "pending";
        cancelled: "cancelled";
        confirmed: "confirmed";
        completed: "completed";
    }>>;
    propertyId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const referralActionSchema: z.ZodObject<{
    id: z.ZodString;
    action: z.ZodEnum<{
        convert_voucher: "convert_voucher";
        apply_offset: "apply_offset";
    }>;
}, z.core.$strip>;
export type CreateReferralInput = z.infer<typeof createReferralSchema>;
export type ReferralQuery = z.infer<typeof referralQuerySchema>;
export type RedeemRewardInput = z.infer<typeof redeemRewardSchema>;
export type LoyaltyTransactionInput = z.infer<typeof loyaltyTransactionSchema>;
export type LoyaltyQuery = z.infer<typeof loyaltyQuerySchema>;
export type CreateGroupBookingInput = z.infer<typeof createGroupBookingSchema>;
export type UpdateGroupBookingInput = z.infer<typeof updateGroupBookingSchema>;
export type GroupBookingQuery = z.infer<typeof groupBookingQuerySchema>;
//# sourceMappingURL=referrals-loyalty.d.ts.map