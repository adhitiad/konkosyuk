import { z } from "zod";
export const updateUserProfileSchema = z.object({
    phone: z
        .string()
        .min(10, "Nomor telepon minimal 10 digit")
        .regex(/^[0-9+]+$/, "Nomor telepon hanya boleh angka dan tanda +"),
    whatsapp: z.string().min(10, "WhatsApp minimal 10 digit"),
    telegram: z.string().min(5, "Telegram minimal 5 karakter"),
    email: z.string().email("Format email tidak valid"),
});
