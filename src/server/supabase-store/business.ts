import { createPublicClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { buildWeeklySchedule } from "@/lib/bookings/schedule";
import {
  buildBookingDateOptions,
  findNextBookingDate,
  getDayOfWeek,
} from "@/lib/bookings/format";
import {
  buildBusinessPublicProfile,
  isActiveRecord,
  toMoney,
  calculateSlots,
  type BusinessRecord,
  type ServiceRecord,
  type AvailabilityRuleRecord,
  type BlockedSlotRecord,
  type BookingRecord,
} from "@/server/supabase-domain";
import { buildBusinessPaymentSettings } from "@/server/payments-domain";
import { getSupabaseAdminClient } from "./_core";
import { getBusinessBySlug } from "./helpers";
import type { PublicBookingConflictRow } from "./types";

export async function getSupabasePublicBusinessPageData(slug: string) {
  const client = createPublicClient();
  const normalizedSlug = slugify(slug);

  const { data: businessData, error: businessError } = await client
    .from("businesses")
    .select("*")
    .eq("slug", normalizedSlug)
    .eq("active", true)
    .single();

  if (businessError || !businessData) {
    return null;
  }
  const business = businessData as BusinessRecord;

  const [servicesResult, rulesResult, reviewsResult] = await Promise.all([
    client.from("services").select("*").eq("business_id", business.id).order("featured", { ascending: false }).order("name"),
    client.from("availability_rules").select("*").eq("business_id", business.id).order("dayOfWeek").order("startTime"),
    client.from("reviews").select("customerName, rating, comment, created").eq("business_id", business.id).gte("rating", 4).order("created", { ascending: false }).limit(6),
  ]);

  const services = (servicesResult.data ?? []) as ServiceRecord[];
  const businessAvailabilityRules = (rulesResult.data ?? []) as AvailabilityRuleRecord[];
  const reviews = (reviewsResult.data ?? []) as Array<{
    customerName: string;
    rating: number;
    comment?: string;
    created: string;
  }>;

  return {
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      phone: business.phone ?? "",
      email: business.email ?? "",
      address: business.address ?? "",
      timezone: business.timezone ?? "America/Argentina/Buenos_Aires",
      cancellationPolicy: business.cancellationPolicy,
      mpConnected: business.mpConnected ?? false,
    },
    profile: buildBusinessPublicProfile(business),
    weeklyHours: buildWeeklySchedule(
      businessAvailabilityRules.map((rule) => ({
        dayOfWeek: rule.dayOfWeek,
        startTime: rule.startTime,
        endTime: rule.endTime,
      }))
    ),
    services: services.filter(isActiveRecord).map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description ?? "",
      durationMinutes: Number(service.durationMinutes),
      price: service.price ?? null,
      featured: Boolean(service.featured),
      featuredLabel: service.featuredLabel ?? "",
      priceLabel: toMoney(service.price),
    })),
    reviews,
    source: "supabase" as const,
  };
}

export async function getSupabasePublicBusinessSitemapEntries() {
  const client = createPublicClient();
  const { data, error } = await client.from("businesses").select("slug, updated").eq("active", true);
  if (error || !data) return [];
  return (data as BusinessRecord[]).map((b) => ({
    slug: b.slug,
    updated: b.updated,
  }));
}

export async function getSupabaseBusinessPaymentSettingsBySlug(slug: string) {
  const business = await getBusinessBySlug(slug);
  return buildBusinessPaymentSettings(business);
}

export async function getSupabasePublicBookingFlowData(
  input: {
    slug: string;
    serviceId?: string;
    bookingDate?: string;
  },
  preloadedPageData?: Awaited<ReturnType<typeof getSupabasePublicBusinessPageData>> | null
) {
  const client = createPublicClient();
  const pageData =
    preloadedPageData ?? (await getSupabasePublicBusinessPageData(input.slug));

  if (!pageData) {
    return null;
  }

  const selectedService =
    pageData.services.find((service) => service.id === input.serviceId) ?? pageData.services[0];

  if (!selectedService) {
    return {
      ...pageData,
      selectedService: null,
      bookingDate: input.bookingDate ?? new Date().toISOString().slice(0, 10),
      dateOptions: [],
      slots: [],
    };
  }

  const { data: allRulesData } = await client
    .from("availability_rules")
    .select("*")
    .eq("business_id", pageData.business.id);
  const allRules = (allRulesData ?? []) as AvailabilityRuleRecord[];

  const activeDays = Array.from(new Set(allRules.map((rule) => rule.dayOfWeek)));
  const selectedDate =
    input.bookingDate ??
    findNextBookingDate(new Date().toISOString().slice(0, 10), activeDays);
  const dayOfWeek = getDayOfWeek(selectedDate);
  const dateOptions = buildBookingDateOptions(selectedDate, activeDays);

  const [{ data: blockedData }, { data: bookingsData, error: bookingsError }] = await Promise.all([
    client
      .from("blocked_slots")
      .select("*")
      .eq("business_id", pageData.business.id)
      .eq("blockedDate", selectedDate),
    client.rpc("get_public_booking_conflicts", {
      input_business_id: pageData.business.id,
      input_booking_date: selectedDate,
    }),
  ]);

  const blocked = (blockedData ?? []) as BlockedSlotRecord[];
  const bookings = (bookingsError ? [] : ((bookingsData ?? []) as PublicBookingConflictRow[])).map(
    (booking) =>
      ({
        id: booking.id,
        created: "",
        updated: "",
        business_id: pageData.business.id,
        customer_id: "",
        service_id: selectedService.id,
        bookingDate: selectedDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        notes: "",
      }) as BookingRecord
  );

  const dayRules = allRules.filter(
    (rule) =>
      rule.dayOfWeek === dayOfWeek &&
      isActiveRecord(rule)
  );
  const blockedSlots = blocked.filter((slot) => slot.blockedDate === selectedDate);
  const activeBookings = bookings.filter(
    (booking) =>
      booking.bookingDate === selectedDate &&
      ["pending", "pending_payment", "confirmed"].includes(booking.status)
  );

  const slots = calculateSlots({
    rules: dayRules,
    blocked: blockedSlots,
    bookings: activeBookings,
    durationMinutes: selectedService.durationMinutes,
  });

  return {
    ...pageData,
    selectedService,
    bookingDate: selectedDate,
    dateOptions,
    slots,
  };
}

export async function getSupabaseBusinessIdBySlug(slug: string): Promise<string | null> {
  try {
    const business = await getBusinessBySlug(slug);
    return business.id;
  } catch {
    return null;
  }
}
