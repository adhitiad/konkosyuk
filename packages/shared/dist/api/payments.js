import { z } from "zod";
import { BANK_ACCOUNT_TYPES } from "../constants/enums";
export const addBankAccountSchema = z.object({
    account_type: z.enum(BANK_ACCOUNT_TYPES),
    provider_name: z.string().min(1),
    account_number: z
        .string()
        .min(5)
        .max(30)
        .regex(/^\d+$/, "Nomor rekening hanya boleh angka"),
    account_name: z.string().min(3).max(100),
});
export const createWithdrawalSchema = z.object({
    bank_account_id: z.string().uuid(),
    amount: z.coerce.number().positive("Jumlah penarikan harus lebih dari 0"),
});
