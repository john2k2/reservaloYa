import {
  getPublicBusinessProfile,
  mergePublicBusinessProfile,
  type PublicBusinessProfile,
} from "@/constants/public-business-profiles";
import { demoBusiness, demoPresets } from "@/constants/demo";
import {
  getAvailableReminderChannels,
  hasReminderProviderConfigured,
} from "@/server/booking-notifications";
import { slugify } from "@/lib/utils";

export type LocalBookingStatus =
  | "pending"
  | "pending_payment"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type LocalAnalyticsEventName =
  | "public_page_view"
  | "booking_cta_clicked"
  | "booking_page_view"
  | "booking_created";

export type LocalCommunicationKind = "confirmation" | "reminder" | "followup";
export type LocalCommunicationStatus = "sent" | "failed";

export type LocalBusiness = {
  id: string;
  name: string;
  slug: string;
  templateSlug?: string;
  publicProfileOverrides?: Partial<PublicBusinessProfile>;
  phone: string;
  email: string;
  notificationEmail?: string; // Email para recibir notificaciones de reservas
  address: string;
  timezone: string;
  active: boolean;
  createdAt: string;
  cancellationPolicy?: string;
  // MercadoPago OAuth (per-business)
  mpAccessToken?: string;
  mpRefreshToken?: string;
  mpCollectorId?: string;
  mpTokenExpiresAt?: string;
  mpConnected?: boolean;
};

export type UpdateLocalBusinessMPTokensInput = {
  businessSlug: string;
  mpAccessToken: string;
  mpRefreshToken: string;
  mpCollectorId: string;
  mpTokenExpiresAt: string;
};

export type LocalService = {
  id: string;
  businessId: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number | null;
  featured?: boolean;
  featuredLabel?: string;
  active: boolean;
  createdAt: string;
};

export type LocalAvailabilityRule = {
  id: string;
  businessId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
};

export type LocalBlockedSlot = {
  id: string;
  businessId: string;
  blockedDate: string;
  startTime: string;
  endTime: string;
  reason: string;
};

export type LocalCustomer = {
  id: string;
  businessId: string;
  fullName: string;
  phone?: string;
  email: string;
  notes: string;
  createdAt: string;
};

export type LocalBooking = {
  id: string;
  businessId: string;
  customerId: string;
  serviceId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: LocalBookingStatus;
  notes: string;
  createdAt: string;
  // Payment fields (optional)
  paymentStatus?: "pending" | "approved" | "rejected" | "cancelled" | "refunded";
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentProvider?: "mercadopago";
  paymentPreferenceId?: string;
  paymentExternalId?: string;
};

export type LocalAnalyticsEvent = {
  id: string;
  businessId: string;
  eventName: LocalAnalyticsEventName;
  pagePath: string;
  source: string;
  medium: string;
  campaign: string;
  referrer: string;
  createdAt: string;
};

export type LocalCommunicationEvent = {
  id: string;
  businessId: string;
  bookingId: string;
  customerId: string;
  channel: "email" | "whatsapp";
  kind: LocalCommunicationKind;
  status: LocalCommunicationStatus;
  recipient: string;
  subject: string;
  note: string;
  createdAt: string;
};

export type LocalReview = {
  id: string;
  businessId: string;
  bookingId: string;
  serviceId: string;
  customerName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  createdAt: string;
};

export type LocalWaitlistEntry = {
  id: string;
  businessId: string;
  serviceId: string;
  bookingDate: string;
  fullName: string;
  email: string;
  phone?: string;
  notified: boolean;
  createdAt: string;
};

export type LocalStore = {
  businesses: LocalBusiness[];
  services: LocalService[];
  availabilityRules: LocalAvailabilityRule[];
  blockedSlots: LocalBlockedSlot[];
  customers: LocalCustomer[];
  bookings: LocalBooking[];
  analyticsEvents: LocalAnalyticsEvent[];
  communicationEvents: LocalCommunicationEvent[];
  waitlistEntries: LocalWaitlistEntry[];
  reviews: LocalReview[];
};

export type LegacyLocalStore = Omit<
  LocalStore,
  "businesses" | "analyticsEvents" | "communicationEvents"
> & {
  business: LocalBusiness;
  analyticsEvents?: LocalAnalyticsEvent[];
  communicationEvents?: LocalCommunicationEvent[];
};

export type CreateLocalBookingInput = {
  businessSlug: string;
  serviceId: string;
  bookingDate: string;
  startTime: string;
  fullName: string;
  phone?: string;
  email: string;
  notes?: string;
  rescheduleBookingId?: string;
  initialStatus?: LocalBookingStatus;
  paymentPreferenceId?: string;
};

export type CreateLocalBusinessFromTemplateInput = {
  templateSlug: string;
  name: string;
  slug: string;
  phone: string;
  email: string;
  address: string;
  timezone?: string;
};

export type UpdateLocalBusinessInput = {
  businessSlug: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  cancellationPolicy?: string;
};

export type UpsertLocalServiceInput = {
  businessSlug: string;
  serviceId?: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number | null;
  featured: boolean;
  featuredLabel: string;
};

export type DeactivateLocalServiceInput = {
  businessSlug: string;
  serviceId: string;
};

export type UpsertLocalAvailabilityRuleInput = {
  businessSlug: string;
  ruleId?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
};

export type UpsertLocalAvailabilityRulesInput = {
  businessSlug: string;
  rules: Array<{
    ruleId?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    active: boolean;
  }>;
};

export type CreateLocalBlockedSlotInput = {
  businessSlug: string;
  blockedDate: string;
  startTime: string;
  endTime: string;
  reason: string;
};

export type CreateLocalBlockedSlotsInput = {
  businessSlug: string;
  slots: Array<{
    blockedDate: string;
    startTime: string;
    endTime: string;
    reason: string;
  }>;
};

export type RemoveLocalBlockedSlotInput = {
  businessSlug: string;
  blockedSlotId: string;
};

export type UpdateLocalAdminBookingInput = {
  businessSlug: string;
  bookingId: string;
  bookingDate: string;
  startTime: string;
  status: LocalBookingStatus;
  notes: string;
};

export type UpdateLocalBusinessBrandingInput = {
  businessSlug: string;
  badge: string;
  eyebrow: string;
  headline: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  instagram: string;
  accent: string;
  accentSoft: string;
  surfaceTint: string;
  trustPoints: string[];
  benefits: string[];
  policies: string[];
  facebook?: string;
  tiktok?: string;
  website?: string;
  logoLabel?: string;
  logoUrl?: string | null;
  heroImageUrl?: string | null;
  heroImageAlt?: string;
  gallery?:
    | Array<{
        url: string;
        alt: string;
      }>
    | null;
  mapQuery?: string;
  mapEmbedUrl?: string;
  enableDarkMode?: boolean;
  darkModeColors?: {
    accent: string;
    accentSoft: string;
    surfaceTint: string;
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
  };
};

export function isLegacyStore(value: LocalStore | LegacyLocalStore): value is LegacyLocalStore {
  return "business" in value;
}

export function mergeUniqueById<T extends { id: string }>(base: T[], additions: T[]) {
  const map = new Map(base.map((item) => [item.id, item]));

  for (const item of additions) {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  }

  return Array.from(map.values());
}

export function normalizeStore(rawStore: LocalStore | LegacyLocalStore): LocalStore {
  if (isLegacyStore(rawStore)) {
    return {
      businesses: [rawStore.business],
      services: rawStore.services,
      availabilityRules: rawStore.availabilityRules,
      blockedSlots: rawStore.blockedSlots,
      customers: rawStore.customers,
      bookings: rawStore.bookings,
      analyticsEvents: rawStore.analyticsEvents ?? [],
      communicationEvents: rawStore.communicationEvents ?? [],
      waitlistEntries: [],
      reviews: [],
    };
  }

  return {
    ...rawStore,
    analyticsEvents: rawStore.analyticsEvents ?? [],
    communicationEvents: rawStore.communicationEvents ?? [],
    waitlistEntries: rawStore.waitlistEntries ?? [],
    reviews: rawStore.reviews ?? [],
  };
}

export function ensureDemoPresetData(store: LocalStore): LocalStore {
  const presetBusinesses = Object.values(demoPresets).map((preset) => ({
    ...preset.business,
    active: true,
    createdAt: "2026-03-01T10:00:00.000Z",
  }));
  const presetServices = Object.values(demoPresets).flatMap((preset) =>
    preset.services.map((service) => ({
      ...service,
      businessId: preset.business.id,
      active: true,
      createdAt: "2026-03-01T10:05:00.000Z",
    }))
  );
  const presetRules = Object.values(demoPresets).flatMap((preset) => preset.availabilityRules);
  const presetBlockedSlots = Object.values(demoPresets).flatMap((preset) => preset.blockedSlots);
  const presetCustomers = Object.values(demoPresets).flatMap((preset) => preset.customers);
  const presetBookings = Object.values(demoPresets).flatMap((preset) => preset.bookings);

  return {
    businesses: mergeUniqueById(store.businesses, presetBusinesses),
    services: mergeUniqueById(store.services, presetServices),
    availabilityRules: mergeUniqueById(store.availabilityRules, presetRules),
    blockedSlots: mergeUniqueById(store.blockedSlots, presetBlockedSlots),
    customers: mergeUniqueById(store.customers, presetCustomers),
    bookings: mergeUniqueById(store.bookings, presetBookings),
    analyticsEvents: store.analyticsEvents,
    communicationEvents: store.communicationEvents,
    waitlistEntries: store.waitlistEntries,
    reviews: store.reviews,
  };
}

export function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function fromMinutes(value: number) {
  const hours = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (value % 60).toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

export function overlaps(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA;
}

export function calculateAvailableSlots(input: {
  rules: LocalAvailabilityRule[];
  blocked: LocalBlockedSlot[];
  bookings: LocalBooking[];
  durationMinutes: number;
}) {
  const starts = new Set<string>();

  for (const rule of input.rules) {
    const ruleStart = toMinutes(rule.startTime);
    const ruleEnd = toMinutes(rule.endTime);

    for (let cursor = ruleStart; cursor + input.durationMinutes <= ruleEnd; cursor += 15) {
      const end = cursor + input.durationMinutes;

      const blockedConflict = input.blocked.some((slot) =>
        overlaps(cursor, end, toMinutes(slot.startTime), toMinutes(slot.endTime))
      );
      const bookingConflict = input.bookings.some((slot) =>
        overlaps(cursor, end, toMinutes(slot.startTime), toMinutes(slot.endTime))
      );

      if (!blockedConflict && !bookingConflict) {
        starts.add(fromMinutes(cursor));
      }
    }
  }

  return Array.from(starts).sort();
}

export function formatMoney(value: number | null) {
  if (value == null) {
    return "Consultar";
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatBookingStatus(status: LocalBookingStatus) {
  const labels: Record<LocalBookingStatus, string> = {
    pending: "Pendiente",
    pending_payment: "Pago pendiente",
    confirmed: "Confirmado",
    completed: "Completado",
    cancelled: "Cancelado",
    no_show: "No asistio",
  };

  return labels[status];
}

export function getPrimaryBusiness(store: LocalStore) {
  return store.businesses.find((business) => business.slug === demoBusiness.slug) ?? store.businesses[0];
}

export function getBusinessBySlug(store: LocalStore, slug: string) {
  const normalizedSlug = slugify(slug);
  return store.businesses.find((business) => business.slug === normalizedSlug) ?? null;
}

export function getAdminBusiness(store: LocalStore, businessSlug?: string | null) {
  if (businessSlug) {
    return getBusinessBySlug(store, businessSlug) ?? getPrimaryBusiness(store);
  }

  return getPrimaryBusiness(store);
}

export function getBusinessServices(store: LocalStore, businessId: string) {
  return store.services.filter((service) => service.businessId === businessId && service.active);
}

export function countFeaturedServices(services: LocalService[], excludedServiceId?: string) {
  return services.filter((service) => service.id !== excludedServiceId && service.featured).length;
}

export function normalizeServiceName(name: string) {
  return name.trim().toLocaleLowerCase("es-AR");
}

export function buildBlockedSlotKey(input: {
  blockedDate: string;
  startTime: string;
  endTime: string;
}) {
  return `${input.blockedDate}::${input.startTime}::${input.endTime}`;
}

export function getBusinessCustomers(store: LocalStore, businessId: string) {
  return store.customers.filter((customer) => customer.businessId === businessId);
}

export function getBusinessBookings(store: LocalStore, businessId: string) {
  return store.bookings.filter((booking) => booking.businessId === businessId);
}

export function getBusinessAnalyticsEvents(store: LocalStore, businessId: string) {
  return store.analyticsEvents.filter((event) => event.businessId === businessId);
}

export function getBusinessCommunicationEvents(store: LocalStore, businessId: string) {
  return store.communicationEvents.filter((event) => event.businessId === businessId);
}

export function buildBusinessPublicProfile(business: LocalBusiness) {
  const baseProfile = getPublicBusinessProfile(business.slug, business.name, business.templateSlug);
  const isTemplateClone = Boolean(business.templateSlug) && business.slug !== business.templateSlug;

  const sanitizedBaseProfile = isTemplateClone
    ? {
        ...baseProfile,
        instagram: undefined,
        facebook: undefined,
        tiktok: undefined,
        website: undefined,
      }
    : baseProfile;

  return mergePublicBusinessProfile(sanitizedBaseProfile, business.publicProfileOverrides ?? {});
}

export function getBusinessActiveDays(store: LocalStore, businessId: string) {
  return Array.from(
    new Set(
      store.availabilityRules
        .filter((rule) => rule.businessId === businessId && rule.active)
        .map((rule) => rule.dayOfWeek)
    )
  );
}

export function getLocalBookingDetails(store: LocalStore, bookingId?: string) {
  if (!bookingId) {
    return null;
  }

  const booking = store.bookings.find((candidate) => candidate.id === bookingId);

  if (!booking) {
    return null;
  }

  const business = store.businesses.find((candidate) => candidate.id === booking.businessId);
  const service = store.services.find((candidate) => candidate.id === booking.serviceId);
  const customer = store.customers.find((candidate) => candidate.id === booking.customerId);

  return {
    booking,
    business,
    service,
    customer,
  };
}

export function getBookingTimestamp(bookingDate: string, startTime: string) {
  const [year, month, day] = bookingDate.split("-").map(Number);
  const [hours, minutes] = startTime.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes).getTime();
}

export function findReminderCandidatesForBusiness(
  store: LocalStore,
  businessId: string,
  now = new Date(),
  reminderWindowHours = 24
) {
  const nowTime = now.getTime();
  const windowEnd = nowTime + reminderWindowHours * 60 * 60 * 1000;
  const sentReminderBookingIds = new Set(
    getBusinessCommunicationEvents(store, businessId)
      .filter((event) => event.kind === "reminder" && event.status === "sent")
      .map((event) => event.bookingId)
  );

  return getBusinessBookings(store, businessId)
    .filter((booking) => booking.status === "pending" || booking.status === "confirmed")
    .map((booking) => ({
      booking,
      timestamp: getBookingTimestamp(booking.bookingDate, booking.startTime),
    }))
    .filter(
      ({ booking, timestamp }) =>
        timestamp >= nowTime &&
        timestamp <= windowEnd &&
        !sentReminderBookingIds.has(booking.id)
    )
    .map(({ booking }) => getLocalBookingDetails(store, booking.id))
    .filter((details): details is NonNullable<typeof details> => Boolean(details))
    .sort(
      (left, right) =>
        getBookingTimestamp(left.booking.bookingDate, left.booking.startTime) -
        getBookingTimestamp(right.booking.bookingDate, right.booking.startTime)
    );
}

export function buildLocalReminderSummary(
  store: LocalStore,
  businessId: string,
  now = new Date(),
  reminderWindowHours = 24
) {
  const candidates = findReminderCandidatesForBusiness(store, businessId, now, reminderWindowHours);
  const readyCandidates = candidates.filter(
    (candidate) =>
      getAvailableReminderChannels({
        customerEmail: candidate.customer?.email,
        customerPhone: candidate.customer?.phone,
      }).length > 0
  );
  const missingEmailCandidates = candidates.filter(
    (candidate) =>
      getAvailableReminderChannels({
        customerEmail: candidate.customer?.email,
        customerPhone: candidate.customer?.phone,
      }).length === 0
  );
  const sentInWindow = getBusinessCommunicationEvents(store, businessId).filter((event) => {
    if (event.kind !== "reminder" || event.status !== "sent") {
      return false;
    }

    return new Date(event.createdAt).getTime() >= now.getTime() - reminderWindowHours * 60 * 60 * 1000;
  });

  return {
    reminderWindowHours,
    pending: readyCandidates.length,
    missingEmail: missingEmailCandidates.length,
    sentRecently: sentInWindow.length,
    providerReady: hasReminderProviderConfigured(),
    nextBookingAt:
      readyCandidates[0] != null
        ? `${readyCandidates[0].booking.bookingDate} ${readyCandidates[0].booking.startTime}`
        : null,
  };
}

export function buildLocalAnalyticsSummary(store: LocalStore, businessId: string) {
  const events = getBusinessAnalyticsEvents(store, businessId);
  const publicPageViews = events.filter((event) => event.eventName === "public_page_view");
  const bookingCtaClicks = events.filter((event) => event.eventName === "booking_cta_clicked");
  const bookingPageViews = events.filter((event) => event.eventName === "booking_page_view");
  const bookingCreated = events.filter((event) => event.eventName === "booking_created");
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
    ensureChannel(event.source).ctaClicks += 1;
  }

  for (const event of bookingPageViews) {
    ensureChannel(event.source).bookingIntents += 1;
  }

  for (const event of bookingCreated) {
    ensureChannel(event.source).bookingsCreated += 1;
  }

  const [topSource = "direct", topSourceCount = 0] = Array.from(sourceCount.entries()).sort(
    (left, right) => right[1] - left[1]
  )[0] ?? ["direct", 0];
  const [topCampaign = "Sin campana"] = Array.from(campaignCount.entries()).sort(
    (left, right) => right[1] - left[1]
  )[0] ?? ["Sin campana", 0];
  const clickThroughRate =
    publicPageViews.length > 0 ? Math.round((bookingCtaClicks.length / publicPageViews.length) * 100) : 0;
  const bookingIntentRate =
    publicPageViews.length > 0 ? Math.round((bookingPageViews.length / publicPageViews.length) * 100) : 0;
  const conversionRate =
    publicPageViews.length > 0 ? Math.round((bookingCreated.length / publicPageViews.length) * 100) : 0;

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
        conversionRate: channel.visits > 0 ? Math.round((channel.bookingsCreated / channel.visits) * 100) : 0,
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
