"use server";

import { redirect } from "next/navigation";

import { requireAdminRouteAccess } from "@/server/admin-access";
import { cancelSupabaseSubscription } from "@/server/supabase-store";

export async function cancelSubscriptionAction(formData: FormData) {
  const shellData = await requireAdminRouteAccess("/admin/billing");

  const confirm = String(formData.get("confirm") ?? "").trim();
  if (confirm !== "CANCELAR") {
    redirect("/admin/billing?error=Escribí CANCELAR para confirmar.");
  }

  if (!shellData.businessId) {
    redirect("/admin/billing?error=No encontramos tu negocio.");
  }

  try {
    await cancelSupabaseSubscription(shellData.businessId);
  } catch (error) {
    redirect(
      `/admin/billing?error=${encodeURIComponent(
        error instanceof Error ? error.message : "No se pudo cancelar la suscripción."
      )}`
    );
  }

  redirect("/admin/billing?cancelled=1");
}
