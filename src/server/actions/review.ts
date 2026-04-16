"use server";

import { z } from "zod";
import { isPocketBaseConfigured } from "@/lib/pocketbase/config";
import { isValidBookingManageToken } from "@/server/public-booking-links";
import { createLocalReview } from "@/server/local-store";
import { createPocketBaseReview } from "@/server/pocketbase-store";

const reviewSchema = z.object({
  businessSlug: z.string().min(2).max(80),
  bookingId: z.string().min(1),
  manageToken: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export type ReviewActionResult =
  | { success: true }
  | { success: false; error: string };

export async function submitReviewAction(
  _prev: ReviewActionResult | null,
  formData: FormData
): Promise<ReviewActionResult> {
  const raw = {
    businessSlug: String(formData.get("businessSlug") ?? ""),
    bookingId: String(formData.get("bookingId") ?? ""),
    manageToken: String(formData.get("manageToken") ?? ""),
    rating: String(formData.get("rating") ?? ""),
    comment: String(formData.get("comment") ?? "") || undefined,
  };

  const parsed = reviewSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: "Revisá los datos ingresados." };
  }

  if (
    !isValidBookingManageToken({
      slug: parsed.data.businessSlug,
      bookingId: parsed.data.bookingId,
      token: parsed.data.manageToken,
    })
  ) {
    return { success: false, error: "Link inválido o expirado." };
  }

  try {
    if (isPocketBaseConfigured()) {
      await createPocketBaseReview({
        businessSlug: parsed.data.businessSlug,
        bookingId: parsed.data.bookingId,
        rating: parsed.data.rating as 1 | 2 | 3 | 4 | 5,
        comment: parsed.data.comment,
      });
    } else {
      await createLocalReview({
        businessSlug: parsed.data.businessSlug,
        bookingId: parsed.data.bookingId,
        rating: parsed.data.rating as 1 | 2 | 3 | 4 | 5,
        comment: parsed.data.comment,
      });
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "No se pudo guardar la reseña.",
    };
  }
}
