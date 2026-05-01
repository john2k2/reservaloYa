import { createServerClient } from "@/lib/supabase/server";
import { getPublicAppUrl } from "@/lib/runtime";
import { buildBookingDateOptions, findNextBookingDate } from "@/lib/bookings/format";
import { createLogger } from "@/server/logger";
import { buildAdminAvailabilityView, buildAdminBookingsView, buildAdminCustomersView, buildAdminServicesView, buildAdminSettingsView } from "@/server/admin-views-domain";
import { buildAdminDashboardBookingPreview, buildAdminDashboardMetrics, buildAdminDashboardNotifications, buildAdminDashboardView, buildAdminShellView } from "@/server/admin-dashboard-domain";
import type { AuthUser } from "@/server/supabase-auth";
import { formatStatus, toMoney, calculateSlots, isActiveRecord, buildBusinessPublicProfile, type BusinessRecord, ServiceRecord, CustomerRecord, BookingRecord, AppUserRecord, AvailabilityRuleRecord, BlockedSlotRecord, AnalyticsRecord, CommunicationRecord } from "@/server/supabase-domain";
import { getAvailableReminderChannels, hasReminderProviderConfigured } from "@/server/booking-notifications";
import { demoBusinessOptions } from "@/constants/site";
import { demoPresets } from "@/constants/demo";
import { getSupabaseAdminClient } from "./_core";
import { getBusinessByIdWithClient } from "./helpers";

export async function getSupabaseAdminShellData(authUser: AuthUser) {
  const client = await createServerClient();

  const { data: appUserData, error: appUserError } = await client
    .from("app_users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (appUserError || !appUserData) {
    return null;
  }

  const appUser = appUserData as AppUserRecord;

  if (appUser.active === false) {
    return null;
  }

  const businessId = authUser.businessId ?? appUser.business_id;

  if (!businessId) {
    return null;
  }

  const business = await getBusinessByIdWithClient(client, String(businessId));

  const { subscriptionStatus, subscriptionExpired } = await resolveSubscriptionStatus(
    client,
    business.id
  );

  return buildAdminShellView({
    demoMode: false,
    profileName: String(authUser.name ?? authUser.email ?? "Owner"),
    businessName: business.name,
    businessSlug: business.slug,
    userEmail: String(authUser.email ?? ""),
    userVerified: false,
    userRole: String(authUser.role ?? "staff"),
    businessId: business.id,
    subscriptionStatus,
    subscriptionExpired,
  });
}

async function resolveSubscriptionStatus(
  client: Awaited<ReturnType<typeof createServerClient>>,
  businessId: string
): Promise<{
  subscriptionStatus: "trial" | "active" | "cancelled" | "suspended";
  subscriptionExpired: boolean;
}> {
  const { data: sub, error } = await client
    .from("subscriptions")
    .select("*")
    .eq("businessId", businessId)
    .single();

  if (error || !sub) {
    return { subscriptionStatus: "trial", subscriptionExpired: false };
  }

  const status = sub.status as "trial" | "active" | "cancelled" | "suspended";

  if (status === "active") {
    return { subscriptionStatus: "active", subscriptionExpired: false };
  }

  if (status === "trial") {
    const expired = sub.trialEndsAt ? new Date(sub.trialEndsAt) < new Date() : false;
    return { subscriptionStatus: "trial", subscriptionExpired: expired };
  }

  if (status === "cancelled") {
    const stillActive = sub.nextBillingDate ? new Date(sub.nextBillingDate) > new Date() : false;
    return { subscriptionStatus: "cancelled", subscriptionExpired: !stillActive };
  }

  return { subscriptionStatus: status, subscriptionExpired: true };
}


export async function getSupabaseAdminDashboardData(businessId: string) {
  const client = await createServerClient();
  const business = await getBusinessByIdWithClient(client, businessId);

  const [{ data: bookingsData }, { data: customersData }, { data: analyticsData }, { data: commData }] = await Promise.all([
    client.from("bookings").select("*, customer:customers(*), service:services(*)").eq("business_id", businessId).order("bookingDate").order("startTime"),
    client.from("customers").select("*").eq("business_id", businessId),
    client.from("analytics_events").select("*").eq("business_id", businessId),
    client.from("communication_events").select("*").eq("business_id", businessId),
  ]);

  const businessBookings = (bookingsData ?? []) as (BookingRecord & { customer?: CustomerRecord; service?: ServiceRecord })[];
  const businessCustomers = (customersData ?? []) as CustomerRecord[];
  const businessAnalyticsEvents = (analyticsData ?? []) as AnalyticsRecord[];
  const businessCommunicationEvents = (commData ?? []) as CommunicationRecord[];

  const publicPageViews = businessAnalyticsEvents.filter(
    (event) => event.eventName === "public_page_view"
  );
  const bookingCtaClicks = businessAnalyticsEvents.filter(
    (event) => event.eventName === "booking_cta_clicked"
  );
  const bookingPageViews = businessAnalyticsEvents.filter(
    (event) => event.eventName === "booking_page_view"
  );
  const bookingCreated = businessAnalyticsEvents.filter(
    (event) => event.eventName === "booking_created"
  );
  const topSource =
    publicPageViews.reduce(
      (acc, event) => {
        const key = event.source || "direct";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  const topSourceLabel =
    Object.entries(topSource).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "direct";
  const pendingBookings = businessBookings.filter((booking) => booking.status === "pending").length;
  const remindersPending = businessBookings.filter((booking) => {
    const [year, month, day] = booking.bookingDate.split("-").map(Number);
    const [hours, minutes] = booking.startTime.split(":").map(Number);
    const bookingTime = new Date(year, month - 1, day, hours, minutes).getTime();
    const sent = businessCommunicationEvents.some(
      (event) => event.kind === "reminder" && event.status === "sent" && event.booking_id === booking.id
    );
    return (
      !sent &&
      ["pending", "confirmed"].includes(booking.status) &&
      bookingTime >= Date.now() &&
      bookingTime <= Date.now() + 24 * 60 * 60 * 1000
    );
  }).length;
  const analytics = {
    visits: publicPageViews.length,
    ctaClicks: bookingCtaClicks.length,
    bookingIntents: bookingPageViews.length,
    bookingsCreated: bookingCreated.length,
    clickThroughRate:
      publicPageViews.length > 0
        ? Math.round((bookingCtaClicks.length / publicPageViews.length) * 100)
        : 0,
    bookingIntentRate:
      publicPageViews.length > 0
        ? Math.round((bookingPageViews.length / publicPageViews.length) * 100)
        : 0,
    conversionRate:
      publicPageViews.length > 0
        ? Math.round((bookingCreated.length / publicPageViews.length) * 100)
        : 0,
    topSource: topSourceLabel,
    topSourceCount: topSource[topSourceLabel] ?? 0,
    topCampaign:
      businessAnalyticsEvents.find((event) => event.campaign)?.campaign ?? "Sin campana",
    channels: Object.entries(topSource)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([source, visits]) => ({
        source,
        visits,
        conversionRate:
          publicPageViews.length > 0
            ? Math.round((bookingCreated.filter((e) => e.source === source).length / publicPageViews.length) * 100)
            : 0,
      })),
  };
  const reminders = {
    reminderWindowHours: 24,
    pending: remindersPending,
    missingEmail: businessBookings.filter(
      (booking) =>
        getAvailableReminderChannels({
          customerEmail: booking.customer?.email,
          customerPhone: booking.customer?.phone,
        }).length === 0
    ).length,
    sentRecently: businessCommunicationEvents.filter((event) => event.kind === "reminder").length,
    providerReady: hasReminderProviderConfigured(),
    nextBookingAt:
      businessBookings[0] != null
        ? `${businessBookings[0].bookingDate} ${businessBookings[0].startTime}`
        : null,
  };
  const notifications = buildAdminDashboardNotifications({
    pendingBookings,
    remindersPending,
    remindersProviderReady: reminders.providerReady,
    bookingsCreated: analytics.bookingsCreated,
    visits: analytics.visits,
    topSource: analytics.topSource,
  });
  const metrics = buildAdminDashboardMetrics({
    visits: analytics.visits,
    ctaClicks: analytics.ctaClicks,
    bookingsCreated: analytics.bookingsCreated,
    conversionRate: analytics.conversionRate,
    pendingBookings,
    customersCount: businessCustomers.length,
    customersHint: "Clientes registrados en Supabase",
    topCampaignLabel: analytics.topCampaign,
    hasVisits: analytics.visits > 0,
  });
  const bookingPreview = buildAdminDashboardBookingPreview(
    businessBookings.map((booking) => ({
      id: booking.id,
      customerName: booking.customer?.fullName,
      serviceName: booking.service?.name,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      status: booking.status,
    })),
    formatStatus
  );

  return buildAdminDashboardView({
    profileName: "Supabase Owner",
    businessName: business.name,
    businessSlug: business.slug,
    userEmail: "",
    demoMode: false,
    analytics,
    reminders,
    notifications,
    metrics,
    bookings: bookingPreview,
  });
}


export async function getSupabaseAdminBookingsData(
  businessId: string,
  filters?: {
    status?: string;
    date?: string;
    q?: string;
  }
) {
  const client = await createServerClient();

  const { data: bookingsData } = await client
    .from("bookings")
    .select("*, customer:customers(*), service:services(*)")
    .eq("business_id", businessId)
    .order("bookingDate")
    .order("startTime");

  const bookings = (bookingsData ?? []) as (BookingRecord & { customer?: CustomerRecord; service?: ServiceRecord })[];

  return buildAdminBookingsView(
    bookings.map((booking) => ({
      id: booking.id,
      customerName: booking.customer?.fullName,
      phone: booking.customer?.phone,
      serviceName: booking.service?.name,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      status: booking.status,
      notes: booking.notes,
    })),
    filters,
    formatStatus
  );
}


export async function getSupabaseAdminCustomersData(businessId: string, query?: string) {
  const client = await createServerClient();

  const [{ data: customersData }, { data: bookingsData }] = await Promise.all([
    client.from("customers").select("*").eq("business_id", businessId).order("fullName"),
    client.from("bookings").select("customer_id, bookingDate, startTime").eq("business_id", businessId),
  ]);

  const customers = (customersData ?? []) as CustomerRecord[];
  const bookings = (bookingsData ?? []) as { customer_id: string; bookingDate: string; startTime: string }[];

  return buildAdminCustomersView(
    customers.map((customer) => ({
      id: customer.id,
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email,
      notes: customer.notes,
      createdAt: customer.created,
    })),
    bookings.map((booking) => ({
      customerId: booking.customer_id,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
    })),
    query
  );
}


export async function getSupabaseAdminServicesData(businessId: string) {
  const client = await createServerClient();

  const { data: servicesData } = await client
    .from("services")
    .select("*")
    .eq("business_id", businessId)
    .order("featured", { ascending: false })
    .order("name");

  const services = ((servicesData ?? []) as ServiceRecord[]).filter(isActiveRecord);

  return buildAdminServicesView(
    services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      durationMinutes: Number(service.durationMinutes),
      price: service.price ?? null,
      featured: service.featured,
      featuredLabel: service.featuredLabel,
    })),
    toMoney
  );
}


export async function getSupabaseAdminAvailabilityData(businessId: string) {
  const client = await createServerClient();

  const [{ data: rulesData }, { data: blockedData }] = await Promise.all([
    client.from("availability_rules").select("*").eq("business_id", businessId).order("dayOfWeek").order("startTime"),
    client.from("blocked_slots").select("*").eq("business_id", businessId).order("blockedDate").order("startTime"),
  ]);

  const rules = (rulesData ?? []) as AvailabilityRuleRecord[];
  const blockedSlots = (blockedData ?? []) as BlockedSlotRecord[];

  return buildAdminAvailabilityView(
    rules.map((rule) => ({
      id: rule.id,
      businessId: rule.business_id,
      dayOfWeek: rule.dayOfWeek,
      startTime: rule.startTime,
      endTime: rule.endTime,
      active: Boolean(rule.active),
    })),
    blockedSlots.map((slot) => ({
      id: slot.id,
      businessId: slot.business_id,
      blockedDate: slot.blockedDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
      reason: slot.reason,
    }))
  );
}


export async function getSupabaseAdminSettingsData(businessId: string) {
  const client = await createServerClient();
  const business = await getBusinessByIdWithClient(client, businessId);

  return buildAdminSettingsView(
    {
      name: business.name,
      slug: business.slug,
      templateSlug: business.templateSlug,
      phone: business.phone,
      email: business.email,
      address: business.address,
      timezone: business.timezone,
      cancellationPolicy: business.cancellationPolicy,
      autoConfirmBookings: business.autoConfirmBookings,
      mpConnected: business.mpConnected,
      mpCollectorId: business.mpCollectorId,
    },
    buildBusinessPublicProfile(business)
  );
}


export async function getSupabaseOnboardingData(businessId?: string) {
  const client = await createServerClient();
  const businesses = businessId
    ? [await getBusinessByIdWithClient(client, businessId)].filter(isActiveRecord)
    : [];

  return {
    templates: demoBusinessOptions.map((option) => ({
      ...option,
      businessName: demoPresets[option.slug]?.business.name ?? option.label,
    })),
    businesses: businesses.map((business) => ({
      slug: business.slug,
      name: business.name,
      templateSlug: business.templateSlug ?? business.slug,
      phone: business.phone ?? "",
    })),
  };
}


export async function getSupabaseAdminTeamData(businessId: string) {
  const client = await createServerClient();

  const { data: usersData } = await client
    .from("app_users")
    .select("*")
    .eq("business_id", businessId)
    .order("name")
    .order("email");

  const users = (usersData ?? []) as AppUserRecord[];

  return users.map((user) => ({
    id: user.id,
    name: String(user.name ?? "Sin nombre"),
    email: "",
    role: String(user.role ?? "staff"),
    active: user.active !== false,
    verified: false,
  }));
}


