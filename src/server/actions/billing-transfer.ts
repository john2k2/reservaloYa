"use server";

import { revalidatePath } from "next/cache";

import { getBlueDollarRate } from "@/lib/dollar-rate";
import { createAdminClient } from "@/lib/supabase/server";
import { getSubscriptionArsPrice } from "@/server/payments-domain";
import { submitTransferClaim } from "@/server/billing-transfer-claims";
import { getAuthenticatedSupabaseUser } from "@/server/supabase-auth";
import { resolveSubscriptionStatus } from "@/server/supabase-store/helpers";

export type SubmitTransferReceiptResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitTransferReceiptAction(
  formData: FormData
): Promise<SubmitTransferReceiptResult> {
  const user = await getAuthenticatedSupabaseUser();
  if (!user?.businessId) {
    return { ok: false, error: "Tenés que iniciar sesión para enviar el comprobante." };
  }

  const { subscriptionExpired } = await resolveSubscriptionStatus(
    createAdminClient(),
    user.businessId
  );
  if (!subscriptionExpired) {
    return {
      ok: false,
      error: "Tu suscripción está activa. No hace falta enviar un comprobante.",
    };
  }

  const file = formData.get("receipt");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Seleccioná una imagen o PDF del comprobante." };
  }

  const blueRate = await getBlueDollarRate();
  const amountArs = getSubscriptionArsPrice(blueRate);

  try {
    await submitTransferClaim({
      businessId: user.businessId,
      amountArs: amountArs > 0 ? Math.round(amountArs) : null,
      file,
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "No se pudo enviar el comprobante.",
    };
  }

  revalidatePath("/admin/subscription/pay");
  revalidatePath("/platform/dashboard");
  revalidatePath("/platform/businesses");
  return { ok: true };
}
