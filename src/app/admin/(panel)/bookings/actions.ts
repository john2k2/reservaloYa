"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { writeAuditLog } from "@/server/audit-log";
import { getAuthenticatedSupabaseUser } from "@/server/supabase-auth";
import { createSupabasePublicBooking } from "@/server/supabase-store";
import {
  getSupabaseRecord,
  updateSupabaseRecord,
} from "@/server/supabase-store/_core";
import type { BookingRecord, ServiceRecord } from "@/server/supabase-domain";
import { getDayOfWeek } from "@/lib/bookings/format";
import {
  buildBookingTimeWindow,
  hasBlockedSlotConflict,
  hasBookingConflict,
  fitsBookingWithinAvailability,
} from "@/server/booking-mutations-domain";
import {
  isActiveRecord,
  type AvailabilityRuleRecord,
  type BlockedSlotRecord,
} from "@/server/supabase-domain";
import { listSupabaseRecords } from "@/server/supabase-store/_core";

const bookingSchema = z.object({
  bookingId: z.string().trim().min(1),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]),
  notes: z.string().trim().max(400),
});

function buildBookingsRedirectPath(params: {
  saved?: string;
  error?: string;
  status?: string;
  date?: string;
  q?: string;
  nuevo?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params.saved) {
    searchParams.set("saved", params.saved);
  }

  if (params.error) {
    searchParams.set("error", params.error);
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.date) {
    searchParams.set("date", params.date);
  }

  if (params.q) {
    searchParams.set("q", params.q);
  }

  if (params.nuevo) {
    searchParams.set("nuevo", params.nuevo);
  }

  const queryString = searchParams.toString();
  return queryString ? `/admin/bookings?${queryString}` : "/admin/bookings";
}

async function getBookingContext() {
  const user = await getAuthenticatedSupabaseUser();

  if (!user?.businessId) {
    throw new Error("No encontramos el negocio activo.");
  }

  return {
    businessId: user.businessId,
    businessSlug: user.businessSlug ?? "",
    userId: user.id,
    userEmail: user.email,
  };
}

function revalidateBookingViews(businessSlug: string) {
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/dashboard");
  revalidatePath(`/${businessSlug}`);
}

async function updateSupabaseAdminBooking(input: {
  businessId: string;
  bookingId: string;
  bookingDate: string;
  startTime: string;
  status: string;
  notes: string;
}) {
  const booking = await getSupabaseRecord<BookingRecord & { service: Pick<ServiceRecord, "id" | "business_id" | "name" | "durationMinutes"> | null }>(
    "bookings",
    input.bookingId
  );

  if (booking.business_id !== input.businessId) {
    throw new Error("No encontramos el turno a actualizar.");
  }

  const service = booking.service;

  if (!service || service.business_id !== input.businessId) {
    throw new Error("No encontramos el servicio del turno.");
  }

  const selectedDayOfWeek = getDayOfWeek(input.bookingDate);
  const bookingWindow = buildBookingTimeWindow(input.startTime, Number(service.durationMinutes));

  const [rules, blockedSlots, bookings] = await Promise.all([
    listSupabaseRecords<AvailabilityRuleRecord>("availability_rules", {
      filter: `business_id=eq.${input.businessId}`,
    }),
    listSupabaseRecords<BlockedSlotRecord>("blocked_slots", {
      filter: `business_id=eq.${input.businessId}`,
    }),
    listSupabaseRecords<BookingRecord>("bookings", {
      filter: `business_id=eq.${input.businessId}`,
    }),
  ]);

  const dayRules = rules.filter(
    (rule) => rule.dayOfWeek === selectedDayOfWeek && isActiveRecord(rule)
  );
  const dayBlockedSlots = blockedSlots.filter(
    (slot) => slot.blockedDate === input.bookingDate
  );
  const dayBookings = bookings.filter(
    (b) => b.bookingDate === input.bookingDate
  );

  const fitsWithinAvailability = fitsBookingWithinAvailability(dayRules, bookingWindow);

  if (!fitsWithinAvailability) {
    throw new Error("Ese horario queda fuera de la disponibilidad configurada.");
  }

  const blockedConflict = hasBlockedSlotConflict(dayBlockedSlots, bookingWindow);

  if (blockedConflict) {
    throw new Error("Ese horario esta bloqueado.");
  }

  const bookingConflict = hasBookingConflict(dayBookings, {
    ...bookingWindow,
    excludeBookingId: booking.id,
    allowedStatuses: ["pending", "confirmed"],
  });

  if (bookingConflict) {
    throw new Error("Ese horario ya no esta disponible.");
  }

  await updateSupabaseRecord("bookings", input.bookingId, {
    bookingDate: input.bookingDate,
    startTime: input.startTime,
    status: input.status,
    notes: input.notes,
  });

  return input.bookingId;
}

const manualBookingSchema = z.object({
  serviceId: z.string().trim().min(1, "Seleccioná un servicio."),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida."),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida."),
  fullName: z.string().trim().min(2, "Ingresá el nombre del cliente.").max(80),
  phone: z.string().trim().max(30).default(""),
  email: z.string().trim().max(120).default(""),
  notes: z.string().trim().max(400).default(""),
});

export async function createManualBookingAction(formData: FormData) {
  try {
    const parsed = manualBookingSchema.safeParse({
      serviceId: String(formData.get("serviceId") ?? "").trim(),
      bookingDate: String(formData.get("bookingDate") ?? "").trim(),
      startTime: String(formData.get("startTime") ?? "").trim(),
      fullName: String(formData.get("fullName") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      notes: String(formData.get("notes") ?? "").trim(),
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Revisá los campos.";
      throw new Error(firstError);
    }

    const context = await getBookingContext();

    await createSupabasePublicBooking({
      businessSlug: context.businessSlug,
      serviceId: parsed.data.serviceId,
      bookingDate: parsed.data.bookingDate,
      startTime: parsed.data.startTime,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      notes: parsed.data.notes,
      initialStatus: "confirmed",
    });

    await writeAuditLog(
      { userId: context.userId, userEmail: context.userEmail, businessId: context.businessId },
      "booking.created",
      "manual",
      { date: parsed.data.bookingDate, time: parsed.data.startTime, customer: parsed.data.fullName }
    );

    revalidateBookingViews(context.businessSlug);
    redirect(buildBookingsRedirectPath({ saved: "nuevo", date: parsed.data.bookingDate }));
  } catch (error) {
    unstable_rethrow(error);
    redirect(
      buildBookingsRedirectPath({
        error: error instanceof Error ? error.message : "No se pudo crear el turno.",
        nuevo: "1",
      })
    );
  }
}

export async function updateBookingAction(formData: FormData) {
  const filters = {
    status: String(formData.get("redirectStatus") ?? "").trim(),
    date: String(formData.get("redirectDate") ?? "").trim(),
    q: String(formData.get("redirectQ") ?? "").trim(),
  };

  try {
    const parsed = bookingSchema.safeParse({
      bookingId: String(formData.get("bookingId") ?? "").trim(),
      bookingDate: String(formData.get("bookingDate") ?? "").trim(),
      startTime: String(formData.get("startTime") ?? "").trim(),
      status: String(formData.get("status") ?? "").trim(),
      notes: String(formData.get("notes") ?? "").trim(),
    });

    if (!parsed.success) {
      throw new Error("Revisa el estado y las notas antes de guardar.");
    }

    const context = await getBookingContext();

    await updateSupabaseAdminBooking({
      businessId: context.businessId,
      bookingId: parsed.data.bookingId,
      bookingDate: parsed.data.bookingDate,
      startTime: parsed.data.startTime,
      status: parsed.data.status,
      notes: parsed.data.notes,
    });

    await writeAuditLog(
      { userId: context.userId, userEmail: context.userEmail, businessId: context.businessId },
      "booking.updated",
      parsed.data.bookingId,
      { status: parsed.data.status, date: parsed.data.bookingDate, time: parsed.data.startTime }
    );

    revalidateBookingViews(context.businessSlug);

    redirect(
      buildBookingsRedirectPath({
        saved: parsed.data.bookingId,
        ...filters,
      })
    );
  } catch (error) {
    unstable_rethrow(error);

    redirect(
      buildBookingsRedirectPath({
        error: error instanceof Error ? error.message : "No se pudo actualizar el turno.",
        ...filters,
      })
    );
  }
}
