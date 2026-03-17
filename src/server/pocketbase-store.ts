import { CalendarClock, ChartColumnBig, Percent } from "lucide-react";
import type { RecordModel } from "pocketbase";

import type { PublicBusinessProfile } from "@/constants/public-business-profiles";
import { dashboardHighlights, demoBusinessOptions } from "@/constants/site";
import { demoPresets } from "@/constants/demo";
import {
  addMinutes,
  buildBookingDateOptions,
  findNextBookingDate,
  getDayOfWeek,
} from "@/lib/bookings/format";
import { buildWeeklySchedule } from "@/lib/bookings/schedule";
import { createPocketBaseAdminClient } from "@/lib/pocketbase/admin";
import { createPocketBasePublicClient } from "@/lib/pocketbase/public";
import { slugify } from "@/lib/utils";
import { withBookingDateLock } from "@/server/booking-slot-lock";
import {
  type AnalyticsRecord,
  type AvailabilityRuleRecord,
  type BookingStatus,
  type BlockedSlotRecord,
  type BookingRecord,
  buildBlockedSlotKey,
  buildBusinessPublicProfile,
  calculateSlots,
  countFeaturedRecords,
  type BusinessRecord,
  type CommunicationRecord,
  type CustomerRecord,
  formatStatus,
  isActiveRecord,
  joinPocketBaseFilters,
  overlaps,
  parseProfileOverrides,
  type ServiceRecord,
  toMinutes,
  toMoney,
  type UserRecord,
} from "@/server/pocketbase-domain";
import {
  getAvailableReminderChannels,
  hasReminderProviderConfigured,
  sendBookingReminderEmail,
  sendBookingReminderWhatsApp,
} from "@/server/booking-notifications";

type PocketBaseListOptions = {
  sort?: string;
  expand?: string;
  filter?: string;
};

type PocketBaseScopedClient =
  | Awaited<ReturnType<typeof createPocketBaseAdminClient>>
  | Awaited<ReturnType<typeof createPocketBasePublicClient>>;

async function listPocketBaseRecords<T>(collection: string, options?: PocketBaseListOptions) {
  const pb = await getAdminClient();

  return listPocketBaseRecordsWithClient<T>(pb, collection, options);
}

function listPocketBaseRecordsWithClient<T>(
  pb: PocketBaseScopedClient,
  collection: string,
  options?: PocketBaseListOptions
) {
  return pb.collection(collection).getFullList<T>({
    sort: options?.sort,
    expand: options?.expand,
    filter: options?.filter,
    batch: 1000,
    requestKey: null,
  });
}

async function getAdminClient() {
  return createPocketBaseAdminClient();
}

async function getPublicReadClient() {
  return createPocketBasePublicClient();
}

async function getPublicMutationClient() {
  return createPocketBasePublicClient();
}

async function getBusinessBySlug(slug: string) {
  const pb = await getAdminClient();
  return (await pb
    .collection("businesses")
    .getFirstListItem<BusinessRecord>(pb.filter("slug = {:slug}", { slug }))) as BusinessRecord;
}

async function getBusinessById(id: string) {
  const pb = await getAdminClient();
  return (await pb.collection("businesses").getOne<BusinessRecord>(id)) as BusinessRecord;
}

export async function getPocketBaseBusinessBySlug(slug: string) {
  try {
    return await getBusinessBySlug(slug);
  } catch {
    return null;
  }
}

export async function getPocketBaseAdminShellData(userRecord: RecordModel) {
  if ((userRecord as { active?: boolean }).active === false) {
    return null;
  }

  const businessId = Array.isArray(userRecord.business)
    ? userRecord.business[0]
    : userRecord.business;

  if (!businessId) {
    return null;
  }

  const business = await getBusinessById(String(businessId));

  return {
    demoMode: false,
    profileName: String(userRecord.name ?? userRecord.email ?? "Owner"),
    businessName: business.name,
    businessSlug: business.slug,
    userEmail: String(userRecord.email ?? ""),
    userVerified: Boolean((userRecord as { verified?: boolean }).verified),
    userRole: String((userRecord as { role?: string }).role ?? "staff"),
    businessId: business.id,
  };
}

export async function getPocketBasePublicBusinessPageData(slug: string) {
  const pb = await getPublicReadClient();

  let business: BusinessRecord;

  try {
    business = await pb
      .collection("businesses")
      .getFirstListItem<BusinessRecord>(
        pb.filter("slug = {:slug} && active = true", { slug })
      );
  } catch {
    return null;
  }

  const [services, businessAvailabilityRules] = await Promise.all([
    listPocketBaseRecordsWithClient<ServiceRecord>(pb, "services", {
      sort: "-featured,name",
      filter: pb.filter("business = {:business}", { business: business.id }),
    }),
    listPocketBaseRecordsWithClient<AvailabilityRuleRecord>(pb, "availability_rules", {
      sort: "dayOfWeek,startTime",
      filter: pb.filter("business = {:business}", { business: business.id }),
    }),
  ]);

  return {
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      phone: business.phone ?? "",
      email: business.email ?? "",
      address: business.address ?? "",
      timezone: business.timezone ?? "America/Argentina/Buenos_Aires",
      mpAccessToken: business.mpAccessToken,
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
    source: "pocketbase" as const,
  };
}

export async function getPocketBasePublicBookingFlowData(
  input: {
    slug: string;
    serviceId?: string;
    bookingDate?: string;
  },
  preloadedPageData?: Awaited<ReturnType<typeof getPocketBasePublicBusinessPageData>> | null
) {
  const pb = await getPublicReadClient();
  const pageData =
    preloadedPageData ?? (await getPocketBasePublicBusinessPageData(input.slug));

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

  const allRules = (
    await listPocketBaseRecordsWithClient<AvailabilityRuleRecord>(pb, "availability_rules", {
      filter: pb.filter("business = {:business}", { business: pageData.business.id }),
    })
  ).filter(isActiveRecord);
  const activeDays = Array.from(new Set(allRules.map((rule) => rule.dayOfWeek)));
  const selectedDate =
    input.bookingDate ??
    findNextBookingDate(new Date().toISOString().slice(0, 10), activeDays);
  const dayOfWeek = getDayOfWeek(selectedDate);
  const dateOptions = buildBookingDateOptions(selectedDate, activeDays);

  const [blocked, bookings] = await Promise.all([
    listPocketBaseRecordsWithClient<BlockedSlotRecord>(pb, "blocked_slots", {
      filter: joinPocketBaseFilters(
        pb.filter("business = {:business}", { business: pageData.business.id }),
        pb.filter("blockedDate = {:blockedDate}", { blockedDate: selectedDate })
      ),
    }),
    listPocketBaseRecordsWithClient<BookingRecord>(pb, "bookings", {
      filter: joinPocketBaseFilters(
        pb.filter("business = {:business}", { business: pageData.business.id }),
        pb.filter("bookingDate = {:bookingDate}", { bookingDate: selectedDate })
      ),
    }),
  ]);
  const dayRules = allRules.filter(
    (rule) =>
      rule.dayOfWeek === dayOfWeek &&
      isActiveRecord(rule)
  );
  const blockedSlots = blocked.filter((slot) => slot.blockedDate === selectedDate);
  const activeBookings = bookings.filter(
    (booking) =>
      booking.bookingDate === selectedDate &&
      ["pending", "confirmed"].includes(booking.status)
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

export async function getPocketBaseBookingConfirmationData(input: {
  bookingId?: string;
  slug: string;
}) {
  if (!input.bookingId) {
    return null;
  }

  const pb = await getPublicMutationClient();

  try {
    const booking = await pb.collection("bookings").getOne<BookingRecord>(input.bookingId, {
      expand: "business,service,customer",
    });
    const business = booking.expand?.business as BusinessRecord | undefined;
    const service = booking.expand?.service as ServiceRecord | undefined;
    const customer = booking.expand?.customer as CustomerRecord | undefined;

    // Construir fecha ISO completa
    const [year, month, day] = booking.bookingDate.split("-").map(Number);
    const [hours, minutes] = booking.startTime.split(":").map(Number);
    const startsAt = new Date(year, month - 1, day, hours, minutes).toISOString();
    const timezone = business?.timezone ?? "America/Argentina/Buenos_Aires";

    return {
      bookingId: booking.id,
      confirmationCode: booking.confirmationCode,
      customerName: customer?.name ?? "Cliente",
      customerEmail: customer?.email ?? undefined,
      customerPhone: customer?.phone ?? undefined,
      businessId: business?.id ?? "",
      businessName: business?.name ?? input.slug,
      businessSlug: business?.slug ?? input.slug,
      businessAddress: business?.address ?? null,
      businessTimezone: timezone,
      businessNotificationEmail: business?.notificationEmail ?? business?.email,
      serviceId: service?.id ?? "",
      serviceName: service?.name ?? "Servicio",
      durationMinutes: Number(service?.durationMinutes ?? 60),
      priceAmount: service?.priceAmount ?? null,
      currency: service?.currency ?? "ARS",
      // Compatibilidad hacia atrás para UI
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      startsAt,
      timezone,
      status: booking.status,
      manageToken: booking.manageToken,
      source: "pocketbase" as const,
    };
  } catch {
    return null;
  }
}

export async function getPocketBaseManageBookingData(input: {
  bookingId?: string;
  slug: string;
}) {
  if (!input.bookingId) {
    return null;
  }

  const pb = await getPublicMutationClient();

  try {
    const booking = await pb.collection("bookings").getOne<BookingRecord>(input.bookingId, {
      expand: "business,service,customer",
    });
    const business = booking.expand?.business as BusinessRecord | undefined;
    const service = booking.expand?.service as ServiceRecord | undefined;
    const customer = booking.expand?.customer as CustomerRecord | undefined;

    if (!business || business.slug !== input.slug) {
      return null;
    }

    return {
      id: booking.id,
      businessSlug: business.slug,
      businessName: business.name,
      businessAddress: business.address ?? "",
      businessTimezone: business.timezone ?? "America/Argentina/Buenos_Aires",
      serviceId: service?.id ?? "",
      serviceName: service?.name ?? "Servicio",
      durationMinutes: Number(service?.durationMinutes ?? 60),
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      status: booking.status,
      statusLabel: formatStatus(booking.status),
      fullName: customer?.fullName ?? "",
      phone: customer?.phone ?? "",
      email: customer?.email ?? "",
      notes: booking.notes ?? "",
      source: "pocketbase" as const,
    };
  } catch {
    return null;
  }
}

export async function createPocketBasePublicBooking(input: {
  businessSlug: string;
  serviceId: string;
  bookingDate: string;
  startTime: string;
  fullName: string;
  phone: string;
  email?: string;
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
      const pb = await getPublicMutationClient();
      const business = await pb
        .collection("businesses")
        .getFirstListItem<BusinessRecord>(
          pb.filter("slug = {:slug} && active = true", { slug: input.businessSlug })
        );
      const service = await pb.collection("services").getOne<ServiceRecord>(input.serviceId);

      if (service.business !== business.id || !service.active) {
        throw new Error("Servicio no encontrado.");
      }

      const endTime = addMinutes(input.startTime, Number(service.durationMinutes));
      const startMinutes = toMinutes(input.startTime);
      const endMinutes = toMinutes(endTime);

      const [blockedSlots, bookings, customers] = await Promise.all([
        listPocketBaseRecordsWithClient<BlockedSlotRecord>(pb, "blocked_slots", {
          filter: joinPocketBaseFilters(
            pb.filter("business = {:business}", { business: business.id }),
            pb.filter("blockedDate = {:blockedDate}", { blockedDate: input.bookingDate })
          ),
        }),
        listPocketBaseRecordsWithClient<BookingRecord>(pb, "bookings", {
          filter: joinPocketBaseFilters(
            pb.filter("business = {:business}", { business: business.id }),
            pb.filter("bookingDate = {:bookingDate}", { bookingDate: input.bookingDate })
          ),
        }),
        listPocketBaseRecordsWithClient<CustomerRecord>(pb, "customers", {
          sort: "fullName",
          filter: joinPocketBaseFilters(
            pb.filter("business = {:business}", { business: business.id }),
            pb.filter("phone = {:phone}", { phone: input.phone })
          ),
        }),
      ]);
      const businessBlockedSlots = blockedSlots.filter(
        (slot) => slot.blockedDate === input.bookingDate
      );
      const businessBookings = bookings.filter((booking) =>
        ["pending", "pending_payment", "confirmed"].includes(booking.status)
      );
      const businessCustomers = customers.filter((customer) => customer.phone === input.phone);

      if (
        businessBlockedSlots.some((slot) =>
          overlaps(startMinutes, endMinutes, toMinutes(slot.startTime), toMinutes(slot.endTime))
        )
      ) {
        throw new Error("Ese horario esta bloqueado.");
      }

      if (
        businessBookings.some((booking) =>
          overlaps(startMinutes, endMinutes, toMinutes(booking.startTime), toMinutes(booking.endTime))
        )
      ) {
        throw new Error("Ese horario ya no esta disponible.");
      }

      let customer = businessCustomers[0];

      if (!customer) {
        customer = await pb.collection("customers").create<CustomerRecord>({
          business: business.id,
          fullName: input.fullName,
          phone: input.phone,
          email: input.email ?? "",
          notes: input.notes ?? "",
        });
      } else {
        customer = await pb.collection("customers").update<CustomerRecord>(customer.id, {
          fullName: input.fullName,
          phone: input.phone,
          email: input.email ?? "",
          notes: input.notes ?? customer.notes ?? "",
        });
      }

      const booking = await pb.collection("bookings").create<BookingRecord>({
        business: business.id,
        customer: customer.id,
        service: service.id,
        bookingDate: input.bookingDate,
        startTime: input.startTime,
        endTime,
        status: input.initialStatus ?? "pending",
        notes: input.notes ?? "",
        ...(input.paymentPreferenceId
          ? {
              paymentProvider: "mercadopago",
              paymentPreferenceId: input.paymentPreferenceId,
              paymentStatus: "pending",
            }
          : {}),
      });

      return booking.id;
    }
  );
}

export async function reschedulePocketBasePublicBooking(input: {
  businessSlug: string;
  serviceId: string;
  bookingDate: string;
  startTime: string;
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
  rescheduleBookingId: string;
}) {
  return withBookingDateLock(
    {
      businessKey: input.businessSlug,
      bookingDate: input.bookingDate,
    },
    async () => {
      const pb = await getPublicMutationClient();
      const booking = await pb.collection("bookings").getOne<BookingRecord>(input.rescheduleBookingId, {
        expand: "business",
      });
      const business = booking.expand?.business as BusinessRecord | undefined;

      if (!business || business.slug !== input.businessSlug) {
        throw new Error("Link de gestion invalido.");
      }

      if (!["pending", "confirmed"].includes(booking.status)) {
        throw new Error("Este turno ya no se puede reprogramar.");
      }

      const service = await pb.collection("services").getOne<ServiceRecord>(input.serviceId);

      if (service.business !== business.id || !service.active) {
        throw new Error("Servicio no encontrado.");
      }

      const endTime = addMinutes(input.startTime, Number(service.durationMinutes));
      const startMinutes = toMinutes(input.startTime);
      const endMinutes = toMinutes(endTime);
      const [blockedSlots, bookings] = await Promise.all([
        listPocketBaseRecordsWithClient<BlockedSlotRecord>(pb, "blocked_slots", {
          filter: joinPocketBaseFilters(
            pb.filter("business = {:business}", { business: business.id }),
            pb.filter("blockedDate = {:blockedDate}", { blockedDate: input.bookingDate })
          ),
        }),
        listPocketBaseRecordsWithClient<BookingRecord>(pb, "bookings", {
          filter: joinPocketBaseFilters(
            pb.filter("business = {:business}", { business: business.id }),
            pb.filter("bookingDate = {:bookingDate}", { bookingDate: input.bookingDate })
          ),
        }),
      ]);
      const businessBlockedSlots = blockedSlots.filter(
        (slot) => slot.blockedDate === input.bookingDate
      );
      const businessBookings = bookings.filter(
        (candidate) =>
          candidate.bookingDate === input.bookingDate &&
          ["pending", "confirmed"].includes(candidate.status) &&
          candidate.id !== booking.id
      );

      if (
        businessBlockedSlots.some((slot) =>
          overlaps(startMinutes, endMinutes, toMinutes(slot.startTime), toMinutes(slot.endTime))
        )
      ) {
        throw new Error("Ese horario esta bloqueado.");
      }

      if (
        businessBookings.some((candidate) =>
          overlaps(startMinutes, endMinutes, toMinutes(candidate.startTime), toMinutes(candidate.endTime))
        )
      ) {
        throw new Error("Ese horario ya no esta disponible.");
      }

      await pb.collection("customers").update(booking.customer, {
        fullName: input.fullName,
        phone: input.phone,
        email: input.email ?? "",
        notes: input.notes ?? "",
      });

      await pb.collection("bookings").update(booking.id, {
        service: service.id,
        bookingDate: input.bookingDate,
        startTime: input.startTime,
        endTime,
        status: "pending",
        notes: input.notes ?? "",
      });

      return booking.id;
    }
  );
}

export async function cancelPocketBasePublicBooking(input: {
  businessSlug: string;
  bookingId: string;
}) {
  const pb = await getPublicMutationClient();
  const booking = await pb.collection("bookings").getOne<BookingRecord>(input.bookingId, {
    expand: "business",
  });
  const business = booking.expand?.business as BusinessRecord | undefined;

  if (!business || business.slug !== input.businessSlug) {
    throw new Error("Link de gestion invalido.");
  }

  await pb.collection("bookings").update(booking.id, {
    status: "cancelled",
  });
}

export async function trackPocketBaseAnalyticsEvent(input: {
  businessSlug: string;
  eventName: string;
  pagePath: string;
  source?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
}) {
  const pb = await getPublicMutationClient();
  const business = await pb
    .collection("businesses")
    .getFirstListItem<BusinessRecord>(
      pb.filter("slug = {:slug} && active = true", { slug: input.businessSlug })
    );

  await pb.collection("analytics_events").create({
    business: business.id,
    eventName: input.eventName,
    pagePath: input.pagePath,
    source: input.source?.trim() || "direct",
    medium: input.medium?.trim() || "none",
    campaign: input.campaign?.trim() || "",
    referrer: input.referrer?.trim() || "",
  });
}

export async function getPocketBaseAdminDashboardData(businessId: string) {
  const business = await getBusinessById(businessId);
  const pb = await getAdminClient();
  const [bookings, customers, analyticsEvents, communicationEvents] = await Promise.all([
    listPocketBaseRecords<BookingRecord>("bookings", {
      expand: "customer,service",
      sort: "bookingDate,startTime",
      filter: pb.filter("business = {:business}", { business: businessId }),
    }),
    listPocketBaseRecords<CustomerRecord>("customers", {
      filter: pb.filter("business = {:business}", { business: businessId }),
    }),
    listPocketBaseRecords<AnalyticsRecord>("analytics_events", {
      filter: pb.filter("business = {:business}", { business: businessId }),
    }),
    listPocketBaseRecords<CommunicationRecord>("communication_events", {
      filter: pb.filter("business = {:business}", { business: businessId }),
    }),
  ]);
  const businessBookings = bookings;
  const businessCustomers = customers;
  const businessAnalyticsEvents = analyticsEvents;
  const businessCommunicationEvents = communicationEvents;

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
  const remindersPending = businessBookings.filter((booking) => {
    const bookingTime = new Date(`${booking.bookingDate}T${booking.startTime}:00`).getTime();
    const sent = businessCommunicationEvents.some(
      (event) => event.kind === "reminder" && event.status === "sent" && event.booking === booking.id
    );
    return (
      !sent &&
      ["pending", "confirmed"].includes(booking.status) &&
      bookingTime >= Date.now() &&
      bookingTime <= Date.now() + 24 * 60 * 60 * 1000
    );
  }).length;

  return {
    profileName: "PocketBase Owner",
    businessName: business.name,
    businessSlug: business.slug,
    userEmail: "",
    demoMode: false,
    analytics: {
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
      channels: [],
    },
    reminders: {
        reminderWindowHours: 24,
        pending: remindersPending,
        missingEmail: businessBookings.filter(
          (booking) =>
            getAvailableReminderChannels({
              customerEmail: (booking.expand?.customer as CustomerRecord | undefined)?.email,
              customerPhone: (booking.expand?.customer as CustomerRecord | undefined)?.phone,
            }).length === 0
        ).length,
        sentRecently: businessCommunicationEvents.filter((event) => event.kind === "reminder").length,
        providerReady: hasReminderProviderConfigured(),
        nextBookingAt:
          businessBookings[0] != null
            ? `${businessBookings[0].bookingDate} ${businessBookings[0].startTime}`
          : null,
    },
    notifications: [
      `${businessBookings.filter((booking) => booking.status === "pending").length} turnos pendientes de confirmar`,
      remindersPending > 0
        ? `${remindersPending} recordatorios listos para enviar`
        : "Sin recordatorios pendientes en las proximas 24 hs",
      bookingCreated.length > 0
        ? `${bookingCreated.length} reservas llegaron desde la web`
        : "Todavia no se registran reservas web",
      publicPageViews.length > 0
        ? `Canal principal: ${topSourceLabel}`
        : "Todavia no hay visitas registradas",
    ],
    metrics: [
      {
        label: "Visitas publicas",
        value: String(publicPageViews.length),
        hint: `${bookingCtaClicks.length} clics en reservar`,
        icon: ChartColumnBig,
      },
      {
        label: "Reservas creadas",
        value: String(bookingCreated.length),
        hint: `${bookings.filter((booking) => booking.status === "pending").length} pendientes de confirmar`,
        icon: CalendarClock,
      },
      {
        label: "Conversion web",
        value: `${
          publicPageViews.length > 0
            ? Math.round((bookingCreated.length / publicPageViews.length) * 100)
            : 0
        }%`,
        hint: publicPageViews.length > 0 ? `Canal principal: ${topSourceLabel}` : "Todavia sin visitas registradas",
        icon: Percent,
      },
      {
        ...dashboardHighlights[1],
        value: String(businessCustomers.length),
        hint: "Clientes registrados en PocketBase",
      },
    ],
    bookings: businessBookings.slice(0, 5).map((booking) => ({
      id: booking.id,
      name: ((booking.expand?.customer as CustomerRecord | undefined)?.fullName ?? "Cliente"),
      service: ((booking.expand?.service as ServiceRecord | undefined)?.name ?? "Servicio"),
      date: booking.bookingDate,
      time: booking.startTime,
      status: formatStatus(booking.status),
    })),
  };
}

export async function getPocketBaseAdminBookingsData(
  businessId: string,
  filters?: {
    status?: string;
    date?: string;
    q?: string;
  }
) {
  const pb = await getAdminClient();
  const query = filters?.q?.trim().toLocaleLowerCase("es-AR") ?? "";
  const bookings = await listPocketBaseRecords<BookingRecord>("bookings", {
    expand: "customer,service",
    sort: "bookingDate,startTime",
    filter: pb.filter("business = {:business}", { business: businessId }),
  });

  return bookings
    .map((booking) => ({
      id: booking.id,
      customerName:
        (booking.expand?.customer as CustomerRecord | undefined)?.fullName ?? "Cliente",
      phone: (booking.expand?.customer as CustomerRecord | undefined)?.phone ?? "",
      serviceName: (booking.expand?.service as ServiceRecord | undefined)?.name ?? "Servicio",
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      status: booking.status,
      statusLabel: formatStatus(booking.status),
      notes: booking.notes ?? "",
    }))
    .filter((booking) => {
      if (filters?.status && booking.status !== filters.status) {
        return false;
      }

      if (filters?.date && booking.bookingDate !== filters.date) {
        return false;
      }

      if (
        query &&
        !`${booking.customerName} ${booking.phone} ${booking.serviceName}`
          .toLocaleLowerCase("es-AR")
          .includes(query)
      ) {
        return false;
      }

      return true;
    });
}

export async function updatePocketBaseAdminBooking(input: {
  businessId: string;
  bookingId: string;
  bookingDate: string;
  startTime: string;
  status: BookingStatus;
  notes: string;
}) {
  const pb = await getAdminClient();
  const booking = await pb.collection("bookings").getOne<BookingRecord>(input.bookingId, {
    expand: "service",
    requestKey: null,
  });

  if (booking.business !== input.businessId) {
    throw new Error("No encontramos el turno a actualizar.");
  }

  const service = booking.expand?.service as ServiceRecord | undefined;

  if (!service || service.business !== input.businessId) {
    throw new Error("No encontramos el servicio del turno.");
  }

  const selectedDayOfWeek = getDayOfWeek(input.bookingDate);
  const startMinutes = toMinutes(input.startTime);
  const endTime = addMinutes(input.startTime, Number(service.durationMinutes));
  const endMinutes = toMinutes(endTime);
  const [rules, blockedSlots, bookings] = await Promise.all([
    listPocketBaseRecords<AvailabilityRuleRecord>("availability_rules", {
      filter: joinPocketBaseFilters(
        pb.filter("business = {:business}", { business: input.businessId }),
        pb.filter("dayOfWeek = {:dayOfWeek}", { dayOfWeek: selectedDayOfWeek })
      ),
    }),
    listPocketBaseRecords<BlockedSlotRecord>("blocked_slots", {
      filter: joinPocketBaseFilters(
        pb.filter("business = {:business}", { business: input.businessId }),
        pb.filter("blockedDate = {:blockedDate}", { blockedDate: input.bookingDate })
      ),
    }),
    listPocketBaseRecords<BookingRecord>("bookings", {
      filter: joinPocketBaseFilters(
        pb.filter("business = {:business}", { business: input.businessId }),
        pb.filter("bookingDate = {:bookingDate}", { bookingDate: input.bookingDate })
      ),
    }),
  ]);
  const activeRules = rules.filter(isActiveRecord);
  const fitsWithinAvailability = activeRules.some(
    (rule) =>
      startMinutes >= toMinutes(rule.startTime) && endMinutes <= toMinutes(rule.endTime)
  );

  if (!fitsWithinAvailability) {
    throw new Error("Ese horario queda fuera de la disponibilidad configurada.");
  }

  const blockedConflict = blockedSlots.some((slot) =>
    overlaps(startMinutes, endMinutes, toMinutes(slot.startTime), toMinutes(slot.endTime))
  );

  if (blockedConflict) {
    throw new Error("Ese horario esta bloqueado.");
  }

  const bookingConflict = bookings.some(
    (candidate) =>
      candidate.id !== booking.id &&
      (candidate.status === "pending" || candidate.status === "confirmed") &&
      overlaps(
        startMinutes,
        endMinutes,
        toMinutes(candidate.startTime),
        toMinutes(candidate.endTime)
      )
  );

  if (bookingConflict) {
    throw new Error("Ese horario ya no esta disponible.");
  }

  await pb.collection("bookings").update(input.bookingId, {
    bookingDate: input.bookingDate,
    startTime: input.startTime,
    endTime,
    status: input.status,
    notes: input.notes,
  });

  return input.bookingId;
}

export async function getPocketBaseAdminCustomersData(businessId: string, query?: string) {
  const pb = await getAdminClient();
  const normalizedQuery = query?.trim().toLocaleLowerCase("es-AR") ?? "";
  const [customers, bookings] = await Promise.all([
    listPocketBaseRecords<CustomerRecord>("customers", {
      sort: "fullName",
      filter: pb.filter("business = {:business}", { business: businessId }),
    }),
    listPocketBaseRecords<BookingRecord>("bookings", {
      filter: pb.filter("business = {:business}", { business: businessId }),
    }),
  ]);
  const businessCustomers = customers.filter((customer) => {
    if (!normalizedQuery) {
      return true;
    }

    return [customer.fullName, customer.phone, customer.email]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase("es-AR").includes(normalizedQuery));
  });
  const businessBookings = bookings;

  return businessCustomers.map((customer) => {
    const customerBookings = businessBookings.filter((booking) => booking.customer === customer.id);
    const lastBooking = customerBookings
      .slice()
      .sort((a, b) => `${b.bookingDate}T${b.startTime}`.localeCompare(`${a.bookingDate}T${a.startTime}`))[0];

    return {
      id: customer.id,
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email ?? "",
      notes: customer.notes ?? "",
      bookingsCount: customerBookings.length,
      lastBookingDate: lastBooking?.bookingDate ?? null,
    };
  });
}

export async function getPocketBaseAdminServicesData(businessId: string) {
  const pb = await getAdminClient();
  const services = (await listPocketBaseRecords<ServiceRecord>("services", {
    sort: "-featured,name",
    filter: pb.filter("business = {:business}", { business: businessId }),
  })).filter(isActiveRecord);

  return services.map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description ?? "",
    durationMinutes: Number(service.durationMinutes),
    price: service.price ?? null,
    featured: Boolean(service.featured),
    featuredLabel: service.featuredLabel ?? "",
    priceLabel: toMoney(service.price),
  }));
}

export async function upsertPocketBaseService(input: {
  businessId: string;
  serviceId?: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number | null;
  featured: boolean;
  featuredLabel: string;
}) {
  const pb = await getAdminClient();
  const services = (await listPocketBaseRecords<ServiceRecord>("services", {
    filter: pb.filter("business = {:business}", { business: input.businessId }),
  })).filter(isActiveRecord);
  const duplicateService = services.find(
    (service) =>
      service.id !== input.serviceId &&
      service.name.trim().toLocaleLowerCase("es-AR") ===
        input.name.trim().toLocaleLowerCase("es-AR")
  );

  if (duplicateService) {
    throw new Error("Ya existe un servicio activo con ese nombre.");
  }

  if (input.featured && countFeaturedRecords(services, input.serviceId) >= 3) {
    throw new Error("Puedes destacar hasta 3 servicios activos.");
  }

  if (input.serviceId) {
    const service = await pb.collection("services").getOne<ServiceRecord>(input.serviceId, {
      requestKey: null,
    });

    if (service.business !== input.businessId || !isActiveRecord(service)) {
      throw new Error("No encontramos el servicio a editar.");
    }

    await pb.collection("services").update(input.serviceId, {
      name: input.name,
      description: input.description,
      durationMinutes: input.durationMinutes,
      price: input.price,
      featured: input.featured,
      featuredLabel: input.featured ? input.featuredLabel : "",
    });

    return input.serviceId;
  }

  const createdService = await pb.collection("services").create<ServiceRecord>({
    business: input.businessId,
    name: input.name,
    description: input.description,
    durationMinutes: input.durationMinutes,
    price: input.price,
    featured: input.featured,
    featuredLabel: input.featured ? input.featuredLabel : "",
    active: true,
  });

  return createdService.id;
}

export async function deactivatePocketBaseService(input: {
  businessId: string;
  serviceId: string;
}) {
  const pb = await getAdminClient();
  const service = await pb.collection("services").getOne<ServiceRecord>(input.serviceId, {
    requestKey: null,
  });

  if (service.business !== input.businessId || !isActiveRecord(service)) {
    throw new Error("No encontramos el servicio a desactivar.");
  }

  await pb.collection("services").update(input.serviceId, {
    active: false,
  });

  return input.serviceId;
}

export async function getPocketBaseAdminAvailabilityData(businessId: string) {
  const pb = await getAdminClient();
  const [rules, blockedSlots] = await Promise.all([
    listPocketBaseRecords<AvailabilityRuleRecord>("availability_rules", {
      sort: "dayOfWeek,startTime",
      filter: pb.filter("business = {:business}", { business: businessId }),
    }),
    listPocketBaseRecords<BlockedSlotRecord>("blocked_slots", {
      sort: "blockedDate,startTime",
      filter: pb.filter("business = {:business}", { business: businessId }),
    }),
  ]);
  const businessRules = rules;
  const businessBlockedSlots = blockedSlots;

  return {
    rules: businessRules.map((rule) => ({
      id: rule.id,
      businessId: rule.business,
      dayOfWeek: rule.dayOfWeek,
      startTime: rule.startTime,
      endTime: rule.endTime,
      active: Boolean(rule.active),
    })),
    blockedSlots: businessBlockedSlots.map((slot) => ({
      id: slot.id,
      businessId: slot.business,
      blockedDate: slot.blockedDate,
      startTime: slot.startTime,
      endTime: slot.endTime,
      reason: slot.reason ?? "",
    })),
  };
}

export async function upsertPocketBaseAvailabilityRule(input: {
  businessId: string;
  ruleId?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
}) {
  return upsertPocketBaseAvailabilityRules({
    businessId: input.businessId,
    rules: [
      {
        ruleId: input.ruleId,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        active: input.active,
      },
    ],
  });
}

export async function upsertPocketBaseAvailabilityRules(input: {
  businessId: string;
  rules: Array<{
    ruleId?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    active: boolean;
  }>;
}) {
  const pb = await getAdminClient();
  const existingRules = await listPocketBaseRecords<AvailabilityRuleRecord>("availability_rules", {
    filter: pb.filter("business = {:business}", { business: input.businessId }),
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
      await pb.collection("availability_rules").update(existingRule.id, {
        startTime: ruleInput.startTime,
        endTime: ruleInput.endTime,
        active: ruleInput.active,
      });
      continue;
    }

    const createdRule = await pb.collection("availability_rules").create<AvailabilityRuleRecord>({
      business: input.businessId,
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

export async function createPocketBaseBlockedSlot(input: {
  businessId: string;
  blockedDate: string;
  startTime: string;
  endTime: string;
  reason: string;
}) {
  const result = await createPocketBaseBlockedSlots({
    businessId: input.businessId,
    slots: [
      {
        blockedDate: input.blockedDate,
        startTime: input.startTime,
        endTime: input.endTime,
        reason: input.reason,
      },
    ],
  });

  if (result.createdCount === 0) {
    throw new Error("Ese bloqueo ya existe.");
  }

  return input.blockedDate;
}

export async function createPocketBaseBlockedSlots(input: {
  businessId: string;
  slots: Array<{
    blockedDate: string;
    startTime: string;
    endTime: string;
    reason: string;
  }>;
}) {
  const pb = await getAdminClient();
  const existingSlots = await listPocketBaseRecords<BlockedSlotRecord>("blocked_slots", {
    filter: pb.filter("business = {:business}", { business: input.businessId }),
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

    await pb.collection("blocked_slots").create<BlockedSlotRecord>({
      business: input.businessId,
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

export async function removePocketBaseBlockedSlot(input: {
  businessId: string;
  blockedSlotId: string;
}) {
  const pb = await getAdminClient();
  const blockedSlot = await pb.collection("blocked_slots").getOne<BlockedSlotRecord>(
    input.blockedSlotId,
    {
      requestKey: null,
    }
  );

  if (blockedSlot.business !== input.businessId) {
    throw new Error("No encontramos el bloqueo a eliminar.");
  }

  await pb.collection("blocked_slots").delete(input.blockedSlotId);

  return input.blockedSlotId;
}

export async function getPocketBaseAdminSettingsData(businessId: string) {
  const business = await getBusinessById(businessId);

  return {
    businessName: business.name,
    businessSlug: business.slug,
    templateSlug: business.templateSlug ?? business.slug,
    phone: business.phone ?? "",
    email: business.email ?? "",
    address: business.address ?? "",
    timezone: business.timezone ?? "America/Argentina/Buenos_Aires",
    publicUrl: `/${business.slug}`,
    profile: buildBusinessPublicProfile(business),
    mpConnected: business.mpConnected ?? false,
    mpCollectorId: business.mpCollectorId,
    mpAccessToken: business.mpAccessToken,
  };
}

export async function getPocketBaseOnboardingData(businessId?: string) {
  const businesses = businessId
    ? [await getBusinessById(businessId)].filter(isActiveRecord)
    : (await listPocketBaseRecords<BusinessRecord>("businesses", {
        sort: "name",
      })).filter(isActiveRecord);

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

async function seedPocketBaseBusinessTemplate(input: {
  pb: Awaited<ReturnType<typeof createPocketBaseAdminClient>>;
  businessId: string;
  templateSlug: string;
}) {
  const preset = demoPresets[input.templateSlug];

  if (!preset) {
    throw new Error("La demo base no existe.");
  }

  await Promise.all(
    preset.services.map((service) =>
      input.pb.collection("services").create({
        business: input.businessId,
        name: service.name,
        description: service.description,
        durationMinutes: service.durationMinutes,
        price: service.price,
        active: true,
      })
    )
  );

  await Promise.all(
    preset.availabilityRules.map((rule) =>
      input.pb.collection("availability_rules").create({
        business: input.businessId,
        dayOfWeek: rule.dayOfWeek,
        startTime: rule.startTime,
        endTime: rule.endTime,
        active: rule.active,
      })
    )
  );
}

export async function createPocketBaseBusinessFromTemplate(input: {
  templateSlug: string;
  name: string;
  slug: string;
  phone: string;
  email: string;
  address: string;
  timezone?: string;
}) {
  const pb = await getAdminClient();
  const preset = demoPresets[input.templateSlug];

  if (!preset) {
    throw new Error("La demo base no existe.");
  }

  const business = await pb.collection("businesses").create<BusinessRecord>({
    name: input.name.trim(),
    slug: input.slug.trim(),
    templateSlug: input.templateSlug,
    phone: input.phone.trim(),
    email: input.email.trim(),
    address: input.address.trim(),
    timezone: input.timezone ?? preset.business.timezone,
    active: true,
    publicProfileOverrides: "",
  });

  await seedPocketBaseBusinessTemplate({
    pb,
    businessId: business.id,
    templateSlug: input.templateSlug,
  });

  return business.slug;
}

export async function createPocketBaseOwnerAccount(input: {
  ownerName: string;
  email: string;
  password: string;
  businessName: string;
  businessSlug?: string;
  phone: string;
  address: string;
  templateSlug: string;
  timezone?: string;
}) {
  const pb = await getAdminClient();
  const normalizedSlug = slugify(input.businessSlug || input.businessName);

  if (!normalizedSlug) {
    throw new Error("Necesitamos un slug valido para crear tu negocio.");
  }

  const existingBusiness = await pb.collection("businesses").getList<BusinessRecord>(1, 1, {
    filter: pb.filter("slug = {:slug}", { slug: normalizedSlug }),
    requestKey: null,
  });

  if (existingBusiness.totalItems > 0) {
    throw new Error("Ese link publico ya existe. Proba con otro.");
  }

  const existingUser = await pb.collection("users").getList<RecordModel>(1, 1, {
    filter: pb.filter("email = {:email}", { email: input.email.trim().toLowerCase() }),
    requestKey: null,
  });

  if (existingUser.totalItems > 0) {
    throw new Error("Ya existe una cuenta con ese email.");
  }

  const business = await pb.collection("businesses").create<BusinessRecord>({
    name: input.businessName.trim(),
    slug: normalizedSlug,
    templateSlug: input.templateSlug,
    phone: input.phone.trim(),
    email: input.email.trim().toLowerCase(),
    address: input.address.trim(),
    timezone: input.timezone ?? "America/Argentina/Buenos_Aires",
    active: true,
    publicProfileOverrides: "",
  });

  try {
    await seedPocketBaseBusinessTemplate({
      pb,
      businessId: business.id,
      templateSlug: input.templateSlug,
    });

    await pb.collection("users").create({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      passwordConfirm: input.password,
      name: input.ownerName.trim(),
      business: business.id,
      role: "owner",
      active: true,
      verified: false,
    });
  } catch (error) {
    try {
      const services = await listPocketBaseRecordsWithClient<ServiceRecord>(pb, "services", {
        filter: pb.filter("business = {:business}", { business: business.id }),
      });
      const rules = await listPocketBaseRecordsWithClient<AvailabilityRuleRecord>(pb, "availability_rules", {
        filter: pb.filter("business = {:business}", { business: business.id }),
      });

      await Promise.allSettled([
        ...services.map((service) => pb.collection("services").delete(service.id)),
        ...rules.map((rule) => pb.collection("availability_rules").delete(rule.id)),
        pb.collection("businesses").delete(business.id),
      ]);
    } catch {
      // Best-effort rollback.
    }

    throw error;
  }

  return {
    businessSlug: business.slug,
    businessId: business.id,
    email: input.email.trim().toLowerCase(),
  };
}

export async function getPocketBaseAdminTeamData(businessId: string) {
  const pb = await getAdminClient();
  const users = await listPocketBaseRecords<UserRecord>("users", {
    sort: "name,email",
    filter: pb.filter("business = {:business}", { business: businessId }),
  });

  return users.map((user) => ({
    id: user.id,
    name: String(user.name ?? user.email ?? "Sin nombre"),
    email: user.email,
    role: String(user.role ?? "staff"),
    active: user.active !== false,
    verified: Boolean(user.verified),
  }));
}

export async function createPocketBaseStaffAccount(input: {
  businessId: string;
  name: string;
  email: string;
  password: string;
  role: "staff";
}) {
  const pb = await getAdminClient();
  const normalizedEmail = input.email.trim().toLowerCase();

  const existingUser = await pb.collection("users").getList<UserRecord>(1, 1, {
    filter: pb.filter("email = {:email}", { email: normalizedEmail }),
    requestKey: null,
  });

  if (existingUser.totalItems > 0) {
    throw new Error("Ya existe una cuenta con ese email.");
  }

  const user = await pb.collection("users").create<UserRecord>({
    email: normalizedEmail,
    password: input.password,
    passwordConfirm: input.password,
    name: input.name.trim(),
    business: input.businessId,
    role: input.role,
    active: true,
    verified: false,
  });

  return {
    id: user.id,
    email: user.email,
  };
}

export async function updatePocketBaseTeamUserStatus(input: {
  businessId: string;
  userId: string;
  active: boolean;
}) {
  const pb = await getAdminClient();
  const user = await pb.collection("users").getOne<UserRecord>(input.userId, {
    requestKey: null,
  });
  const userBusinessId = Array.isArray(user.business) ? user.business[0] : user.business;

  if (String(userBusinessId ?? "") !== input.businessId) {
    throw new Error("No encontramos ese usuario en tu negocio.");
  }

  if ((user.role ?? "staff") === "owner" && input.active === false) {
    throw new Error("No puedes desactivar al owner principal.");
  }

  await pb.collection("users").update(input.userId, {
    active: input.active,
  });

  return input.userId;
}

export async function updatePocketBaseBusiness(input: {
  businessId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}) {
  const pb = await getAdminClient();

  await pb.collection("businesses").update(input.businessId, {
    name: input.name,
    phone: input.phone,
    email: input.email,
    address: input.address,
  });
}

export async function updatePocketBaseBusinessBranding(input: {
  businessId: string;
  updates: Partial<PublicBusinessProfile>;
}) {
  const pb = await getAdminClient();
  const business = await pb.collection("businesses").getOne<BusinessRecord>(input.businessId);
  const currentProfile = parseProfileOverrides(business.publicProfileOverrides);

  await pb.collection("businesses").update(input.businessId, {
    publicProfileOverrides: JSON.stringify({
      ...currentProfile,
      ...input.updates,
    }),
  });
}

export async function runPocketBaseBookingReminderSweep(input?: {
  businessId?: string;
  now?: string;
  dryRun?: boolean;
}) {
  const pb = await getAdminClient();
  const now = input?.now ? new Date(input.now) : new Date();
  const businesses = input?.businessId
    ? [await getBusinessById(input.businessId)]
    : (await listPocketBaseRecords<BusinessRecord>("businesses")).filter(isActiveRecord);
  const PENDING_PAYMENT_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 horas
  const dryRun = Boolean(input?.dryRun);
  let expiredPaymentsCancelled = 0;

  // Auto-cancelar bookings pending_payment vencidos (más de 2 horas)
  if (!dryRun) {
    const expiredBookings = await listPocketBaseRecords<BookingRecord>("bookings", {
      filter: pb.filter("status = 'pending_payment'"),
    });
    for (const booking of expiredBookings) {
      const createdAt = new Date(booking.created).getTime();
      if (now.getTime() - createdAt > PENDING_PAYMENT_EXPIRY_MS) {
        await pb.collection("bookings").update(booking.id, { status: "cancelled" });
        expiredPaymentsCancelled += 1;
      }
    }
  }

  const summary = {
    dryRun,
    reminderWindowHours: 24,
    businesses: businesses.length,
    expiredPaymentsCancelled,
    candidates: 0,
    missingEmail: 0,
    readyWithoutProvider: 0,
    sent: 0,
    failed: 0,
  };

  for (const business of businesses) {
    const bookings = await listPocketBaseRecords<BookingRecord>("bookings", {
      expand: "customer,service",
      filter: pb.filter("business = {:business}", { business: business.id }),
    });
    const communications = await listPocketBaseRecords<CommunicationRecord>(
      "communication_events",
      {
        filter: pb.filter("business = {:business}", { business: business.id }),
      }
    );
    const businessBookings = bookings.filter((booking) =>
      ["pending", "confirmed"].includes(booking.status)
    );
      const businessCommunications = communications;

    for (const booking of businessBookings) {
      const bookingTime = new Date(`${booking.bookingDate}T${booking.startTime}:00`).getTime();

      if (
        bookingTime < now.getTime() ||
        bookingTime > now.getTime() + 24 * 60 * 60 * 1000 ||
        businessCommunications.some(
          (event) => event.kind === "reminder" && event.status === "sent" && event.booking === booking.id
        )
      ) {
        continue;
      }

      const customer = booking.expand?.customer as CustomerRecord | undefined;
      const service = booking.expand?.service as ServiceRecord | undefined;

      if (!customer) {
        summary.missingEmail += 1;
        continue;
      }

      const channels = getAvailableReminderChannels({
        customerEmail: customer.email,
        customerPhone: customer.phone,
      });

      if (channels.length === 0) {
        summary.missingEmail += 1;
        continue;
      }

      summary.candidates += 1;

      if (summary.dryRun) {
        continue;
      }

      const confirmation = {
        businessName: business.name,
        businessAddress: business.address ?? "",
        businessTimezone: business.timezone ?? "America/Argentina/Buenos_Aires",
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        serviceName: service?.name ?? "Servicio",
        durationMinutes: Number(service?.durationMinutes ?? 60),
      };

      for (const channel of channels) {
        const result =
          channel === "email"
            ? await sendBookingReminderEmail({
                bookingId: booking.id,
                businessSlug: business.slug,
                customerName: customer.fullName,
                customerEmail: customer.email,
                confirmation,
              })
            : await sendBookingReminderWhatsApp({
                bookingId: booking.id,
                businessSlug: business.slug,
                customerName: customer.fullName,
                customerPhone: customer.phone,
                confirmation,
              });

        if (result.status === "skipped") {
          summary.readyWithoutProvider += 1;
          continue;
        }

        if (result.status === "sent") {
          summary.sent += 1;
        } else {
          summary.failed += 1;
        }

        await pb.collection("communication_events").create({
          business: business.id,
          booking: booking.id,
          customer: customer.id,
          channel,
          kind: "reminder",
          status: result.status,
          recipient: channel === "email" ? customer.email : customer.phone,
          subject: result.subject,
          note: (result as { reason?: string }).reason ?? "",
        });
      }
    }
  }

  return summary;
}

/**
 * Revierte el status de un booking de pending_payment a pending.
 * Usado cuando falla la creación de preferencia de pago.
 */
export async function revertPocketBaseBookingFromPendingPayment(bookingId: string) {
  const pb = await getAdminClient();
  const booking = await pb.collection("bookings").getOne<BookingRecord>(bookingId, { requestKey: null }).catch(() => null);
  if (!booking || booking.status !== "pending_payment") return;
  await pb.collection("bookings").update(bookingId, { status: "pending" });
}

/**
 * Devuelve el slug del negocio al que pertenece un booking.
 * Usado internamente por el webhook de MercadoPago.
 */
export async function getPocketBaseBookingBusinessSlug(bookingId: string): Promise<string | null> {
  const pb = await getAdminClient();
  const booking = await pb
    .collection("bookings")
    .getOne<BookingRecord>(bookingId, { expand: "business", requestKey: null })
    .catch(() => null);

  if (!booking) return null;
  const business = booking.expand?.business as { slug?: string } | undefined;
  return business?.slug ?? null;
}

export type UpdatePocketBaseBookingPaymentInput = {
  bookingId: string;
  paymentStatus: "pending" | "approved" | "rejected" | "cancelled" | "refunded";
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentProvider?: "mercadopago";
  paymentPreferenceId?: string;
  paymentExternalId?: string;
};

/**
 * Actualiza los campos de pago de una reserva en PocketBase.
 * Si el pago fue aprobado, cambia el status del booking a "confirmed".
 */
export async function updatePocketBaseBookingPayment(
  input: UpdatePocketBaseBookingPaymentInput
) {
  const pb = await getAdminClient();

  const data: Record<string, unknown> = {
    paymentStatus: input.paymentStatus,
  };

  if (input.paymentAmount !== undefined) data.paymentAmount = input.paymentAmount;
  if (input.paymentCurrency !== undefined) data.paymentCurrency = input.paymentCurrency;
  if (input.paymentProvider !== undefined) data.paymentProvider = input.paymentProvider;
  if (input.paymentPreferenceId !== undefined) data.paymentPreferenceId = input.paymentPreferenceId;
  if (input.paymentExternalId !== undefined) data.paymentExternalId = input.paymentExternalId;

  if (input.paymentStatus === "approved") {
    data.status = "confirmed";
  }

  await pb.collection("bookings").update(input.bookingId, data);

  return input.bookingId;
}

/**
 * Guarda los tokens OAuth de MercadoPago en el negocio.
 */
export async function updatePocketBaseBusinessMPTokens(input: {
  businessId: string;
  mpAccessToken: string;
  mpRefreshToken: string;
  mpCollectorId: string;
  mpTokenExpiresAt: string;
}) {
  const pb = await getAdminClient();
  await pb.collection("businesses").update(input.businessId, {
    mpAccessToken: input.mpAccessToken,
    mpRefreshToken: input.mpRefreshToken,
    mpCollectorId: input.mpCollectorId,
    mpTokenExpiresAt: input.mpTokenExpiresAt,
    mpConnected: true,
  });
}

/**
 * Elimina los tokens OAuth de MercadoPago del negocio.
 */
export async function clearPocketBaseBusinessMPTokens(businessId: string) {
  const pb = await getAdminClient();
  await pb.collection("businesses").update(businessId, {
    mpAccessToken: "",
    mpRefreshToken: "",
    mpCollectorId: "",
    mpTokenExpiresAt: "",
    mpConnected: false,
  });
}

/**
 * Busca el ID de PocketBase de un negocio dado su slug.
 * Usado en el callback OAuth para encontrar el business por slug.
 */
export async function getPocketBaseBusinessIdBySlug(slug: string): Promise<string | null> {
  try {
    const pb = await getAdminClient();
    const business = await pb
      .collection("businesses")
      .getFirstListItem<BusinessRecord>(
        pb.filter("slug = {:slug}", { slug })
      );
    return business.id;
  } catch {
    return null;
  }
}
