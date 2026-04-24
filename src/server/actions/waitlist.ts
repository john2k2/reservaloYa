"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createSupabaseWaitlistEntry } from "@/server/supabase-store";
import { createLogger } from "@/server/logger";
import { RateLimitError, assertRateLimit, getRateLimitIdentifier } from "@/server/rate-limit";
import { futureBookingDateSchema } from "@/lib/validations/booking";

const logger = createLogger("Waitlist");
const WAITLIST_LIMIT_MAX = 5;
const WAITLIST_LIMIT_WINDOW_MS = 60_000;

const waitlistSchema = z.object({
  businessSlug: z.string().min(2).max(80),
  serviceId: z.string().min(1),
  bookingDate: futureBookingDateSchema,
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.union([z.string().min(6).max(30), z.literal("")]).optional(),
});

export type WaitlistActionResult =
  | { success: true }
  | { success: false; error: string };

async function enforceWaitlistRateLimit(input: {
  businessSlug: string;
  email: string;
  bookingDate: string;
}) {
  const requestHeaders = await headers();
  const clientId = getRateLimitIdentifier(requestHeaders, "public-waitlist");

  await assertRateLimit({
    bucket: "public-waitlist",
    identifier: `${input.businessSlug}:${clientId}:${input.email}:${input.bookingDate}`,
    max: WAITLIST_LIMIT_MAX,
    windowMs: WAITLIST_LIMIT_WINDOW_MS,
    message: "Demasiados intentos de lista de espera. Intenta nuevamente en unos segundos.",
  });
}

export async function joinWaitlistAction(
  _prev: WaitlistActionResult | null,
  formData: FormData
): Promise<WaitlistActionResult> {
  const raw = {
    businessSlug: String(formData.get("businessSlug") ?? ""),
    serviceId: String(formData.get("serviceId") ?? ""),
    bookingDate: String(formData.get("bookingDate") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  };

  const parsed = waitlistSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: "Revisá los datos ingresados." };
  }

  try {
    await enforceWaitlistRateLimit({
      businessSlug: parsed.data.businessSlug,
      email: parsed.data.email,
      bookingDate: parsed.data.bookingDate,
    });

    await createSupabaseWaitlistEntry({
      ...parsed.data,
      phone: parsed.data.phone || undefined,
    });

    return { success: true };
  } catch (err) {
    if (err instanceof RateLimitError) {
      return {
        success: false,
        error: `${err.message} Reintenta en ${err.retryAfterSeconds}s.`,
      };
    }

    logger.error("Error registrando en waitlist", err);
    return { success: false, error: "No se pudo registrar. Intentá de nuevo." };
  }
}
