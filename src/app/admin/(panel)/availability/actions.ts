"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { addDays, getDayOfWeek } from "@/lib/bookings/format";
import { getAuthenticatedSupabaseUser } from "@/server/supabase-auth";
import {
  createSupabaseRecord,
  getSupabaseRecord,
  listSupabaseRecords,
  updateSupabaseRecord,
  deleteSupabaseRecord,
} from "@/server/supabase-store/_core";
import { buildBlockedSlotKey } from "@/server/supabase-domain";
import type { AvailabilityRuleRecord, BlockedSlotRecord } from "@/server/supabase-domain";

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
  const user = await getAuthenticatedSupabaseUser();

  if (!user?.businessId) {
    throw new Error("No encontramos el negocio activo.");
  }

  return {
    businessId: user.businessId,
    businessSlug: user.businessSlug ?? "",
  };
}

function ensureRange(startTime: string, endTime: string) {
  if (startTime >= endTime) {
    throw new Error("La hora de fin debe quedar después de la hora de inicio.");
  }
}

function getAvailabilityRuleFromFormData(formData: FormData, dayOfWeek: number) {
  const active = String(formData.get(`active_${dayOfWeek}`) ?? "") === "true";
  const parsed = availabilityRuleSchema.safeParse({
    ruleId: String(formData.get(`ruleId_${dayOfWeek}`) ?? "").trim() || undefined,
    dayOfWeek,
    startTime: active ? String(formData.get(`startTime_${dayOfWeek}`) ?? "").trim() : "00:00",
    endTime: active ? String(formData.get(`endTime_${dayOfWeek}`) ?? "").trim() : "00:00",
    active,
  });

  if (!parsed.success) {
    throw new Error(`Revisa el horario de ${dayLabels[dayOfWeek] ?? "ese día"}.`);
  }

  if (active) ensureRange(parsed.data.startTime, parsed.data.endTime);
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

async function upsertSupabaseAvailabilityRules(input: {
  businessId: string;
  rules: Array<{
    ruleId?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    active: boolean;
  }>;
}) {
  const existingRules = await listSupabaseRecords<AvailabilityRuleRecord>("availability_rules", {
    filter: `business_id=eq.${input.businessId}`,
  });

  const rulesById = new Map(existingRules.map((rule) => [rule.id, rule]));
  const rulesByDay = new Map(existingRules.map((rule) => [rule.dayOfWeek, rule]));

  for (const ruleInput of input.rules) {
    const existingRule = ruleInput.ruleId
      ? (rulesById.get(ruleInput.ruleId) ?? null)
      : (rulesByDay.get(ruleInput.dayOfWeek) ?? null);

    if (!ruleInput.active && !existingRule) {
      continue;
    }

    if (existingRule) {
      await updateSupabaseRecord("availability_rules", existingRule.id, {
        startTime: ruleInput.startTime,
        endTime: ruleInput.endTime,
        active: ruleInput.active,
      });
      continue;
    }

    const createdRule = await createSupabaseRecord<AvailabilityRuleRecord>("availability_rules", {
      business_id: input.businessId,
      dayOfWeek: ruleInput.dayOfWeek,
      startTime: ruleInput.startTime,
      endTime: ruleInput.endTime,
      active: ruleInput.active,
    });

    rulesById.set(createdRule.id, createdRule);
    rulesByDay.set(createdRule.dayOfWeek, createdRule);
  }

  return input.rules.length;
}

async function createSupabaseBlockedSlots(input: {
  businessId: string;
  slots: Array<{
    blockedDate: string;
    startTime: string;
    endTime: string;
    reason: string;
  }>;
}) {
  const existingSlots = await listSupabaseRecords<BlockedSlotRecord>("blocked_slots", {
    filter: `business_id=eq.${input.businessId}`,
  });

  const existingKeys = new Set(existingSlots.map((slot) => buildBlockedSlotKey(slot)));
  const submittedKeys = new Set<string>();
  let createdCount = 0;
  let skippedCount = 0;

  for (const slot of input.slots) {
    const key = buildBlockedSlotKey(slot);

    if (existingKeys.has(key) || submittedKeys.has(key)) {
      skippedCount += 1;
      continue;
    }

    submittedKeys.add(key);
    existingKeys.add(key);
    createdCount += 1;

    await createSupabaseRecord<BlockedSlotRecord>("blocked_slots", {
      business_id: input.businessId,
      blockedDate: slot.blockedDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
      reason: slot.reason,
    });
  }

  return {
    createdCount,
    skippedCount,
  };
}

async function removeSupabaseBlockedSlot(input: {
  businessId: string;
  blockedSlotId: string;
}) {
  const existingSlot = await getSupabaseRecord<BlockedSlotRecord>(
    "blocked_slots",
    input.blockedSlotId
  );

  if (existingSlot.business_id !== input.businessId) {
    throw new Error("No encontramos el bloqueo a eliminar.");
  }

  await deleteSupabaseRecord("blocked_slots", input.blockedSlotId);

  return input.blockedSlotId;
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

    await upsertSupabaseAvailabilityRules({
      businessId: context.businessId,
      rules: targetRules.map((rule) => ({
        ruleId: rule.ruleId,
        dayOfWeek: rule.dayOfWeek,
        startTime: rule.startTime,
        endTime: rule.endTime,
        active: rule.active,
      })),
    });

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

    const result = await createSupabaseBlockedSlots({
      businessId: context.businessId,
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

    const result = await createSupabaseBlockedSlots({
      businessId: context.businessId,
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

    await removeSupabaseBlockedSlot({
      businessId: context.businessId,
      blockedSlotId,
    });

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
