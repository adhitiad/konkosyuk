import { z } from "zod";
export declare const addBankAccountSchema: z.ZodObject<{
    account_type: z.ZodEnum<{
        bank: "bank";
        ewallet: "ewallet";
    }>;
    provider_name: z.ZodString;
    account_number: z.ZodString;
    account_name: z.ZodString;
}, z.core.$strip>;
export declare const createWithdrawalSchema: z.ZodObject<{
    bank_account_id: z.ZodString;
    amount: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export type AddBankAccountInput = z.infer<typeof addBankAccountSchema>;
export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>;
//# sourceMappingURL=payments.d.ts.map