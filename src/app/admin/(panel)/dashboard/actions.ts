"use server";

import { redirect } from "next/navigation";

import { isPocketBaseConfigured } from "@/lib/pocketbase/config";
import { getLocalActiveBusinessSlug } from "@/server/local-admin-context";
import { runLocalBookingReminderSweep } from "@/server/local-store";
import { getAuthenticatedPocketBaseUser } from "@/server/pocketbase-auth";
import { runPocketBaseBookingReminderSweep } from "@/server/pocketbase-store";

export async function runLocalReminderSweepAction() {
  const result = isPocketBaseConfigured()
    ? await (async () => {
        const user = await getAuthenticatedPocketBaseUser();
        const businessId = Array.isArray(user?.business) ? user?.business[0] : user?.business;

        return runPocketBaseBookingReminderSweep({
          businessId: businessId ? String(businessId) : undefined,
        });
      })()
    : await (async () => {
        const businessSlug = await getLocalActiveBusinessSlug();
        return runLocalBookingReminderSweep({
          businessSlug: businessSlug ?? undefined,
        });
      })();

  const message =
    result.sent > 0
      ? `Se enviaron ${result.sent} recordatorios.`
      : result.readyWithoutProvider > 0
        ? `Hay ${result.readyWithoutProvider} recordatorios listos. Solo falta configurar email o WhatsApp.`
        : result.missingEmail > 0
          ? `Hay ${result.missingEmail} turnos sin canal disponible para recordar.`
          : "No había recordatorios pendientes en las próximas 24 hs.";

  redirect(`/admin/dashboard?reminders=${encodeURIComponent(message)}`);
}
