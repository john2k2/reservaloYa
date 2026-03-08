"use server";

import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getLocalActiveBusinessSlug } from "@/server/local-admin-context";
import { runLocalBookingReminderSweep } from "@/server/local-store";

export async function runLocalReminderSweepAction() {
  if (isSupabaseConfigured()) {
    redirect(
      `/admin/dashboard?error=${encodeURIComponent(
        "Los recordatorios automaticos en produccion se activaran cuando conectemos el proveedor real."
      )}`
    );
  }

  const businessSlug = await getLocalActiveBusinessSlug();
  const result = await runLocalBookingReminderSweep({
    businessSlug: businessSlug ?? undefined,
  });

  const message =
    result.sent > 0
      ? `Se enviaron ${result.sent} recordatorios.`
      : result.readyWithoutProvider > 0
        ? `Hay ${result.readyWithoutProvider} recordatorios listos. Solo falta RESEND_API_KEY.`
        : result.missingEmail > 0
          ? `Hay ${result.missingEmail} turnos sin email para recordar.`
          : "No habia recordatorios pendientes en las proximas 24 hs.";

  redirect(`/admin/dashboard?reminders=${encodeURIComponent(message)}`);
}
