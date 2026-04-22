import { demoBusinessOptions } from "@/constants/site";
import { demoPresets } from "@/constants/demo";
import type { AuthUser } from "@/server/supabase-auth";
import {
  buildBookingDateOptions,
  findNextBookingDate,
  getDayOfWeek,
} from "@/lib/bookings/format";
import { createPublicClient, createServerClient } from "@/lib/supabase/server";
import { buildWeeklySchedule } from "@/lib/bookings/schedule";
import { slugify } from "@/lib/utils";
import {
  getSupabaseAdminClient,
  createSupabaseRecord,
  updateSupabaseRecord,
} from "./_core";
import { withBookingDateLock } from "@/server/booking-slot-lock";
import {
  type AnalyticsRecord,
  type AvailabilityRuleRecord,
  type BookingStatus,
  type BlockedSlotRecord,
  type BookingRecord,
  buildBusinessPublicProfile,
  type BusinessRecord,
  type CommunicationRecord,
  type CustomerRecord,
  formatStatus,
  isActiveRecord,
  type ServiceRecord,
  toMoney,
  type WaitlistEntryRecord,
  type ReviewRecord,
  type AppUserRecord,
  calculateSlots,
} from "@/server/supabase-domain";
import {
  getAvailableReminderChannels,
  hasReminderProviderConfigured,
  isTwilioConfigured,
  sendBookingReminderEmail,
  sendBookingReminderWhatsApp,
  sendPostBookingFollowUpEmail,
  sendPostBookingFollowUpWhatsApp,
} from "@/server/booking-notifications";
import {
  canGenerateBookingManageLinks,
  createBookingManageToken,
} from "@/server/public-booking-links";
import {
  buildBookingPaymentPatch,
  buildBusinessMercadoPagoTokenClearPatch,
  buildBusinessMercadoPagoTokenPatch,
  buildBusinessPaymentSettings,
  type BookingPaymentValidationContext,
  type BookingPaymentUpdateInput,
  normalizeMercadoPagoCollectorId,
} from "@/server/payments-domain";
import {
  buildBookingConfirmationView,
  buildManageBookingView,
} from "@/server/bookings-domain";
import {
  buildBookingCustomerDetails,
  buildBookingMutationFields,
  buildBookingTimeWindow,
  canMutatePublicBooking,
  hasBlockedSlotConflict,
  hasBookingConflict,
} from "@/server/booking-mutations-domain";
import {
  buildAdminAvailabilityView,
  buildAdminBookingsView,
  buildAdminCustomersView,
  buildAdminServicesView,
  buildAdminSettingsView,
} from "@/server/admin-views-domain";
import {
  buildAdminDashboardBookingPreview,
  buildAdminDashboardMetrics,
  buildAdminDashboardNotifications,
  buildAdminDashboardView,
  buildAdminShellView,
} from "@/server/admin-dashboard-domain";

interface JoinedBookingConfirmation {
  id: string;
  confirmationCode?: string;
  bookingDate: string;
  startTime: string;
  endTime?: string;
  status: BookingStatus;
  notes?: string;
  manageToken?: string;
  paymentStatus?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentProvider?: string;
  paymentPreferenceId?: string;
  paymentExternalId?: string;
  customer_id: string;
  service_id: string;
  business: Pick<BusinessRecord, "id" | "name" | "slug" | "address" | "timezone" | "email">;
  service: Pick<ServiceRecord, "id" | "name" | "durationMinutes" | "price"> | null;
  customer: Pick<CustomerRecord, "fullName" | "email" | "phone"> | null;
}

interface JoinedBookingManage {
  id: string;
  bookingDate: string;
  startTime: string;
  endTime?: string;
  status: BookingStatus;
  notes?: string;
  manageToken?: string;
  customer_id: string;
  service_id: string;
  business: Pick<BusinessRecord, "id" | "name" | "slug" | "address" | "timezone">;
  service: Pick<ServiceRecord, "id" | "name" | "durationMinutes"> | null;
  customer: Pick<CustomerRecord, "fullName" | "email" | "phone"> | null;
}

interface JoinedBookingWithBusiness {
  id: string;
  status: BookingStatus;
  bookingDate: string;
  startTime: string;
  customer_id?: string;
  service_id?: string;
  notes?: string;
  business: Pick<BusinessRecord, "id" | "slug">;
}

interface JoinedBookingWithBusinessStatus {
  id: string;
  status: BookingStatus;
  bookingDate: string;
  startTime: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentProvider?: string;
  paymentPreferenceId?: string;
  paymentExternalId?: string;
  business: Pick<BusinessRecord, "id" | "slug" | "mpCollectorId">;
}

type PublicBookingConflictRow = Pick<BookingRecord, "id" | "startTime" | "endTime" | "status">;

async function getBusinessBySlug(slug: string) {
  const client = await getSupabaseAdminClient();
  const normalizedSlug = slugify(slug);
  const { data, error } = await client
    .from("businesses")
    .select("*")
    .eq("slug", normalizedSlug)
    .single();
  if (error || !data) throw new Error("Business not found");
  return data as BusinessRecord;
}

async function getBusinessByIdWithClient(
  client: Awaited<ReturnType<typeof createServerClient>>,
  id: string
) {
  const { data, error } = await client.from("businesses").select("*").eq("id", id).single();
  if (error || !data) throw new Error("Business not found");
  return data as BusinessRecord;
}

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

  const [servicesResult, rulesResult] = await Promise.all([
    client.from("services").select("*").eq("business_id", business.id).order("featured", { ascending: false }).order("name"),
    client.from("availability_rules").select("*").eq("business_id", business.id).order("dayOfWeek").order("startTime"),
  ]);

  const services = (servicesResult.data ?? []) as ServiceRecord[];
  const businessAvailabilityRules = (rulesResult.data ?? []) as AvailabilityRuleRecord[];

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
    source: "supabase" as const,
  };
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

      const [{ data: blockedData }, { data: bookingsData }, { data: customersData }] = await Promise.all([
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

      const blockedSlots = (blockedData ?? []) as BlockedSlotRecord[];
      const bookings = (bookingsData ?? []) as BookingRecord[];
      const customers = (customersData ?? []) as CustomerRecord[];

      const businessBlockedSlots = blockedSlots.filter(
        (slot) => slot.blockedDate === input.bookingDate
      );
      const businessBookings = bookings.filter((booking) =>
        ["pending", "pending_payment", "confirmed"].includes(booking.status)
      );
      const businessCustomers = customers.filter((customer) =>
        input.phone ? customer.phone === input.phone : customer.email === input.email
      );

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

export async function createSupabaseWaitlistEntry(input: {
  businessSlug: string;
  serviceId?: string;
  bookingDate: string;
  fullName: string;
  email: string;
  phone?: string;
}) {
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

  if (!input.serviceId) {
    throw new Error("No encontramos el servicio.");
  }

  const { data: serviceData } = await client
    .from("services")
    .select("*")
    .eq("id", input.serviceId)
    .single();

  const service = serviceData as ServiceRecord | null;

  if (!service || service.business_id !== business.id || !service.active) {
    throw new Error("No encontramos el servicio.");
  }

  const { data: existingData } = await client
    .from("waitlist_entries")
    .select("id")
    .eq("business_id", business.id)
    .eq("service_id", input.serviceId)
    .eq("bookingDate", input.bookingDate)
    .eq("email", input.email)
    .limit(1);

  if (existingData && existingData.length > 0) {
    return existingData[0].id;
  }

  const entry = await createSupabaseRecord<WaitlistEntryRecord>("waitlist_entries", {
    business_id: business.id,
    service_id: service.id,
    bookingDate: input.bookingDate,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone || undefined,
    notified: false,
  });

  return entry.id;
}

export async function createSupabaseReview(input: {
  businessSlug: string;
  bookingId?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
}) {
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

  if (!input.bookingId) {
    throw new Error("No encontramos el turno.");
  }

  const { data: existingData } = await client
    .from("reviews")
    .select("id")
    .eq("business_id", business.id)
    .eq("booking_id", input.bookingId)
    .limit(1);

  if (existingData && existingData.length > 0) {
    return existingData[0].id;
  }

  const { data: bookingData, error: bookingError } = await client
    .from("bookings")
    .select("*, service:services(*), customer:customers(*), business:businesses(*)")
    .eq("id", input.bookingId)
    .single();

  if (bookingError || !bookingData) {
    throw new Error("No encontramos el turno.");
  }

  const booking = bookingData as JoinedBookingConfirmation;
  const bookingBusiness = booking.business;
  const service = booking.service;
  const customer = booking.customer;

  if (!booking || !bookingBusiness || bookingBusiness.slug !== normalizedSlug) {
    throw new Error("No encontramos el turno.");
  }

  if (booking.status !== "completed") {
    throw new Error("Solo podes dejar una reseña despues de completar el turno.");
  }

  const review = await createSupabaseRecord<ReviewRecord>("reviews", {
    business_id: business.id,
    booking_id: input.bookingId,
    service_id: service?.id || booking.service_id,
    customerName: customer?.fullName ?? "Cliente",
    rating: input.rating,
    comment: input.comment || undefined,
  });

  return review.id;
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

      const [{ data: blockedData }, { data: bookingsData }] = await Promise.all([
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

      const blockedSlots = (blockedData ?? []) as BlockedSlotRecord[];
      const bookings = (bookingsData ?? []) as BookingRecord[];

      const businessBlockedSlots = blockedSlots.filter(
        (slot) => slot.blockedDate === input.bookingDate
      );
      const businessBookings = bookings.filter(
        (candidate) =>
          candidate.bookingDate === input.bookingDate &&
          canMutatePublicBooking(candidate.status) &&
          candidate.id !== booking.id
      );

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
}

export async function trackSupabaseAnalyticsEvent(input: {
  businessSlug: string;
  eventName: string;
  pagePath: string;
  source?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
}) {
  const client = await getSupabaseAdminClient();
  const normalizedSlug = slugify(input.businessSlug);

  const { data: businessData, error: businessError } = await client
    .from("businesses")
    .select("id")
    .eq("slug", normalizedSlug)
    .eq("active", true)
    .single();

  if (businessError || !businessData) {
    return;
  }
  const business = businessData as BusinessRecord;

  await createSupabaseRecord<AnalyticsRecord>("analytics_events", {
    business_id: business.id,
    eventName: input.eventName,
    pagePath: input.pagePath,
    source: input.source?.trim() || "direct",
    medium: input.medium?.trim() || "none",
    campaign: input.campaign?.trim() || "",
    referrer: input.referrer?.trim() || "",
  });
}

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

export async function getSupabaseSubscriptionData(businessId: string) {
  const client = await createServerClient();
  const { data: sub } = await client
    .from("subscriptions")
    .select("*")
    .eq("businessId", businessId)
    .single();

  if (!sub) {
    return null;
  }

  return {
    status: sub.status as "trial" | "active" | "cancelled" | "suspended",
    trialEndsAt: sub.trialEndsAt as string | null,
    nextBillingDate: sub.nextBillingDate as string | null,
    mpSubscriptionId: sub.mpSubscriptionId as string | null,
    created: sub.created as string,
  };
}

export async function cancelSupabaseSubscription(businessId: string) {
  const client = await createServerClient();

  const { data: sub, error } = await client
    .from("subscriptions")
    .select("id, status, nextBillingDate")
    .eq("businessId", businessId)
    .single();

  if (error || !sub) {
    throw new Error("No encontramos la suscripción.");
  }

  if (sub.status === "cancelled") {
    throw new Error("La suscripción ya está cancelada.");
  }

  if (sub.status === "suspended") {
    throw new Error("No se puede cancelar una suscripción suspendida.");
  }

  await client
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("id", sub.id);
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

export async function trackSupabaseAnalyticsEventByBusinessId(input: {
  businessId: string;
  eventName: string;
  pagePath: string;
  source?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
}) {
  await createSupabaseRecord<AnalyticsRecord>("analytics_events", {
    business_id: input.businessId,
    eventName: input.eventName,
    pagePath: input.pagePath,
    source: input.source?.trim() || "direct",
    medium: input.medium?.trim() || "none",
    campaign: input.campaign?.trim() || "",
    referrer: input.referrer?.trim() || "",
  });
}

export type UpdateSupabaseBookingPaymentInput = BookingPaymentUpdateInput;

export async function updateSupabaseBookingPayment(
  input: UpdateSupabaseBookingPaymentInput
) {
  const data = buildBookingPaymentPatch(input);
  await updateSupabaseRecord("bookings", input.bookingId, data);

  return input.bookingId;
}

export async function updateSupabaseBusinessMPTokens(input: {
  businessId: string;
  mpAccessToken: string;
  mpRefreshToken: string;
  mpCollectorId: string;
  mpTokenExpiresAt: string;
}) {
  await updateSupabaseRecord("businesses", input.businessId, buildBusinessMercadoPagoTokenPatch(input));
}

export async function clearSupabaseBusinessMPTokens(businessId: string) {
  await updateSupabaseRecord("businesses", businessId, buildBusinessMercadoPagoTokenClearPatch(""));
}

export async function getSupabaseBusinessIdBySlug(slug: string): Promise<string | null> {
  try {
    const business = await getBusinessBySlug(slug);
    return business.id;
  } catch {
    return null;
  }
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
    mpCollectorId: business.mpCollectorId,
  };
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

export async function getSupabaseBusinessPaymentSettingsByCollectorId(
  collectorId: string
) {
  const normalizedCollectorId = normalizeMercadoPagoCollectorId(collectorId);
  const client = await getSupabaseAdminClient();

  const { data, error } = await client
    .from("businesses")
    .select("*")
    .eq("mpCollectorId", normalizedCollectorId)
    .eq("active", true)
    .single();

  if (error || !data) return null;

  return buildBusinessPaymentSettings(data as BusinessRecord);
}

export async function runSupabaseBookingReminderSweep(input?: {
  businessId?: string;
  now?: string;
  dryRun?: boolean;
}) {
  const client = await getSupabaseAdminClient();
  const now = input?.now ? new Date(input.now) : new Date();
  const dryRun = Boolean(input?.dryRun);

  const PENDING_PAYMENT_EXPIRY_MS = 2 * 60 * 60 * 1000;
  const FOLLOWUP_MIN_MS = 60 * 60 * 1000;
  const FOLLOWUP_MAX_MS = 25 * 60 * 60 * 1000;

  let expiredPaymentsCancelled = 0;

  if (!dryRun) {
    const { data: expiredPayments } = await client
      .from("bookings")
      .select("id, created")
      .eq("status", "pending_payment");

    for (const booking of expiredPayments ?? []) {
      const createdAt = new Date(booking.created).getTime();
      if (now.getTime() - createdAt > PENDING_PAYMENT_EXPIRY_MS) {
        await client.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);
        expiredPaymentsCancelled += 1;
      }
    }
  }

  const businessQuery = input?.businessId
    ? client.from("businesses").select("*").eq("id", input.businessId).eq("active", true)
    : client.from("businesses").select("*").eq("active", true);

  const { data: businessesData } = await businessQuery;
  const businesses = (businessesData ?? []) as BusinessRecord[];

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
    followupSent: 0,
    followupFailed: 0,
  };

  for (const business of businesses) {
    const [{ data: bookingsData }, { data: commData }] = await Promise.all([
      client
        .from("bookings")
        .select("*, customer:customers(*), service:services(*)")
        .eq("business_id", business.id)
        .in("status", ["pending", "confirmed"]),
      client
        .from("communication_events")
        .select("*")
        .eq("business_id", business.id),
    ]);

    const businessBookings = (bookingsData ?? []) as (BookingRecord & {
      customer?: CustomerRecord;
      service?: ServiceRecord;
    })[];
    const communications = (commData ?? []) as CommunicationRecord[];

    for (const booking of businessBookings) {
      const bookingTime = new Date(`${booking.bookingDate}T${booking.startTime}:00`).getTime();

      if (
        bookingTime < now.getTime() ||
        bookingTime > now.getTime() + 24 * 60 * 60 * 1000 ||
        communications.some(
          (event) =>
            event.kind === "reminder" &&
            event.status === "sent" &&
            event.booking_id === booking.id
        )
      ) {
        continue;
      }

      const customer = booking.customer;
      const service = booking.service;

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

      if (dryRun) continue;

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

        await client.from("communication_events").insert({
          business_id: business.id,
          booking_id: booking.id,
          customer_id: customer.id,
          channel,
          kind: "reminder",
          status: result.status,
          recipient: channel === "email" ? customer.email : customer.phone,
          subject: (result as { subject?: string }).subject ?? "",
          note: (result as { reason?: string }).reason ?? "",
        });
      }
    }

    if (!dryRun) {
      const sentFollowupIds = new Set(
        communications
          .filter((e) => e.kind === "followup" && e.status === "sent")
          .map((e) => e.booking_id)
      );

      const { data: completedData } = await client
        .from("bookings")
        .select("*, customer:customers(*), service:services(*)")
        .eq("business_id", business.id)
        .eq("status", "completed");

      const completedBookings = (completedData ?? []) as (BookingRecord & {
        customer?: CustomerRecord;
        service?: ServiceRecord;
      })[];

      for (const booking of completedBookings) {
        if (sentFollowupIds.has(booking.id)) continue;

        const endTime = booking.endTime as string | undefined;
        if (!endTime) continue;

        const endMs = new Date(`${booking.bookingDate}T${endTime}:00`).getTime();
        const elapsed = now.getTime() - endMs;

        if (elapsed < FOLLOWUP_MIN_MS || elapsed > FOLLOWUP_MAX_MS) continue;

        const customer = booking.customer;
        const service = booking.service;

        if (!customer?.email && !customer?.phone) continue;

        const manageToken = canGenerateBookingManageLinks()
          ? createBookingManageToken(business.slug, booking.id)
          : undefined;

        const reviewUrl =
          manageToken
            ? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/${business.slug}/resena?booking=${booking.id}&token=${manageToken}`
            : undefined;

        if (customer?.email) {
          const result = await sendPostBookingFollowUpEmail({
            customerEmail: customer.email,
            customerName: customer.fullName,
            businessName: business.name,
            businessSlug: business.slug,
            serviceName: service?.name ?? "Servicio",
            bookingDate: booking.bookingDate,
            bookingId: booking.id,
            manageToken,
          });

          if (result.status === "sent") summary.followupSent += 1;
          else if (result.status === "error") summary.followupFailed += 1;

          await client.from("communication_events").insert({
            business_id: business.id,
            booking_id: booking.id,
            customer_id: customer.id,
            channel: "email",
            kind: "followup",
            status: result.status === "sent" ? "sent" : "failed",
            recipient: customer.email,
            subject: `Follow-up: ${service?.name ?? "Servicio"}`,
            note: result.status === "error" ? (result as { error?: string }).error ?? "" : "",
          });
        }

        if (customer?.phone && isTwilioConfigured()) {
          const wpResult = await sendPostBookingFollowUpWhatsApp({
            customerPhone: customer.phone,
            customerName: customer.fullName,
            businessName: business.name,
            businessSlug: business.slug,
            serviceName: service?.name ?? "Servicio",
            reviewUrl,
          });

          if (wpResult.status === "sent") summary.followupSent += 1;
          else if (wpResult.status === "error") summary.followupFailed += 1;

          await client.from("communication_events").insert({
            business_id: business.id,
            booking_id: booking.id,
            customer_id: customer.id,
            channel: "whatsapp",
            kind: "followup",
            status: wpResult.status === "sent" ? "sent" : "failed",
            recipient: customer.phone,
            subject: `Follow-up WA: ${service?.name ?? "Servicio"}`,
            note: wpResult.status === "error" ? (wpResult as { error?: string }).error ?? "" : "",
          });
        }
      }
    }
  }

  return summary;
}
