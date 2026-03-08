import { unstable_noStore as noStore } from "next/cache";

import { getPublicBusinessProfile } from "@/constants/public-business-profiles";
import { demoBusiness, demoServices, demoSlots } from "@/constants/demo";
import {
  buildBookingDateOptions,
  findNextBookingDate,
  getDayOfWeek,
} from "@/lib/bookings/format";
import { buildWeeklySchedule } from "@/lib/bookings/schedule";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { humanizeSlug } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { isValidBookingManageToken } from "@/server/public-booking-links";
import {
  getLocalBookingConfirmationData,
  getLocalPublicBookingFlowData,
  getLocalPublicBusinessPageData,
  getLocalPublicManageBookingData,
} from "@/server/local-store";

function takeFirstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function formatMoney(value: number | null) {
  if (value == null) {
    return "Consultar";
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function fromMinutes(value: number) {
  const hours = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (value % 60).toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

function overlaps(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA;
}

function buildAvailableSlots({
  rules,
  blocked,
  bookings,
  durationMinutes,
}: {
  rules: Array<{ start_time: string; end_time: string }>;
  blocked: Array<{ start_time: string; end_time: string }>;
  bookings: Array<{ start_time: string; end_time: string }>;
  durationMinutes: number;
}) {
  const starts = new Set<string>();

  for (const rule of rules) {
    const ruleStart = toMinutes(rule.start_time);
    const ruleEnd = toMinutes(rule.end_time);

    for (let cursor = ruleStart; cursor + durationMinutes <= ruleEnd; cursor += 15) {
      const end = cursor + durationMinutes;

      const blockedConflict = blocked.some((slot) =>
        overlaps(cursor, end, toMinutes(slot.start_time), toMinutes(slot.end_time))
      );
      const bookingConflict = bookings.some((slot) =>
        overlaps(cursor, end, toMinutes(slot.start_time), toMinutes(slot.end_time))
      );

      if (!blockedConflict && !bookingConflict) {
        starts.add(fromMinutes(cursor));
      }
    }
  }

  return Array.from(starts).sort();
}

function getFallbackBusiness(slug: string) {
  if (slug === demoBusiness.slug) {
    return demoBusiness;
  }

  return {
    ...demoBusiness,
    name: humanizeSlug(slug),
    slug,
  };
}

export async function getPublicBusinessPageData(slug: string) {
  noStore();

  if (!isSupabaseConfigured()) {
    return getLocalPublicBusinessPageData(slug);
  }

  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, phone, email, address, timezone")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (!business) {
    return null;
  }

  const { data: services } = await supabase
    .from("services")
    .select("id, name, description, duration_minutes, price")
    .eq("business_id", business.id)
    .eq("active", true)
    .order("created_at", { ascending: true });
  const { data: availabilityRules } = await supabase
    .from("availability_rules")
    .select("day_of_week, start_time, end_time")
    .eq("business_id", business.id)
    .eq("active", true);

  const normalizedServices =
    services?.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      durationMinutes: service.duration_minutes,
      price: service.price,
      priceLabel: formatMoney(service.price),
    })) ??
    demoServices.map((service) => ({
      ...service,
      priceLabel: formatMoney(service.price),
    }));
  const profile = getPublicBusinessProfile(business.slug, business.name);
  const weeklyHours = buildWeeklySchedule(
    (availabilityRules ?? []).map((rule) => ({
      dayOfWeek: rule.day_of_week,
      startTime: rule.start_time,
      endTime: rule.end_time,
    }))
  );

  return {
    business,
    profile,
    weeklyHours,
    services: normalizedServices,
    source: "live" as const,
  };
}

export async function getPublicBookingFlowData({
  slug,
  serviceId,
  bookingDate,
}: {
  slug: string;
  serviceId?: string;
  bookingDate?: string;
}) {
  noStore();

  const pageData = await getPublicBusinessPageData(slug);

  if (!pageData) {
    return null;
  }

  const selectedService =
    pageData.services.find((service) => service.id === serviceId) ??
    pageData.services[0];
  const fallbackBaseDate = "2026-03-13";

  if (!selectedService) {
    return {
      ...pageData,
      selectedService: null,
      bookingDate: bookingDate ?? fallbackBaseDate,
      dateOptions: [bookingDate ?? fallbackBaseDate],
      slots: demoSlots,
    };
  }

  if (!isSupabaseConfigured() || pageData.source === "local") {
    return getLocalPublicBookingFlowData({
      slug,
      serviceId,
      bookingDate,
    });
  }

  const supabase = await createClient();
  const { data: allRules } = await supabase
    .from("availability_rules")
    .select("day_of_week")
    .eq("business_id", pageData.business.id)
    .eq("active", true);

  const activeDays = Array.from(new Set((allRules ?? []).map((rule) => rule.day_of_week)));
  const selectedDate = bookingDate ?? findNextBookingDate(fallbackBaseDate, activeDays);
  const dateOptions = buildBookingDateOptions(selectedDate, activeDays);
  const dayOfWeek = getDayOfWeek(selectedDate);

  const [{ data: rules }, { data: blocked }, { data: bookings }] = await Promise.all([
    supabase
      .from("availability_rules")
      .select("start_time, end_time")
      .eq("business_id", pageData.business.id)
      .eq("day_of_week", dayOfWeek)
      .eq("active", true),
    supabase
      .from("blocked_slots")
      .select("start_time, end_time")
      .eq("business_id", pageData.business.id)
      .eq("blocked_date", selectedDate),
    supabase
      .from("bookings")
      .select("start_time, end_time")
      .eq("business_id", pageData.business.id)
      .eq("booking_date", selectedDate)
      .in("status", ["pending", "confirmed"]),
  ]);

  const slots = buildAvailableSlots({
    rules: rules ?? [],
    blocked: blocked ?? [],
    bookings: bookings ?? [],
    durationMinutes: selectedService.durationMinutes,
  });

  return {
    ...pageData,
    selectedService,
    bookingDate: selectedDate,
    dateOptions,
    slots: slots.length > 0 ? slots : demoSlots,
  };
}

export async function getBookingConfirmationData({
  slug,
  bookingId,
}: {
  slug: string;
  bookingId?: string;
}) {
  noStore();

  const fallbackBusiness = getFallbackBusiness(slug);

  if (!bookingId || !isSupabaseConfigured()) {
    return getLocalBookingConfirmationData(bookingId);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      "booking_date, start_time, services(name, duration_minutes), businesses(name, address, timezone)"
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (!data) {
    return getLocalBookingConfirmationData(bookingId);
  }

  const business = takeFirstRelation(data.businesses);
  const service = takeFirstRelation(data.services);

  return {
    businessName: business?.name ?? fallbackBusiness.name,
    businessAddress: business?.address ?? fallbackBusiness.address,
    businessTimezone: business?.timezone ?? fallbackBusiness.timezone,
    bookingDate: data.booking_date,
    startTime: data.start_time,
    serviceName: service?.name ?? "Servicio",
    durationMinutes: service?.duration_minutes ?? 60,
    source: "live" as const,
  };
}

export async function getPublicManageBookingData({
  slug,
  bookingId,
  token,
}: {
  slug: string;
  bookingId?: string;
  token?: string;
}) {
  noStore();

  if (!isValidBookingManageToken({ slug, bookingId, token })) {
    return null;
  }

  if (!bookingId || !isSupabaseConfigured()) {
    const localBooking = await getLocalPublicManageBookingData(bookingId);

    if (!localBooking || localBooking.businessSlug !== slug) {
      return null;
    }

    return {
      ...localBooking,
      source: "local" as const,
    };
  }

  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      `
        id,
        booking_date,
        start_time,
        status,
        notes,
        businesses(name, slug, address, timezone),
        services(id, name, duration_minutes),
        customers(full_name, phone, email)
      `
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const business = takeFirstRelation(data.businesses);
  const service = takeFirstRelation(data.services);
  const customer = takeFirstRelation(data.customers);

  if (!business || business.slug !== slug) {
    return null;
  }

  return {
    id: data.id,
    businessSlug: business.slug,
    businessName: business.name,
    businessAddress: business.address ?? "",
    businessTimezone: business.timezone ?? demoBusiness.timezone,
    serviceId: service?.id ?? "",
    serviceName: service?.name ?? "Servicio",
    durationMinutes: service?.duration_minutes ?? 60,
    bookingDate: data.booking_date,
    startTime: data.start_time,
    status: data.status,
    statusLabel:
      data.status === "pending"
        ? "Pendiente"
        : data.status === "confirmed"
          ? "Confirmado"
          : data.status === "completed"
            ? "Completado"
            : data.status === "cancelled"
              ? "Cancelado"
              : "No asistio",
    fullName: customer?.full_name ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    notes: data.notes ?? "",
    source: "live" as const,
  };
}
