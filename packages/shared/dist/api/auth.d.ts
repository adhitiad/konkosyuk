import { z } from "zod";
export declare const updateUserProfileSchema: z.ZodObject<{
    phone: z.ZodString;
    whatsapp: z.ZodString;
    telegram: z.ZodString;
    email: z.ZodString;
}, z.core.$strip>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
//# sourceMappingURL=auth.d.ts.map