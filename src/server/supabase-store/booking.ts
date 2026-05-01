"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/utils";
import { getPublicAppUrl } from "@/lib/runtime";
import { createPublicClient, createServerClient } from "@/lib/supabase/server";
import { buildBookingDateOptions, findNextBookingDate, getDayOfWeek } from "@/lib/bookings/format";
import { withBookingDateLock } from "@/server/booking-slot-lock";
import { createLogger } from "@/server/logger";
import { buildBookingConfirmationView, buildManageBookingView } from "@/server/bookings-domain";
import { buildBookingCustomerDetails, buildBookingMutationFields, buildBookingTimeWindow, canMutatePublicBooking, fitsBookingWithinAvailability, hasBlockedSlotConflict, hasBookingConflict } from "@/server/booking-mutations-domain";
import { buildBookingPaymentPatch, type BookingPaymentValidationContext, type BookingPaymentUpdateInput } from "@/server/payments-domain";
import { buildAbsoluteReviewUrl, canGenerateBookingManageLinks, createBookingManageToken } from "@/server/public-booking-links";
import { sendBookingConfirmationEmail, sendBusinessNotificationEmail } from "@/server/booking-notifications";
import { RateLimitError, assertRateLimit, getRateLimitIdentifier } from "@/server/rate-limit";
import { getBookingConfirmationData } from "@/server/queries/public";
import { trackAnalyticsEvent } from "@/server/analytics";
import type { AuthUser } from "@/server/supabase-auth";
import { formatStatus, isActiveRecord, type BookingRecord, BookingStatus, BusinessRecord, CustomerRecord, ServiceRecord, AvailabilityRuleRecord, BlockedSlotRecord, CommunicationRecord, WaitlistEntryRecord, ReviewRecord, AppUserRecord } from "@/server/supabase-domain";
import { getSupabaseAdminClient, createSupabaseRecord, updateSupabaseRecord } from "./_core";
import { getBusinessBySlug } from "./helpers";
import type { JoinedBookingConfirmation, JoinedBookingManage, JoinedBookingWithBusiness, JoinedBookingWithBusinessStatus, UpdateSupabaseBookingPaymentInput } from "./types";

export async function getSupabaseBookingConfirmationData(input: {
  bookingId?: string;
  slug: string;
}) {
  if (!input.bookingId) {
    return null;
  }

  const client = await getSupabaseAdminClient();

  const { data: bookingData, error: bookingError } = await client
    .from("bookings")
    .select("*, service:services(*), customer:customers(*), business:businesses(*)")
    .eq("id", input.bookingId)
    .single();

  if (bookingError || !bookingData) {
    return null;
  }

  const booking = bookingData as JoinedBookingConfirmation;
  const business = booking.business;
  const service = booking.service;
  const customer = booking.customer;

  if (!business || business.slug !== input.slug) {
    return null;
  }

  const timezone = business.timezone ?? "America/Argentina/Buenos_Aires";

  return buildBookingConfirmationView({
    bookingId: booking.id,
    confirmationCode: booking.confirmationCode,
    customerName: customer?.fullName,
    customerEmail: customer?.email,
    customerPhone: customer?.phone,
    businessId: business.id,
    businessName: business.name ?? input.slug,
    businessSlug: business.slug ?? input.slug,
    businessAddress: business.address ?? null,
    businessTimezone: timezone,
    businessNotificationEmail: business.email,
    serviceId: service?.id,
    serviceName: service?.name,
    durationMinutes: Number(service?.durationMinutes ?? 60),
    priceAmount: service?.price ?? null,
    bookingDate: booking.bookingDate,
    startTime: booking.startTime,
    status: booking.status,
    manageToken: booking.manageToken,
    paymentStatus: booking.paymentStatus as "pending" | "approved" | "rejected" | "cancelled" | "refunded" | undefined,
    paymentAmount: booking.paymentAmount,
    paymentCurrency: booking.paymentCurrency,
    paymentProvider: booking.paymentProvider as "mercadopago" | undefined,
    source: "supabase",
  });
}

export async function getSupabaseManageBookingData(input: {
  bookingId?: string;
  slug: string;
}) {
  if (!input.bookingId) {
    return null;
  }

  const client = await getSupabaseAdminClient();

  const { data: bookingData, error: bookingError } = await client
    .from("bookings")
    .select("*, service:services(*), customer:customers(*), business:businesses(*)")
    .eq("id", input.bookingId)
    .single();

  if (bookingError || !bookingData) {
    return null;
  }

  const booking = bookingData as JoinedBookingManage;
  const business = booking.business;
  const service = booking.service;
  const customer = booking.customer;

  if (!business || business.slug !== input.slug) {
    return null;
  }

  return buildManageBookingView({
    id: booking.id,
    businessSlug: business.slug,
    businessName: business.name,
    businessAddress: business.address,
    businessTimezone: business.timezone ?? "America/Argentina/Buenos_Aires",
    serviceId: service?.id,
    serviceName: service?.name,
    durationMinutes: Number(service?.durationMinutes ?? 60),
    bookingDate: booking.bookingDate,
    startTime: booking.startTime,
    status: booking.status,
    statusLabel: formatStatus(booking.status),
    fullName: customer?.fullName,
    phone: customer?.phone,
    email: customer?.email,
    notes: booking.notes ?? "",
    source: "supabase",
  });
}

export async function createSupabasePublicBooking(input: {
  businessSlug: string;
  serviceId: string;
  bookingDate: string;
  startTime: string;
  fullName: string;
  phone?: string;
  email: string;
  notes?: string;
  initialStatus?: BookingStatus;
  paymentPreferenceId?: string;
}) {
  return withBookingDateLock(
    {
      businessKey: input.businessSlug,
      bookingDate: input.bookingDate,
    },
    async () => {
      const client = await getSupabaseAdminClient();
      const normalizedSlug = slugify(input.businessSlug);

      const { data: businessData, error: businessError } = await client
        .from("businesses")
        .select("*")
        .eq("slug", normalizedSlug)
        .eq("active", true)
        .single();

      if (businessError || !businessData) {
        throw new Error("Negocio no encontrado.");
      }
      const business = businessData as BusinessRecord;

      const { data: serviceData, error: serviceError } = await client
        .from("services")
        .select("*")
        .eq("id", input.serviceId)
        .single();

      if (serviceError || !serviceData) {
        throw new Error("Servicio no encontrado.");
      }
      const service = serviceData as ServiceRecord;

      if (service.business_id !== business.id || !service.active) {
        throw new Error("Servicio no encontrado.");
      }

      const bookingWindow = buildBookingTimeWindow(input.startTime, Number(service.durationMinutes));

      const selectedDayOfWeek = getDayOfWeek(input.bookingDate);

      const [
        { data: rulesData },
        { data: blockedData },
        { data: bookingsData },
        { data: customersData },
      ] = await Promise.all([
        client
          .from("availability_rules")
          .select("*")
          .eq("business_id", business.id)
          .eq("dayOfWeek", selectedDayOfWeek),
        client
          .from("blocked_slots")
          .select("*")
          .eq("business_id", business.id)
          .eq("blockedDate", input.bookingDate),
        client
          .from("bookings")
          .select("*")
          .eq("business_id", business.id)
          .eq("bookingDate", input.bookingDate),
        client
          .from("customers")
          .select("*")
          .eq("business_id", business.id)
          .order("fullName"),
      ]);

      const rules = (rulesData ?? []) as AvailabilityRuleRecord[];
      const blockedSlots = (blockedData ?? []) as BlockedSlotRecord[];
      const bookings = (bookingsData ?? []) as BookingRecord[];
      const customers = (customersData ?? []) as CustomerRecord[];

      const dayRules = rules.filter((rule) => isActiveRecord(rule));
      const businessBlockedSlots = blockedSlots.filter(
        (slot) => slot.blockedDate === input.bookingDate
      );
      const businessBookings = bookings.filter((booking) =>
        ["pending", "pending_payment", "confirmed"].includes(booking.status)
      );
      const businessCustomers = customers.filter((customer) =>
        input.phone ? customer.phone === input.phone : customer.email === input.email
      );

      if (!fitsBookingWithinAvailability(dayRules, bookingWindow)) {
        throw new Error("Ese horario queda fuera de la disponibilidad configurada.");
      }

      if (hasBlockedSlotConflict(businessBlockedSlots, bookingWindow)) {
        throw new Error("Ese horario esta bloqueado.");
      }

      if (
        hasBookingConflict(businessBookings, {
          ...bookingWindow,
          allowedStatuses: ["pending", "pending_payment", "confirmed"],
        })
      ) {
        throw new Error("Ese horario ya no esta disponible.");
      }

      let customer = businessCustomers[0];

      if (!customer) {
        customer = await createSupabaseRecord<CustomerRecord>("customers", {
          business_id: business.id,
          ...buildBookingCustomerDetails(input),
        });
      } else {
        customer = await updateSupabaseRecord<CustomerRecord>("customers", customer.id, {
          ...buildBookingCustomerDetails(input, customer),
        });
      }

      // Si el negocio tiene auto-confirmación activada y el caller no forzó un estado,
      // la reserva entra directamente como "confirmed" en vez de "pending"
      const resolvedStatus =
        input.initialStatus ??
        (business.autoConfirmBookings ? "confirmed" : undefined);

      const booking = await createSupabaseRecord<BookingRecord>("bookings", {
        business_id: business.id,
        customer_id: customer.id,
        service_id: service.id,
        ...buildBookingMutationFields({
          bookingDate: input.bookingDate,
          startTime: input.startTime,
          durationMinutes: Number(service.durationMinutes),
          status: resolvedStatus,
          notes: input.notes,
          paymentPreferenceId: input.paymentPreferenceId,
        }),
      });

      return booking.id;
    }
  );
}


export async function rescheduleSupabasePublicBooking(input: {
  businessSlug: string;
  serviceId: string;
  bookingDate: string;
  startTime: string;
  fullName: string;
  phone?: string;
  email: string;
  notes?: string;
  rescheduleBookingId: string;
  manageToken?: string;
}) {
  return withBookingDateLock(
    {
      businessKey: input.businessSlug,
      bookingDate: input.bookingDate,
    },
    async () => {
      const client = await getSupabaseAdminClient();

      const { data: bookingData, error: bookingError } = await client
        .from("bookings")
        .select("*, business:businesses(*)")
        .eq("id", input.rescheduleBookingId)
        .single();

      if (bookingError || !bookingData) {
        throw new Error("Link de gestion invalido.");
      }

      const booking = bookingData as JoinedBookingWithBusiness;
      const business = booking.business;

      if (!business || business.slug !== input.businessSlug) {
        throw new Error("Link de gestion invalido.");
      }

      if (!canMutatePublicBooking(booking.status)) {
        throw new Error("Este turno ya no se puede reprogramar.");
      }

      const { data: serviceData, error: serviceError } = await client
        .from("services")
        .select("*")
        .eq("id", input.serviceId)
        .single();

      if (serviceError || !serviceData) {
        throw new Error("Servicio no encontrado.");
      }
      const service = serviceData as ServiceRecord;

      if (service.business_id !== business.id || !service.active) {
        throw new Error("Servicio no encontrado.");
      }

      const bookingWindow = buildBookingTimeWindow(input.startTime, Number(service.durationMinutes));

      const selectedDayOfWeek = getDayOfWeek(input.bookingDate);

      const [{ data: rulesData }, { data: blockedData }, { data: bookingsData }] = await Promise.all([
        client
          .from("availability_rules")
          .select("*")
          .eq("business_id", business.id)
          .eq("dayOfWeek", selectedDayOfWeek),
        client
          .from("blocked_slots")
          .select("*")
          .eq("business_id", business.id)
          .eq("blockedDate", input.bookingDate),
        client
          .from("bookings")
          .select("*")
          .eq("business_id", business.id)
          .eq("bookingDate", input.bookingDate),
      ]);

      const rules = (rulesData ?? []) as AvailabilityRuleRecord[];
      const blockedSlots = (blockedData ?? []) as BlockedSlotRecord[];
      const bookings = (bookingsData ?? []) as BookingRecord[];

      const dayRules = rules.filter((rule) => isActiveRecord(rule));
      const businessBlockedSlots = blockedSlots.filter(
        (slot) => slot.blockedDate === input.bookingDate
      );
      const businessBookings = bookings.filter(
        (candidate) =>
          candidate.bookingDate === input.bookingDate &&
          canMutatePublicBooking(candidate.status) &&
          candidate.id !== booking.id
      );

      if (!fitsBookingWithinAvailability(dayRules, bookingWindow)) {
        throw new Error("Ese horario queda fuera de la disponibilidad configurada.");
      }

      if (hasBlockedSlotConflict(businessBlockedSlots, bookingWindow)) {
        throw new Error("Ese horario esta bloqueado.");
      }

      if (
        hasBookingConflict(businessBookings, {
          ...bookingWindow,
          allowedStatuses: ["pending", "pending_payment", "confirmed"],
        })
      ) {
        throw new Error("Ese horario ya no esta disponible.");
      }

      await updateSupabaseRecord("customers", booking.customer_id!, {
        ...buildBookingCustomerDetails(input),
      });

      await updateSupabaseRecord("bookings", booking.id, {
        service_id: service.id,
        ...buildBookingMutationFields({
          bookingDate: input.bookingDate,
          startTime: input.startTime,
          durationMinutes: Number(service.durationMinutes),
          status: "pending",
          notes: input.notes,
        }),
      });

      return booking.id;
    }
  );
}

export async function cancelSupabasePublicBooking(input: {
  businessSlug: string;
  bookingId: string;
}) {
  const client = await getSupabaseAdminClient();

  const { data: bookingData, error: bookingError } = await client
    .from("bookings")
    .select("*, business:businesses(*)")
    .eq("id", input.bookingId)
    .single();

  if (bookingError || !bookingData) {
    throw new Error("Link de gestion invalido.");
  }

  const booking = bookingData as JoinedBookingWithBusiness;
  const business = booking.business;

  if (!business || business.slug !== input.businessSlug) {
    throw new Error("Link de gestion invalido.");
  }

  if (!canMutatePublicBooking(booking.status)) {
    throw new Error("Este turno ya no se puede cancelar.");
  }

  await updateSupabaseRecord("bookings", booking.id, {
    status: "cancelled",
  });

  notifyWaitlistForDate({
    businessId: business.id,
    businessSlug: business.slug,
    businessName: business.name,
    bookingDate: booking.bookingDate,
  }).catch(() => {});
}

async function notifyWaitlistForDate(input: {
  businessId: string;
  businessSlug: string;
  businessName: string;
  bookingDate: string;
}) {
  const client = await getSupabaseAdminClient();

  const { data: entries } = await client
    .from("waitlist_entries")
    .select("*")
    .eq("business_id", input.businessId)
    .eq("bookingDate", input.bookingDate)
    .eq("notified", false)
    .order("created", { ascending: true })
    .limit(1);

  const entry = entries?.[0] as WaitlistEntryRecord | undefined;
  if (!entry?.email) return;

  const { sendWaitlistAvailabilityEmail } = await import("@/server/booking-notifications");
  const bookingUrl = `${getPublicAppUrl()}/${input.businessSlug}/reservar`;

  await sendWaitlistAvailabilityEmail({
    customerEmail: entry.email,
    customerName: entry.fullName,
    businessName: input.businessName,
    bookingDate: input.bookingDate,
    bookingUrl,
  });

  await client.from("waitlist_entries").update({ notified: true }).eq("id", entry.id);
}


export async function updateSupabaseBookingPayment(
  input: UpdateSupabaseBookingPaymentInput
) {
  const data = buildBookingPaymentPatch(input);
  await updateSupabaseRecord("bookings", input.bookingId, data);

  return input.bookingId;
}


export async function getSupabaseBookingBusinessSlug(bookingId: string): Promise<string | null> {
  const client = await getSupabaseAdminClient();

  const { data: bookingData, error: bookingError } = await client
    .from("bookings")
    .select("*, business:businesses(*)")
    .eq("id", bookingId)
    .single();

  if (bookingError || !bookingData) {
    return null;
  }

  const booking = bookingData as JoinedBookingWithBusiness;
  const business = booking.business;

  return business?.slug ?? null;
}


export async function getSupabaseBookingPaymentValidationContext(
  bookingId: string
): Promise<BookingPaymentValidationContext | null> {
  const client = await getSupabaseAdminClient();

  const { data: bookingData, error: bookingError } = await client
    .from("bookings")
    .select("*, business:businesses(*)")
    .eq("id", bookingId)
    .single();

  if (bookingError || !bookingData) {
    return null;
  }

  const booking = bookingData as JoinedBookingWithBusinessStatus;
  const business = booking.business;

  if (!business) {
    return null;
  }

  return {
    bookingId: booking.id,
    businessId: business.id,
    businessSlug: business.slug,
    status: booking.status,
    paymentAmount: booking.paymentAmount,
    paymentCurrency: booking.paymentCurrency,
    paymentProvider: booking.paymentProvider as "mercadopago" | undefined,
    paymentPreferenceId: booking.paymentPreferenceId,
    paymentExternalId: booking.paymentExternalId,
    paymentStatus: booking.paymentStatus as BookingPaymentValidationContext["paymentStatus"],
    mpCollectorId: business.mpCollectorId,
  };
}


export async function revertSupabaseBookingFromPendingPayment(bookingId: string) {
  const client = await getSupabaseAdminClient();

  const { data: bookingData, error: bookingError } = await client
    .from("bookings")
    .select("status")
    .eq("id", bookingId)
    .single();

  if (bookingError || !bookingData) {
    return;
  }

  const booking = bookingData as BookingRecord;

  if (booking.status !== "pending_payment") {
    return;
  }

  await updateSupabaseRecord("bookings", bookingId, { status: "pending" });
}


