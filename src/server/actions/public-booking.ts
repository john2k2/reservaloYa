"use server";

import { redirect } from "next/navigation";

import { addMinutes } from "@/lib/bookings/format";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { publicBookingSchema } from "@/lib/validations/booking";
import { trackAnalyticsEvent } from "@/server/analytics";
import { sendBookingConfirmationEmail } from "@/server/booking-notifications";
import {
  cancelLocalPublicBooking,
  createLocalPublicBooking,
} from "@/server/local-store";
import { isValidBookingManageToken } from "@/server/public-booking-links";
import { getBookingConfirmationData } from "@/server/queries/public";

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function overlaps(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA;
}

function buildBookingPageHref(input: {
  businessSlug: string;
  serviceId?: string;
  bookingDate?: string;
  rescheduleBookingId?: string;
  manageToken?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  error?: string;
}) {
  const params = new URLSearchParams();

  if (input.serviceId) {
    params.set("service", input.serviceId);
  }

  if (input.bookingDate) {
    params.set("date", input.bookingDate);
  }

  if (input.rescheduleBookingId) {
    params.set("reschedule", input.rescheduleBookingId);
  }

  if (input.manageToken) {
    params.set("token", input.manageToken);
  }

  if (input.source) {
    params.set("utm_source", input.source);
  }

  if (input.medium) {
    params.set("utm_medium", input.medium);
  }

  if (input.campaign) {
    params.set("utm_campaign", input.campaign);
  }

  if (input.error) {
    params.set("error", input.error);
  }

  const query = params.toString();

  return query ? `/${input.businessSlug}/reservar?${query}` : `/${input.businessSlug}/reservar`;
}

function buildManagePageHref(input: {
  businessSlug: string;
  bookingId: string;
  manageToken: string;
  error?: string;
  status?: string;
}) {
  const params = new URLSearchParams({
    booking: input.bookingId,
    token: input.manageToken,
  });

  if (input.error) {
    params.set("error", input.error);
  }

  if (input.status) {
    params.set("status", input.status);
  }

  return `/${input.businessSlug}/mi-turno?${params.toString()}`;
}

async function sendConfirmationEmailIfPossible(input: {
  bookingId: string;
  businessSlug: string;
  customerName: string;
  customerEmail?: string;
  mode: "created" | "rescheduled";
}) {
  if (!input.customerEmail) {
    return;
  }

  const confirmation = await getBookingConfirmationData({
    slug: input.businessSlug,
    bookingId: input.bookingId,
  });

  await sendBookingConfirmationEmail({
    bookingId: input.bookingId,
    businessSlug: input.businessSlug,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    mode: input.mode,
    confirmation,
  });
}

async function createLivePublicBooking(input: {
  businessSlug: string;
  serviceId: string;
  bookingDate: string;
  startTime: string;
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_public_booking", {
    p_business_slug: input.businessSlug,
    p_service_id: input.serviceId,
    p_booking_date: input.bookingDate,
    p_start_time: input.startTime,
    p_full_name: input.fullName,
    p_phone: input.phone,
    p_email: input.email || null,
    p_notes: input.notes || null,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo crear la reserva.");
  }

  return String(data);
}

async function rescheduleLivePublicBooking(input: {
  businessSlug: string;
  serviceId: string;
  bookingDate: string;
  startTime: string;
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
  rescheduleBookingId: string;
  manageToken: string;
}) {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("La reprogramacion publica necesita acceso admin a Supabase.");
  }

  if (
    !isValidBookingManageToken({
      slug: input.businessSlug,
      bookingId: input.rescheduleBookingId,
      token: input.manageToken,
    })
  ) {
    throw new Error("Link de gestion invalido.");
  }

  const supabase = createAdminClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, business_id, customer_id, status")
    .eq("id", input.rescheduleBookingId)
    .maybeSingle();

  if (!booking) {
    throw new Error("No encontramos el turno para reprogramar.");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, slug")
    .eq("id", booking.business_id)
    .maybeSingle();

  if (!business || business.slug !== input.businessSlug) {
    throw new Error("Link de gestion invalido.");
  }

  if (!["pending", "confirmed"].includes(booking.status)) {
    throw new Error("Este turno ya no se puede reprogramar.");
  }

  const { data: service } = await supabase
    .from("services")
    .select("id, duration_minutes")
    .eq("id", input.serviceId)
    .eq("business_id", booking.business_id)
    .eq("active", true)
    .maybeSingle();

  if (!service) {
    throw new Error("Servicio no encontrado.");
  }

  const endTime = addMinutes(input.startTime, service.duration_minutes);
  const startMinutes = toMinutes(input.startTime);
  const endMinutes = toMinutes(endTime);

  const [{ data: blockedSlots }, { data: bookings }] = await Promise.all([
    supabase
      .from("blocked_slots")
      .select("start_time, end_time")
      .eq("business_id", booking.business_id)
      .eq("blocked_date", input.bookingDate),
    supabase
      .from("bookings")
      .select("id, start_time, end_time")
      .eq("business_id", booking.business_id)
      .eq("booking_date", input.bookingDate)
      .in("status", ["pending", "confirmed"])
      .neq("id", input.rescheduleBookingId),
  ]);

  const blockedConflict = (blockedSlots ?? []).some((slot) =>
    overlaps(startMinutes, endMinutes, toMinutes(slot.start_time), toMinutes(slot.end_time))
  );

  if (blockedConflict) {
    throw new Error("Ese horario esta bloqueado.");
  }

  const bookingConflict = (bookings ?? []).some((candidate) =>
    overlaps(startMinutes, endMinutes, toMinutes(candidate.start_time), toMinutes(candidate.end_time))
  );

  if (bookingConflict) {
    throw new Error("Ese horario ya no esta disponible.");
  }

  await supabase
    .from("customers")
    .update({
      full_name: input.fullName,
      phone: input.phone,
      email: input.email || null,
      notes: input.notes || null,
    })
    .eq("id", booking.customer_id);

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      service_id: service.id,
      booking_date: input.bookingDate,
      start_time: input.startTime,
      end_time: endTime,
      status: "pending",
      notes: input.notes || null,
    })
    .eq("id", input.rescheduleBookingId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return input.rescheduleBookingId;
}

export async function createPublicBookingAction(formData: FormData) {
  const raw = {
    businessSlug: String(formData.get("businessSlug") ?? ""),
    serviceId: String(formData.get("serviceId") ?? ""),
    bookingDate: String(formData.get("bookingDate") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    rescheduleBookingId: String(formData.get("rescheduleBookingId") ?? ""),
    manageToken: String(formData.get("manageToken") ?? ""),
    source: String(formData.get("source") ?? ""),
    medium: String(formData.get("medium") ?? ""),
    campaign: String(formData.get("campaign") ?? ""),
  };

  const parsed = publicBookingSchema.safeParse(raw);

  if (!parsed.success) {
    redirect(
      buildBookingPageHref({
        businessSlug: raw.businessSlug,
        serviceId: raw.serviceId,
        bookingDate: raw.bookingDate,
        rescheduleBookingId: raw.rescheduleBookingId,
        manageToken: raw.manageToken,
        source: raw.source,
        medium: raw.medium,
        campaign: raw.campaign,
        error: "Completa los datos del turno.",
      })
    );
  }

  if (
    parsed.data.rescheduleBookingId &&
    !isValidBookingManageToken({
      slug: parsed.data.businessSlug,
      bookingId: parsed.data.rescheduleBookingId,
      token: parsed.data.manageToken,
    })
  ) {
    redirect(
      buildBookingPageHref({
        businessSlug: parsed.data.businessSlug,
        serviceId: parsed.data.serviceId,
        bookingDate: parsed.data.bookingDate,
        source: raw.source,
        medium: raw.medium,
        campaign: raw.campaign,
        error: "Link de gestion invalido.",
      })
    );
  }

  let bookingId: string;

  try {
    if (!isSupabaseConfigured()) {
      bookingId = await createLocalPublicBooking(parsed.data);
      if (!parsed.data.rescheduleBookingId) {
        await trackAnalyticsEvent({
          businessSlug: parsed.data.businessSlug,
          eventName: "booking_created",
          pagePath: `/${parsed.data.businessSlug}/confirmacion`,
          source: raw.source,
          medium: raw.medium,
          campaign: raw.campaign,
        });
      }
    } else if (parsed.data.rescheduleBookingId) {
      bookingId = await rescheduleLivePublicBooking({
        ...parsed.data,
        rescheduleBookingId: parsed.data.rescheduleBookingId,
        manageToken: parsed.data.manageToken ?? "",
      });
    } else {
      bookingId = await createLivePublicBooking(parsed.data);
      await trackAnalyticsEvent({
        businessSlug: parsed.data.businessSlug,
        eventName: "booking_created",
        pagePath: `/${parsed.data.businessSlug}/confirmacion`,
        source: raw.source,
        medium: raw.medium,
        campaign: raw.campaign,
      });
    }
  } catch (error) {
    redirect(
      buildBookingPageHref({
        businessSlug: parsed.data.businessSlug,
        serviceId: parsed.data.serviceId,
        bookingDate: parsed.data.bookingDate,
        rescheduleBookingId: parsed.data.rescheduleBookingId,
        manageToken: parsed.data.manageToken,
        source: raw.source,
        medium: raw.medium,
        campaign: raw.campaign,
        error:
          error instanceof Error ? error.message : "No se pudo crear la reserva.",
      })
    );
  }

  await sendConfirmationEmailIfPossible({
    bookingId,
    businessSlug: parsed.data.businessSlug,
    customerName: parsed.data.fullName,
    customerEmail: parsed.data.email || undefined,
    mode: parsed.data.rescheduleBookingId ? "rescheduled" : "created",
  });

  redirect(`/${parsed.data.businessSlug}/confirmacion?booking=${bookingId}`);
}

export async function cancelPublicBookingAction(formData: FormData) {
  const businessSlug = String(formData.get("businessSlug") ?? "");
  const bookingId = String(formData.get("bookingId") ?? "");
  const manageToken = String(formData.get("manageToken") ?? "");

  if (!isValidBookingManageToken({ slug: businessSlug, bookingId, token: manageToken })) {
    redirect(`/${businessSlug}/mi-turno?error=${encodeURIComponent("Link de gestion invalido.")}`);
  }

  try {
    if (!isSupabaseConfigured()) {
      await cancelLocalPublicBooking({ businessSlug, bookingId });
    } else {
      if (!isSupabaseAdminConfigured()) {
        throw new Error("La cancelacion publica necesita acceso admin a Supabase.");
      }

      const supabase = createAdminClient();
      const { data: booking } = await supabase
        .from("bookings")
        .select("id, business_id")
        .eq("id", bookingId)
        .maybeSingle();

      if (!booking) {
        throw new Error("No encontramos ese turno.");
      }

      const { data: business } = await supabase
        .from("businesses")
        .select("slug")
        .eq("id", booking.business_id)
        .maybeSingle();

      if (!business || business.slug !== businessSlug) {
        throw new Error("Link de gestion invalido.");
      }

      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (error) {
        throw new Error(error.message);
      }
    }
  } catch (error) {
    redirect(
      buildManagePageHref({
        businessSlug,
        bookingId,
        manageToken,
        error: error instanceof Error ? error.message : "No se pudo cancelar el turno.",
      })
    );
  }

  redirect(
    buildManagePageHref({
      businessSlug,
      bookingId,
      manageToken,
      status: "cancelled",
    })
  );
}
