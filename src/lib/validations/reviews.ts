import { z } from "zod";

export const createReviewSchema = z.object({
  type: z.enum(["tenant", "property"]),
  rating: z.coerce.number().min(1).max(5),
  comment: z
    .string()
    .min(10, "Review must be at least 10 characters")
    .max(1000),
  bookingId: z.string().uuid(),
  reviewedUserId: z.string().uuid().optional(),
  propertyId: z.string().uuid(),
});

export const updateReviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5).optional(),
  comment: z
    .string()
    .min(10, "Review must be at least 10 characters")
    .max(1000)
    .optional(),
});

export const replySchema = z.object({
  content: z.string().min(1, "Reply cannot be empty").max(1000),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ReplyInput = z.infer<typeof replySchema>;
