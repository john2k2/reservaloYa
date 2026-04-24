import { CalendarClock, Percent } from "lucide-react";

import { dashboardHighlights } from "@/constants/site";

type BusinessOptionInput = {
  slug: string;
  name: string;
  templateSlug?: string | null;
};

type AdminShellViewInput = {
  demoMode: boolean;
  profileName: string;
  businessName: string;
  businessSlug: string;
  userEmail: string;
  userVerified?: boolean;
  userRole?: string;
  businessId?: string;
  businessOptions?: BusinessOptionInput[];
  subscriptionStatus?: "trial" | "active" | "cancelled" | "suspended";
  subscriptionExpired?: boolean;
};

type DashboardBookingPreviewInput<TStatus extends string = string> = {
  id: string;
  customerName?: string | null;
  serviceName?: string | null;
  bookingDate: string;
  startTime: string;
  status: TStatus;
};

type DashboardMetricSummaryInput = {
  visits: number;
  ctaClicks: number;
  bookingsCreated: number;
  conversionRate: number;
  pendingBookings: number;
  customersCount: number;
  customersHint: string;
  topCampaignLabel: string;
  hasVisits: boolean;
};

type DashboardNotificationsInput = {
  pendingBookings: number;
  remindersPending: number;
  remindersProviderReady: boolean;
  bookingsCreated: number;
  visits: number;
  topSource: string;
};

type AdminDashboardViewInput<TAnalytics, TReminders> = {
  profileName: string;
  businessName: string;
  businessSlug: string;
  userEmail: string;
  demoMode: boolean;
  metrics: ReturnType<typeof buildAdminDashboardMetrics>;
  bookings: ReturnType<typeof buildAdminDashboardBookingPreview>;
  analytics: TAnalytics;
  reminders: TReminders;
  notifications: string[];
};

export function buildAdminBusinessOptionsView(options: BusinessOptionInput[]) {
  return options
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((item) => ({
      slug: item.slug,
      name: item.name,
      templateSlug: item.templateSlug ?? item.slug,
    }));
}

export function buildAdminShellView(input: AdminShellViewInput) {
  return {
    demoMode: input.demoMode,
    profileName: input.profileName,
    businessName: input.businessName,
    businessSlug: input.businessSlug,
    userEmail: input.userEmail,
    userVerified: input.userVerified,
    userRole: input.userRole,
    businessId: input.businessId,
    businessOptions: input.businessOptions
      ? buildAdminBusinessOptionsView(input.businessOptions)
      : undefined,
    subscriptionStatus: input.subscriptionStatus,
    subscriptionExpired: input.subscriptionExpired,
  };
}

export function buildAdminDashboardBookingPreview<TStatus extends string>(
  bookings: DashboardBookingPreviewInput<TStatus>[],
  formatStatus: (status: TStatus) => string
) {
  return bookings
    .slice()
    .sort((left, right) =>
      `${left.bookingDate}T${left.startTime}`.localeCompare(`${right.bookingDate}T${right.startTime}`)
    )
    .slice(0, 5)
    .map((booking) => ({
      id: booking.id,
      name: booking.customerName ?? "Cliente",
      service: booking.serviceName ?? "Servicio",
      date: booking.bookingDate,
      time: booking.startTime,
      status: formatStatus(booking.status),
    }));
}

export function buildAdminDashboardNotifications(input: DashboardNotificationsInput) {
  const alerts: string[] = [];

  if (input.pendingBookings > 0) {
    alerts.push(`${input.pendingBookings} turnos pendientes de confirmar`);
  }
  if (input.remindersPending > 0) {
    alerts.push(
      input.remindersProviderReady
        ? `${input.remindersPending} recordatorios listos para enviar`
        : `${input.remindersPending} recordatorios listos cuando actives email o WhatsApp`
    );
  }
  if (input.bookingsCreated > 0) {
    alerts.push(`${input.bookingsCreated} reservas llegaron desde la web`);
  }
  if (input.visits > 0) {
    alerts.push(`Canal principal: ${input.topSource}`);
  }

  return alerts;
}

export function buildAdminDashboardMetrics(input: DashboardMetricSummaryInput) {
  return [
    {
      label: "Visitas publicas",
      value: String(input.visits),
      hint: `${input.ctaClicks} clics en reservar`,
      icon: dashboardHighlights[0]?.icon ?? CalendarClock,
    },
    {
      label: "Reservas creadas",
      value: String(input.bookingsCreated),
      hint: `${input.pendingBookings} pendientes de confirmar`,
      icon: CalendarClock,
    },
    {
      label: "Conversion web",
      value: `${input.conversionRate}%`,
      hint: input.hasVisits ? `Campana principal: ${input.topCampaignLabel}` : "Todavia sin visitas registradas",
      icon: Percent,
    },
    {
      ...dashboardHighlights[1],
      value: String(input.customersCount),
      hint: input.customersHint,
    },
  ];
}

export function buildAdminDashboardView<TAnalytics, TReminders>(
  input: AdminDashboardViewInput<TAnalytics, TReminders>
) {
  return {
    profileName: input.profileName,
    businessName: input.businessName,
    businessSlug: input.businessSlug,
    userEmail: input.userEmail,
    demoMode: input.demoMode,
    metrics: input.metrics,
    bookings: input.bookings,
    analytics: input.analytics,
    reminders: input.reminders,
    notifications: input.notifications,
  };
}
