import { unstable_noStore as noStore } from "next/cache";

import { getPublicBusinessProfile } from "@/constants/public-business-profiles";
import { demoDashboardData } from "@/constants/demo";
import { dashboardHighlights } from "@/constants/site";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getLocalActiveBusinessSlug } from "@/server/local-admin-context";
import {
  getLocalAdminAvailabilityData,
  getLocalAdminBookingsData,
  getLocalAdminCustomersData,
  getLocalAdminDashboardData,
  getLocalOnboardingData,
  getLocalAdminServicesData,
  getLocalAdminSettingsData,
  getLocalAdminShellData,
} from "@/server/local-store";

type AdminShellData = {
  demoMode: boolean;
  profileName: string;
  businessName: string;
  businessSlug: string;
  userEmail: string;
  businessId?: string;
  businessOptions?: Array<{
    slug: string;
    name: string;
    templateSlug: string;
  }>;
};

type AnalyticsEventRecord = {
  event_name: "public_page_view" | "booking_cta_clicked" | "booking_page_view" | "booking_created";
  source: string | null;
  campaign: string | null;
};

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

function formatBookingStatus(status: string) {
  const labels: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    completed: "Completado",
    cancelled: "Cancelado",
    no_show: "No asistio",
  };

  return labels[status] ?? status;
}

function buildAnalyticsSummary(events: AnalyticsEventRecord[]) {
  const publicPageViews = events.filter((event) => event.event_name === "public_page_view");
  const bookingCtaClicks = events.filter((event) => event.event_name === "booking_cta_clicked");
  const bookingPageViews = events.filter((event) => event.event_name === "booking_page_view");
  const bookingCreated = events.filter((event) => event.event_name === "booking_created");
  const sourceCount = new Map<string, number>();
  const campaignCount = new Map<string, number>();
  const channelStats = new Map<
    string,
    {
      source: string;
      visits: number;
      ctaClicks: number;
      bookingIntents: number;
      bookingsCreated: number;
    }
  >();

  function ensureChannel(source: string) {
    const safeSource = source || "direct";
    const current = channelStats.get(safeSource);

    if (current) {
      return current;
    }

    const created = {
      source: safeSource,
      visits: 0,
      ctaClicks: 0,
      bookingIntents: 0,
      bookingsCreated: 0,
    };

    channelStats.set(safeSource, created);
    return created;
  }

  for (const event of publicPageViews) {
    const label = event.source || "direct";
    sourceCount.set(label, (sourceCount.get(label) ?? 0) + 1);
    ensureChannel(label).visits += 1;

    if (event.campaign) {
      campaignCount.set(event.campaign, (campaignCount.get(event.campaign) ?? 0) + 1);
    }
  }

  for (const event of bookingCtaClicks) {
    ensureChannel(event.source || "direct").ctaClicks += 1;
  }

  for (const event of bookingPageViews) {
    ensureChannel(event.source || "direct").bookingIntents += 1;
  }

  for (const event of bookingCreated) {
    ensureChannel(event.source || "direct").bookingsCreated += 1;
  }

  const [topSource = "direct", topSourceCount = 0] = Array.from(sourceCount.entries()).sort(
    (left, right) => right[1] - left[1]
  )[0] ?? ["direct", 0];
  const [topCampaign = "Sin campana"] = Array.from(campaignCount.entries()).sort(
    (left, right) => right[1] - left[1]
  )[0] ?? ["Sin campana", 0];
  const clickThroughRate =
    publicPageViews.length > 0
      ? Math.round((bookingCtaClicks.length / publicPageViews.length) * 100)
      : 0;
  const bookingIntentRate =
    publicPageViews.length > 0
      ? Math.round((bookingPageViews.length / publicPageViews.length) * 100)
      : 0;
  const conversionRate =
    publicPageViews.length > 0
      ? Math.round((bookingCreated.length / publicPageViews.length) * 100)
      : 0;

  return {
    visits: publicPageViews.length,
    ctaClicks: bookingCtaClicks.length,
    bookingIntents: bookingPageViews.length,
    bookingsCreated: bookingCreated.length,
    clickThroughRate,
    bookingIntentRate,
    conversionRate,
    topSource,
    topSourceCount,
    topCampaign,
    channels: Array.from(channelStats.values())
      .map((channel) => ({
        ...channel,
        conversionRate:
          channel.visits > 0
            ? Math.round((channel.bookingsCreated / channel.visits) * 100)
            : 0,
      }))
      .sort((left, right) => {
        if (right.bookingsCreated !== left.bookingsCreated) {
          return right.bookingsCreated - left.bookingsCreated;
        }

        return right.visits - left.visits;
      })
      .slice(0, 4),
  };
}

export async function getAdminShellData(): Promise<AdminShellData | null> {
  noStore();

  if (!isSupabaseConfigured()) {
    const activeBusinessSlug = await getLocalActiveBusinessSlug();
    return getLocalAdminShellData(activeBusinessSlug);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, business_id, businesses(name, slug)")
    .eq("auth_user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (!profile) {
    return null;
  }

  const business = takeFirstRelation(profile.businesses);

  return {
    demoMode: false,
    profileName: profile.full_name,
    businessName: business?.name ?? "Negocio",
    businessSlug: business?.slug ?? "negocio",
    userEmail: user.email ?? "",
    businessId: profile.business_id,
  };
}

async function getLiveBusinessId() {
  const shellData = await getAdminShellData();

  if (!shellData || shellData.demoMode || !shellData.businessId) {
    return null;
  }

  return shellData;
}

export async function getAdminDashboardData() {
  noStore();

  const shellData = await getAdminShellData();

  if (!shellData || shellData.demoMode || !shellData.businessId) {
    const activeBusinessSlug = await getLocalActiveBusinessSlug();
    return getLocalAdminDashboardData(activeBusinessSlug);
  }

  const supabase = await createClient();

  const [
    { count: bookingsCount },
    { count: customersCount },
    { count: pendingCount },
    { data: bookings },
    { data: analyticsEvents },
  ] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("business_id", shellData.businessId),
      supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("business_id", shellData.businessId),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("business_id", shellData.businessId)
        .eq("status", "pending"),
      supabase
        .from("bookings")
        .select("id, booking_date, start_time, status, customers(full_name), services(name)")
        .eq("business_id", shellData.businessId)
        .order("booking_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(5),
      supabase
        .from("analytics_events")
        .select("event_name, source, campaign")
        .eq("business_id", shellData.businessId),
    ]);

  const normalizedBookings =
    bookings?.map((booking) => ({
      id: booking.id,
      date: booking.booking_date,
      time: booking.start_time.slice(0, 5),
      status: formatBookingStatus(booking.status),
      customer: takeFirstRelation(booking.customers),
      service: takeFirstRelation(booking.services),
    })) ?? [];

  const safeBookings =
    normalizedBookings.length > 0
      ? normalizedBookings.map(({ customer, service, ...booking }) => ({
          ...booking,
          name: customer?.full_name ?? "Cliente",
          service: service?.name ?? "Servicio",
        }))
      : demoDashboardData.bookings;
  const analytics = buildAnalyticsSummary((analyticsEvents as AnalyticsEventRecord[] | null) ?? []);

  return {
    profileName: shellData.profileName,
    businessName: shellData.businessName,
    businessSlug: shellData.businessSlug,
    userEmail: shellData.userEmail,
    demoMode: false,
    analytics,
    reminders: null,
    notifications: [
      bookingsCount
        ? `${bookingsCount} turnos registrados`
        : "Todavia no hay turnos registrados",
      analytics.bookingsCreated > 0
        ? `${analytics.bookingsCreated} reservas llegaron desde la web`
        : "Todavia no hay reservas creadas desde la web",
      analytics.visits > 0
        ? `Canal principal: ${analytics.topSource}`
        : "Todavia no hay visitas registradas",
    ],
    metrics: [
      {
        ...dashboardHighlights[0],
        value: String(bookingsCount ?? 0),
        hint: `${pendingCount ?? 0} pendientes de confirmar`,
      },
      {
        ...dashboardHighlights[1],
        value: String(customersCount ?? 0),
        hint: "Clientes registrados en la base",
      },
      {
        ...dashboardHighlights[2],
        value: String(pendingCount ?? 0),
        hint: "Turnos pendientes de confirmacion",
      },
    ],
    bookings: safeBookings,
  };
}

export async function getAdminServicesData() {
  noStore();

  const shellData = await getLiveBusinessId();

  if (!shellData) {
    const activeBusinessSlug = await getLocalActiveBusinessSlug();
    return getLocalAdminServicesData(activeBusinessSlug);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("id, name, description, duration_minutes, price")
    .eq("business_id", shellData.businessId)
    .eq("active", true)
    .order("created_at", { ascending: true });

  return (
    data?.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      durationMinutes: service.duration_minutes,
      priceLabel: formatMoney(service.price),
    })) ?? []
  );
}

export async function getAdminBookingsData() {
  noStore();

  const shellData = await getLiveBusinessId();

  if (!shellData) {
    const activeBusinessSlug = await getLocalActiveBusinessSlug();
    return getLocalAdminBookingsData(activeBusinessSlug);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select("id, booking_date, start_time, status, notes, customers(full_name, phone), services(name)")
    .eq("business_id", shellData.businessId)
    .order("booking_date", { ascending: true })
    .order("start_time", { ascending: true });

  return (
    data?.map((booking) => {
      const customer = takeFirstRelation(booking.customers);
      const service = takeFirstRelation(booking.services);

      return {
        id: booking.id,
        customerName: customer?.full_name ?? "Cliente",
        phone: customer?.phone ?? "",
        serviceName: service?.name ?? "Servicio",
        bookingDate: booking.booking_date,
        startTime: booking.start_time.slice(0, 5),
        status: formatBookingStatus(booking.status),
        notes: booking.notes ?? "",
      };
    }) ?? []
  );
}

export async function getAdminCustomersData() {
  noStore();

  const shellData = await getLiveBusinessId();

  if (!shellData) {
    const activeBusinessSlug = await getLocalActiveBusinessSlug();
    return getLocalAdminCustomersData(activeBusinessSlug);
  }

  const supabase = await createClient();
  const [{ data: customers }, { data: bookings }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, phone, email, notes, created_at")
      .eq("business_id", shellData.businessId)
      .order("created_at", { ascending: false }),
    supabase
      .from("bookings")
      .select("customer_id, booking_date, start_time")
      .eq("business_id", shellData.businessId),
  ]);

  return (
    customers?.map((customer) => {
      const customerBookings =
        bookings?.filter((booking) => booking.customer_id === customer.id) ?? [];
      const lastBooking = customerBookings
        .slice()
        .sort((a, b) => `${b.booking_date}T${b.start_time}`.localeCompare(`${a.booking_date}T${a.start_time}`))[0];

      return {
        id: customer.id,
        fullName: customer.full_name,
        phone: customer.phone,
        email: customer.email ?? "",
        notes: customer.notes ?? "",
        bookingsCount: customerBookings.length,
        lastBookingDate: lastBooking?.booking_date ?? null,
      };
    }) ?? []
  );
}

export async function getAdminAvailabilityData() {
  noStore();

  const shellData = await getLiveBusinessId();

  if (!shellData) {
    const activeBusinessSlug = await getLocalActiveBusinessSlug();
    return getLocalAdminAvailabilityData(activeBusinessSlug);
  }

  const supabase = await createClient();
  const [{ data: rules }, { data: blockedSlots }] = await Promise.all([
    supabase
      .from("availability_rules")
      .select("id, business_id, day_of_week, start_time, end_time, active")
      .eq("business_id", shellData.businessId)
      .order("day_of_week", { ascending: true }),
    supabase
      .from("blocked_slots")
      .select("id, business_id, blocked_date, start_time, end_time, reason")
      .eq("business_id", shellData.businessId)
      .order("blocked_date", { ascending: true })
      .order("start_time", { ascending: true }),
  ]);

  return {
    rules:
      rules?.map((rule) => ({
        id: rule.id,
        businessId: rule.business_id,
        dayOfWeek: rule.day_of_week,
        startTime: rule.start_time,
        endTime: rule.end_time,
        active: rule.active,
      })) ?? [],
    blockedSlots:
      blockedSlots?.map((slot) => ({
        id: slot.id,
        businessId: slot.business_id,
        blockedDate: slot.blocked_date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        reason: slot.reason,
      })) ?? [],
  };
}

export async function getAdminSettingsData() {
  noStore();

  const shellData = await getLiveBusinessId();

  if (!shellData) {
    const activeBusinessSlug = await getLocalActiveBusinessSlug();
    return getLocalAdminSettingsData(activeBusinessSlug);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("businesses")
    .select("name, slug, phone, email, address, timezone")
    .eq("id", shellData.businessId)
    .maybeSingle();

  return {
    businessName: data?.name ?? shellData.businessName,
    businessSlug: data?.slug ?? shellData.businessSlug,
    phone: data?.phone ?? "",
    email: data?.email ?? shellData.userEmail,
    address: data?.address ?? "",
    timezone: data?.timezone ?? "America/Argentina/Buenos_Aires",
    publicUrl: `/${data?.slug ?? shellData.businessSlug}`,
    profile: getPublicBusinessProfile(
      data?.slug ?? shellData.businessSlug,
      data?.name ?? shellData.businessName
    ),
  };
}

export async function getAdminOnboardingData() {
  noStore();

  const shellData = await getAdminShellData();

  if (!isSupabaseConfigured()) {
    const localOnboardingData = await getLocalOnboardingData();

    return {
      demoMode: true,
      businesses: localOnboardingData.businesses,
      templates: localOnboardingData.templates,
      activeBusinessSlug: shellData?.businessSlug ?? null,
    };
  }

  return {
    demoMode: false,
    businesses: [],
    templates: [],
    activeBusinessSlug: shellData?.businessSlug ?? null,
  };
}
