"use server";

import { z } from "zod";
import { hasPocketBasePublicAuthCredentials } from "@/lib/pocketbase/config";
import { createLocalWaitlistEntry } from "@/server/local-store";
import { createPocketBaseWaitlistEntry } from "@/server/pocketbase-store";

const waitlistSchema = z.object({
  businessSlug: z.string().min(2).max(80),
  serviceId: z.string().min(1),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.union([z.string().min(6).max(30), z.literal("")]).optional(),
});

export type WaitlistActionResult =
  | { success: true }
  | { success: false; error: string };

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
    const canUsePocketBase = hasPocketBasePublicAuthCredentials();
    if (canUsePocketBase) {
      await createPocketBaseWaitlistEntry({
        ...parsed.data,
        phone: parsed.data.phone || undefined,
      });
    } else {
      await createLocalWaitlistEntry({
        ...parsed.data,
        phone: parsed.data.phone || undefined,
      });
    }
    return { success: true };
  } catch (err) {
    console.error(`[Waitlist] Error:`, err);
    return { success: false, error: "No se pudo registrar. Intentá de nuevo." };
  }
}
