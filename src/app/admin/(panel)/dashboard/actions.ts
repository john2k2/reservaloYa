"use server";

import { redirect } from "next/navigation";

import { requireAdminRouteAccess } from "@/server/admin-access";
import { runSupabaseBookingReminderSweep } from "@/server/supabase-store";

export async function runLocalReminderSweepAction() {
  const shellData = await requireAdminRouteAccess("/admin/dashboard");

  if (!shellData.businessId || shellData.demoMode) {
    redirect("/admin/dashboard?error=Los recordatorios solo estan disponibles en modo Supabase.");
  }

  try {
    const result = await runSupabaseBookingReminderSweep({ businessId: shellData.businessId });
    const message =
      result.sent > 0
        ? `Se enviaron ${result.sent} recordatorio${result.sent !== 1 ? "s" : ""}.`
        : result.candidates > 0
          ? `Hay ${result.candidates} turno${result.candidates !== 1 ? "s" : ""} con recordatorio pendiente pero no hay proveedor configurado.`
          : "No hay turnos con recordatorio pendiente para las próximas 24hs.";

    redirect(`/admin/dashboard?reminders=${encodeURIComponent(message)}`);
  } catch {
    redirect("/admin/dashboard?error=No%20se%20pudo%20enviar%20los%20recordatorios.");
  }
}
