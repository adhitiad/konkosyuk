"use server";

import { db } from "@/db";
import { feedbacks } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

const feedbackSchema = z.object({
  category: z.enum(["bug", "feature", "improvement", "other"]),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000),
  rating: z.coerce.number().min(1).max(5).optional(),
});

export type SubmitFeedbackState = {
  success?: boolean;
  error?: string;
};

export async function submitFeedbackAction(
  prevState: SubmitFeedbackState | undefined,
  formData: FormData,
): Promise<SubmitFeedbackState> {
  try {
    const validated = feedbackSchema.parse({
      category: formData.get("category"),
      message: formData.get("message"),
      rating: formData.get("rating"),
    });

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { error: "Tidak berwenang", success: false };
    }

    await db.insert(feedbacks).values({
      userId: session.user.id,
      category: validated.category,
      message: validated.message,
      rating: validated.rating || null,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: error.issues[0]?.message || "Masukan tidak valid",
        success: false,
      };
    }
    return { error: "Gagal mengirim umpan balik", success: false };
  }
}
