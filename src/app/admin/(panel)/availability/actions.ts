"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { addDays, getDayOfWeek } from "@/lib/bookings/format";
import { isPocketBaseConfigured } from "@/lib/pocketbase/config";
import { getLocalActiveBusinessSlug } from "@/server/local-admin-context";
import {
  createLocalBlockedSlots,
  getLocalAdminSettingsData,
  removeLocalBlockedSlot,
  upsertLocalAvailabilityRules,
} from "@/server/local-store";
import { getAuthenticatedPocketBaseUser } from "@/server/pocketbase-auth";
import {
  createPocketBaseBlockedSlots,
  getPocketBaseAdminSettingsData,
  removePocketBaseBlockedSlot,
  upsertPocketBaseAvailabilityRules,
} from "@/server/pocketbase-store";

const availabilityRuleSchema = z.object({
  ruleId: z.string().trim().optional(),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  active: z.boolean(),
});

const blockedSlotSchema = z.object({
  blockedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.string().trim().min(3).max(120),
});

const recurringBlockedSlotSchema = z.object({
  repeatFromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  repeatDayOfWeek: z.coerce.number().int().min(0).max(6),
  repeatWeeks: z.coerce.number().int().min(1).max(26),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.string().trim().min(3).max(120),
});

const dayLabels = [
  "domingo",
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
];

async function getAvailabilityContext() {
  if (isPocketBaseConfigured()) {
    const user = await getAuthenticatedPocketBaseUser();
    const businessId = Array.isArray(user?.business) ? user.business[0] : user?.business;

    if (!businessId) {
      throw new Error("No encontramos el negocio activo.");
    }

    const settings = await getPocketBaseAdminSettingsData(String(businessId));

    return {
      businessId: String(businessId),
      businessSlug: settings.businessSlug,
      live: true as const,
    };
  }

  const activeBusinessSlug = await getLocalActiveBusinessSlug();
  const settings = await getLocalAdminSettingsData(activeBusinessSlug);

  return {
    businessSlug: settings.businessSlug,
    live: false as const,
  };
}

function ensureRange(startTime: string, endTime: string) {
  if (startTime >= endTime) {
    throw new Error("La hora de fin debe quedar después de la hora de inicio.");
  }
}

function getAvailabilityRuleFromFormData(formData: FormData, dayOfWeek: number) {
  const parsed = availabilityRuleSchema.safeParse({
    ruleId: String(formData.get(`ruleId_${dayOfWeek}`) ?? "").trim() || undefined,
    dayOfWeek,
    startTime: String(formData.get(`startTime_${dayOfWeek}`) ?? "").trim(),
    endTime: String(formData.get(`endTime_${dayOfWeek}`) ?? "").trim(),
    active: String(formData.get(`active_${dayOfWeek}`) ?? "") === "true",
  });

  if (!parsed.success) {
    throw new Error(`Revisa el horario de ${dayLabels[dayOfWeek] ?? "ese día"}.`);
  }

  ensureRange(parsed.data.startTime, parsed.data.endTime);
  return parsed.data;
}

function buildWeeklyBlockedDates(input: {
  startDate: string;
  dayOfWeek: number;
  totalWeeks: number;
}) {
  let firstDate = input.startDate;

  for (let offset = 0; offset < 7; offset += 1) {
    const candidate = addDays(input.startDate, offset);

    if (getDayOfWeek(candidate) === input.dayOfWeek) {
      firstDate = candidate;
      break;
    }
  }

  return Array.from({ length: input.totalWeeks }, (_, index) => addDays(firstDate, index * 7));
}

function revalidateAvailabilityViews(businessSlug: string) {
  revalidatePath("/admin/availability");
  revalidatePath(`/${businessSlug}`);
  revalidatePath(`/${businessSlug}/reservar`);
}

export async function saveAvailabilityRulesAction(formData: FormData) {
  try {
    const scope = String(formData.get("scope") ?? "").trim() || "week";
    const targetRules =
      scope === "week"
        ? dayLabels.map((_, dayOfWeek) => getAvailabilityRuleFromFormData(formData, dayOfWeek))
        : (() => {
            const match = scope.match(/^day:(\d)$/);

            if (!match) {
              throw new Error("No encontramos el día a guardar.");
            }

            const dayOfWeek = Number(match[1]);
            return [getAvailabilityRuleFromFormData(formData, dayOfWeek)];
          })();

    const context = await getAvailabilityContext();

    if (context.live) {
      await upsertPocketBaseAvailabilityRules({
        businessId: context.businessId,
        rules: targetRules.map((rule) => ({
          ruleId: rule.ruleId,
          dayOfWeek: rule.dayOfWeek,
          startTime: rule.startTime,
          endTime: rule.endTime,
          active: rule.active,
        })),
      });
    } else {
      await upsertLocalAvailabilityRules({
        businessSlug: context.businessSlug,
        rules: targetRules.map((rule) => ({
          ruleId: rule.ruleId,
          dayOfWeek: rule.dayOfWeek,
          startTime: rule.startTime,
          endTime: rule.endTime,
          active: rule.active,
        })),
      });
    }

    revalidateAvailabilityViews(context.businessSlug);

    if (scope === "week") {
      redirect("/admin/availability?savedWeek=1");
    }

    const savedDay = targetRules[0]?.dayOfWeek ?? 0;
    redirect(`/admin/availability?savedDay=${encodeURIComponent(dayLabels[savedDay] ?? "día")}`);
  } catch (error) {
    unstable_rethrow(error);

    redirect(
      `/admin/availability?error=${encodeURIComponent(
        error instanceof Error ? error.message : "No se pudo guardar el horario."
      )}`
    );
  }
}

export async function createBlockedSlotAction(formData: FormData) {
  try {
    const blockMode = String(formData.get("blockMode") ?? "single").trim();
    const context = await getAvailabilityContext();
    const createdSlots =
      blockMode === "weekly"
        ? (() => {
            const parsed = recurringBlockedSlotSchema.safeParse({
              repeatFromDate: String(formData.get("repeatFromDate") ?? "").trim(),
              repeatDayOfWeek: formData.get("repeatDayOfWeek"),
              repeatWeeks: formData.get("repeatWeeks"),
              startTime: String(formData.get("startTime") ?? "").trim(),
              endTime: String(formData.get("endTime") ?? "").trim(),
              reason: String(formData.get("reason") ?? "").trim(),
            });

            if (!parsed.success) {
              throw new Error("Revisa la repeticion semanal antes de guardar.");
            }

            ensureRange(parsed.data.startTime, parsed.data.endTime);

            return {
              slots: buildWeeklyBlockedDates({
                startDate: parsed.data.repeatFromDate,
                dayOfWeek: parsed.data.repeatDayOfWeek,
                totalWeeks: parsed.data.repeatWeeks,
              }).map((blockedDate) => ({
                blockedDate,
                startTime: parsed.data.startTime,
                endTime: parsed.data.endTime,
                reason: parsed.data.reason,
              })),
              label: `${dayLabels[parsed.data.repeatDayOfWeek] ?? "ese día"} durante ${parsed.data.repeatWeeks} semanas`,
            };
          })()
        : (() => {
            const parsed = blockedSlotSchema.safeParse({
              blockedDate: String(formData.get("blockedDate") ?? "").trim(),
              startTime: String(formData.get("startTime") ?? "").trim(),
              endTime: String(formData.get("endTime") ?? "").trim(),
              reason: String(formData.get("reason") ?? "").trim(),
            });

            if (!parsed.success) {
              throw new Error("Revisa fecha, horario y motivo del bloqueo.");
            }

            ensureRange(parsed.data.startTime, parsed.data.endTime);

            return {
              slots: [
                {
                  blockedDate: parsed.data.blockedDate,
                  startTime: parsed.data.startTime,
                  endTime: parsed.data.endTime,
                  reason: parsed.data.reason,
                },
              ],
              label: parsed.data.blockedDate,
            };
          })();

    const result = context.live
      ? await createPocketBaseBlockedSlots({
          businessId: context.businessId,
          slots: createdSlots.slots,
        })
      : await createLocalBlockedSlots({
          businessSlug: context.businessSlug,
          slots: createdSlots.slots,
        });

    if (result.createdCount === 0) {
      throw new Error("Esos bloqueos ya existen.");
    }

    revalidateAvailabilityViews(context.businessSlug);

    const blockedMessage =
      result.createdCount === 1 && result.skippedCount === 0
        ? `Bloqueo agregado para ${createdSlots.label}.`
        : result.skippedCount > 0
          ? `Se agregaron ${result.createdCount} bloqueos para ${createdSlots.label}. ${result.skippedCount} ya existian.`
          : `Se agregaron ${result.createdCount} bloqueos para ${createdSlots.label}.`;

    redirect(`/admin/availability?blockedMessage=${encodeURIComponent(blockedMessage)}`);
  } catch (error) {
    unstable_rethrow(error);

    redirect(
      `/admin/availability?error=${encodeURIComponent(
        error instanceof Error ? error.message : "No se pudo crear el bloqueo."
      )}`
    );
  }
}

export type BlockedSlotActionState = { ok: true; message: string } | { ok: false; message: string } | null;

export async function createBlockedSlotFormAction(
  _prevState: BlockedSlotActionState,
  formData: FormData
): Promise<BlockedSlotActionState> {
  try {
    const blockMode = String(formData.get("blockMode") ?? "single").trim();
    const context = await getAvailabilityContext();
    const createdSlots =
      blockMode === "weekly"
        ? (() => {
            const parsed = recurringBlockedSlotSchema.safeParse({
              repeatFromDate: String(formData.get("repeatFromDate") ?? "").trim(),
              repeatDayOfWeek: formData.get("repeatDayOfWeek"),
              repeatWeeks: formData.get("repeatWeeks"),
              startTime: String(formData.get("startTime") ?? "").trim(),
              endTime: String(formData.get("endTime") ?? "").trim(),
              reason: String(formData.get("reason") ?? "").trim(),
            });

            if (!parsed.success) {
              throw new Error("Revisa la repeticion semanal antes de guardar.");
            }

            ensureRange(parsed.data.startTime, parsed.data.endTime);

            return {
              slots: buildWeeklyBlockedDates({
                startDate: parsed.data.repeatFromDate,
                dayOfWeek: parsed.data.repeatDayOfWeek,
                totalWeeks: parsed.data.repeatWeeks,
              }).map((blockedDate) => ({
                blockedDate,
                startTime: parsed.data.startTime,
                endTime: parsed.data.endTime,
                reason: parsed.data.reason,
              })),
              label: `${dayLabels[parsed.data.repeatDayOfWeek] ?? "ese día"} durante ${parsed.data.repeatWeeks} semanas`,
            };
          })()
        : (() => {
            const parsed = blockedSlotSchema.safeParse({
              blockedDate: String(formData.get("blockedDate") ?? "").trim(),
              startTime: String(formData.get("startTime") ?? "").trim(),
              endTime: String(formData.get("endTime") ?? "").trim(),
              reason: String(formData.get("reason") ?? "").trim(),
            });

            if (!parsed.success) {
              throw new Error("Revisa fecha, horario y motivo del bloqueo.");
            }

            ensureRange(parsed.data.startTime, parsed.data.endTime);

            return {
              slots: [
                {
                  blockedDate: parsed.data.blockedDate,
                  startTime: parsed.data.startTime,
                  endTime: parsed.data.endTime,
                  reason: parsed.data.reason,
                },
              ],
              label: parsed.data.blockedDate,
            };
          })();

    const result = context.live
      ? await createPocketBaseBlockedSlots({
          businessId: context.businessId,
          slots: createdSlots.slots,
        })
      : await createLocalBlockedSlots({
          businessSlug: context.businessSlug,
          slots: createdSlots.slots,
        });

    if (result.createdCount === 0) {
      throw new Error("Esos bloqueos ya existen.");
    }

    revalidateAvailabilityViews(context.businessSlug);

    const message =
      result.createdCount === 1 && result.skippedCount === 0
        ? `Bloqueo agregado para ${createdSlots.label}.`
        : result.skippedCount > 0
          ? `Se agregaron ${result.createdCount} bloqueos para ${createdSlots.label}. ${result.skippedCount} ya existian.`
          : `Se agregaron ${result.createdCount} bloqueos para ${createdSlots.label}.`;

    return { ok: true, message };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo crear el bloqueo.",
    };
  }
}

export async function removeBlockedSlotAction(formData: FormData) {
  const blockedSlotId = String(formData.get("blockedSlotId") ?? "").trim();
  const blockedDate = String(formData.get("blockedDate") ?? "").trim() || "bloqueo";

  if (!blockedSlotId) {
    redirect(`/admin/availability?error=${encodeURIComponent("Bloqueo invalido.")}`);
  }

  try {
    const context = await getAvailabilityContext();

    if (context.live) {
      await removePocketBaseBlockedSlot({
        businessId: context.businessId,
        blockedSlotId,
      });
    } else {
      await removeLocalBlockedSlot({
        businessSlug: context.businessSlug,
        blockedSlotId,
      });
    }

    revalidateAvailabilityViews(context.businessSlug);

    redirect(`/admin/availability?unblocked=${encodeURIComponent(blockedDate)}`);
  } catch (error) {
    unstable_rethrow(error);

    redirect(
      `/admin/availability?error=${encodeURIComponent(
        error instanceof Error ? error.message : "No se pudo quitar el bloqueo."
      )}`
    );
  }
}
