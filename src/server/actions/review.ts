"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { isValidBookingReviewToken } from "@/server/public-booking-links";
import { createSupabaseReview } from "@/server/supabase-store";
import { RateLimitError, assertRateLimit, getRateLimitIdentifier } from "@/server/rate-limit";

const REVIEW_LIMIT_MAX = 10;
const REVIEW_LIMIT_WINDOW_MS = 60_000;
const REVIEW_BOOKING_LIMIT_MAX = 5;
const REVIEW_BOOKING_LIMIT_WINDOW_MS = 10 * 60_000;

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

  try {
    const requestHeaders = await headers();
    const clientId = getRateLimitIdentifier(requestHeaders, "public-review");

    // Bucket 1: IP + negocio — no controlable por quien ataca, rotar el
    // bookingId no crea un bucket nuevo.
    await assertRateLimit({
      bucket: "public-review-client",
      identifier: `${parsed.data.businessSlug}:${clientId}`,
      max: REVIEW_LIMIT_MAX,
      windowMs: REVIEW_LIMIT_WINDOW_MS,
      message: "Demasiados intentos de reseña. Intenta nuevamente en unos segundos.",
    });

    // Bucket 2: bookingId — evita reenvíos indefinidos sobre el mismo turno
    // aunque el link (token HMAC) haya sido filtrado.
    await assertRateLimit({
      bucket: "public-review-booking",
      identifier: parsed.data.bookingId,
      max: REVIEW_BOOKING_LIMIT_MAX,
      windowMs: REVIEW_BOOKING_LIMIT_WINDOW_MS,
      message: "Demasiados intentos de reseña para este turno. Intenta nuevamente en unos minutos.",
    });

    if (
      !isValidBookingReviewToken({
        slug: parsed.data.businessSlug,
        bookingId: parsed.data.bookingId,
        token: parsed.data.manageToken,
      })
    ) {
      return { success: false, error: "Link inválido o expirado." };
    }

    await createSupabaseReview({
      businessSlug: parsed.data.businessSlug,
      bookingId: parsed.data.bookingId,
      rating: parsed.data.rating as 1 | 2 | 3 | 4 | 5,
      comment: parsed.data.comment,
    });

    return { success: true };
  } catch (err) {
    if (err instanceof RateLimitError) {
      return {
        success: false,
        error: `${err.message} Reintenta en ${err.retryAfterSeconds}s.`,
      };
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : "No se pudo guardar la reseña.",
    };
  }
}
