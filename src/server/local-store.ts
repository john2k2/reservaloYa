import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { CalendarClock, ChartColumnBig, Percent } from "lucide-react";

import {
  getPublicBusinessProfile,
  type PublicBusinessProfile,
} from "@/constants/public-business-profiles";
import { dashboardHighlights, demoBusinessOptions } from "@/constants/site";
import { demoBusiness, demoPresets } from "@/constants/demo";
import {
  buildBookingDateOptions,
  findNextBookingDate,
  getDayOfWeek,
} from "@/lib/bookings/format";
import { buildWeeklySchedule } from "@/lib/bookings/schedule";
import { slugify } from "@/lib/utils";
import { sendBookingReminderEmail } from "@/server/booking-notifications";

export type LocalBookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type LocalAnalyticsEventName =
  | "public_page_view"
  | "booking_cta_clicked"
  | "booking_page_view"
  | "booking_created";

type LocalCommunicationKind = "confirmation" | "reminder";
type LocalCommunicationStatus = "sent" | "failed";

type LocalBusiness = {
  id: string;
  name: string;
  slug: string;
  templateSlug?: string;
  publicProfileOverrides?: Partial<PublicBusinessProfile>;
  phone: string;
  email: string;
  address: string;
  timezone: string;
  active: boolean;
  createdAt: string;
};

type LocalService = {
  id: string;
  businessId: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  active: boolean;
  createdAt: string;
};

type LocalAvailabilityRule = {
  id: string;
  businessId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
};

type LocalBlockedSlot = {
  id: string;
  businessId: string;
  blockedDate: string;
  startTime: string;
  endTime: string;
  reason: string;
};

type LocalCustomer = {
  id: string;
  businessId: string;
  fullName: string;
  phone: string;
  email: string;
  notes: string;
  createdAt: string;
};

type LocalBooking = {
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
};

type LocalAnalyticsEvent = {
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

type LocalCommunicationEvent = {
  id: string;
  businessId: string;
  bookingId: string;
  customerId: string;
  channel: "email";
  kind: LocalCommunicationKind;
  status: LocalCommunicationStatus;
  recipient: string;
  subject: string;
  note: string;
  createdAt: string;
};

type LocalStore = {
  businesses: LocalBusiness[];
  services: LocalService[];
  availabilityRules: LocalAvailabilityRule[];
  blockedSlots: LocalBlockedSlot[];
  customers: LocalCustomer[];
  bookings: LocalBooking[];
  analyticsEvents: LocalAnalyticsEvent[];
  communicationEvents: LocalCommunicationEvent[];
};

type LegacyLocalStore = Omit<LocalStore, "businesses" | "analyticsEvents" | "communicationEvents"> & {
  business: LocalBusiness;
  analyticsEvents?: LocalAnalyticsEvent[];
  communicationEvents?: LocalCommunicationEvent[];
};

type CreateLocalBookingInput = {
  businessSlug: string;
  serviceId: string;
  bookingDate: string;
  startTime: string;
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
  rescheduleBookingId?: string;
};

type CreateLocalBusinessFromTemplateInput = {
  templateSlug: string;
  name: string;
  slug: string;
  phone: string;
  email: string;
  address: string;
  timezone?: string;
};

type UpdateLocalBusinessInput = {
  businessSlug: string;
  name: string;
  phone: string;
  email: string;
  address: string;
};

type UpdateLocalBusinessBrandingInput = {
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
  logoUrl?: string;
  heroImageUrl?: string;
  heroImageAlt?: string;
  gallery?: Array<{
    url: string;
    alt: string;
  }>;
  mapQuery?: string;
  mapEmbedUrl?: string;
};

const dataDir = path.join(process.cwd(), "data");
const seedPath = path.join(dataDir, "local-store.seed.json");
const runtimePath = path.join(dataDir, "local-store.json");

let storeMutationQueue = Promise.resolve();

async function ensureStoreFile() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(runtimePath, "utf8");
  } catch {
    await copyFile(seedPath, runtimePath);
  }
}

function isLegacyStore(value: LocalStore | LegacyLocalStore): value is LegacyLocalStore {
  return "business" in value;
}

function mergeUniqueById<T extends { id: string }>(base: T[], additions: T[]) {
  const map = new Map(base.map((item) => [item.id, item]));

  for (const item of additions) {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  }

  return Array.from(map.values());
}

function normalizeStore(rawStore: LocalStore | LegacyLocalStore): LocalStore {
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
    };
  }

  return {
    ...rawStore,
    analyticsEvents: rawStore.analyticsEvents ?? [],
    communicationEvents: rawStore.communicationEvents ?? [],
  };
}

function ensureDemoPresetData(store: LocalStore): LocalStore {
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
  };
}

async function readStore() {
  await ensureStoreFile();
  const content = await readFile(runtimePath, "utf8");
  const rawStore = JSON.parse(content) as LocalStore | LegacyLocalStore;

  return ensureDemoPresetData(normalizeStore(rawStore));
}

async function writeStore(store: LocalStore) {
  const content = JSON.stringify(store, null, 2);
  const runtimeTempPath = path.join(dataDir, `local-store.${randomUUID()}.tmp.json`);

  await writeFile(runtimeTempPath, content);
  await rename(runtimeTempPath, runtimePath);
}

async function mutateStore<T>(mutator: (store: LocalStore) => Promise<T> | T) {
  const run = storeMutationQueue.then(async () => {
    const store = await readStore();
    const result = await mutator(store);
    await writeStore(store);
    return result;
  });

  storeMutationQueue = run.then(
    () => undefined,
    () => undefined
  );

  return run;
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

function calculateAvailableSlots({
  rules,
  blocked,
  bookings,
  durationMinutes,
}: {
  rules: LocalAvailabilityRule[];
  blocked: LocalBlockedSlot[];
  bookings: LocalBooking[];
  durationMinutes: number;
}) {
  const starts = new Set<string>();

  for (const rule of rules) {
    const ruleStart = toMinutes(rule.startTime);
    const ruleEnd = toMinutes(rule.endTime);

    for (let cursor = ruleStart; cursor + durationMinutes <= ruleEnd; cursor += 15) {
      const end = cursor + durationMinutes;

      const blockedConflict = blocked.some((slot) =>
        overlaps(cursor, end, toMinutes(slot.startTime), toMinutes(slot.endTime))
      );
      const bookingConflict = bookings.some((slot) =>
        overlaps(cursor, end, toMinutes(slot.startTime), toMinutes(slot.endTime))
      );

      if (!blockedConflict && !bookingConflict) {
        starts.add(fromMinutes(cursor));
      }
    }
  }

  return Array.from(starts).sort();
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

function formatBookingStatus(status: LocalBookingStatus) {
  const labels: Record<LocalBookingStatus, string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    completed: "Completado",
    cancelled: "Cancelado",
    no_show: "No asistio",
  };

  return labels[status];
}

function getPrimaryBusiness(store: LocalStore) {
  return store.businesses.find((business) => business.slug === demoBusiness.slug) ?? store.businesses[0];
}

function getBusinessBySlug(store: LocalStore, slug: string) {
  return store.businesses.find((business) => business.slug === slug) ?? null;
}

function getAdminBusiness(store: LocalStore, businessSlug?: string | null) {
  if (businessSlug) {
    return getBusinessBySlug(store, businessSlug) ?? getPrimaryBusiness(store);
  }

  return getPrimaryBusiness(store);
}

function getBusinessServices(store: LocalStore, businessId: string) {
  return store.services.filter((service) => service.businessId === businessId && service.active);
}

function getBusinessCustomers(store: LocalStore, businessId: string) {
  return store.customers.filter((customer) => customer.businessId === businessId);
}

function getBusinessBookings(store: LocalStore, businessId: string) {
  return store.bookings.filter((booking) => booking.businessId === businessId);
}

function getBusinessAnalyticsEvents(store: LocalStore, businessId: string) {
  return store.analyticsEvents.filter((event) => event.businessId === businessId);
}

function getBusinessCommunicationEvents(store: LocalStore, businessId: string) {
  return store.communicationEvents.filter((event) => event.businessId === businessId);
}

function buildBusinessPublicProfile(business: LocalBusiness) {
  const baseProfile = getPublicBusinessProfile(
    business.slug,
    business.name,
    business.templateSlug
  );
  const isTemplateClone =
    Boolean(business.templateSlug) && business.slug !== business.templateSlug;

  const sanitizedBaseProfile = isTemplateClone
    ? {
        ...baseProfile,
        instagram: undefined,
        facebook: undefined,
        tiktok: undefined,
        website: undefined,
      }
    : baseProfile;

  return {
    ...sanitizedBaseProfile,
    ...(business.publicProfileOverrides ?? {}),
  };
}

function getBusinessActiveDays(store: LocalStore, businessId: string) {
  return Array.from(
    new Set(
      store.availabilityRules
        .filter((rule) => rule.businessId === businessId && rule.active)
        .map((rule) => rule.dayOfWeek)
    )
  );
}

function getLocalBookingDetails(store: LocalStore, bookingId?: string) {
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

function getBookingTimestamp(bookingDate: string, startTime: string) {
  return new Date(`${bookingDate}T${startTime}:00`).getTime();
}

function findReminderCandidatesForBusiness(
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

function buildLocalReminderSummary(
  store: LocalStore,
  businessId: string,
  now = new Date(),
  reminderWindowHours = 24
) {
  const candidates = findReminderCandidatesForBusiness(store, businessId, now, reminderWindowHours);
  const readyCandidates = candidates.filter((candidate) => Boolean(candidate.customer?.email));
  const missingEmailCandidates = candidates.filter((candidate) => !candidate.customer?.email);
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
    providerReady: Boolean(process.env.RESEND_API_KEY),
    nextBookingAt:
      readyCandidates[0] != null
        ? `${readyCandidates[0].booking.bookingDate} ${readyCandidates[0].booking.startTime}`
        : null,
  };
}

function buildLocalAnalyticsSummary(store: LocalStore, businessId: string) {
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

export async function getLocalPublicBusinessPageData(slug: string) {
  const store = await readStore();
  const business = getBusinessBySlug(store, slug);

  if (!business) {
    return null;
  }

  const profile = buildBusinessPublicProfile(business);
  const weeklyHours = buildWeeklySchedule(
    store.availabilityRules
      .filter((rule) => rule.businessId === business.id && rule.active)
      .map((rule) => ({
        dayOfWeek: rule.dayOfWeek,
        startTime: rule.startTime,
        endTime: rule.endTime,
      }))
  );

  return {
    business,
    profile,
    weeklyHours,
    services: getBusinessServices(store, business.id).map((service) => ({
      ...service,
      priceLabel: formatMoney(service.price),
    })),
    source: "local" as const,
  };
}

export async function getLocalPublicBookingFlowData({
  slug,
  serviceId,
  bookingDate,
}: {
  slug: string;
  serviceId?: string;
  bookingDate?: string;
}) {
  const store = await readStore();
  const pageData = await getLocalPublicBusinessPageData(slug);

  if (!pageData) {
    return null;
  }

  const selectedService =
    pageData.services.find((service) => service.id === serviceId) ?? pageData.services[0] ?? null;
  const activeDays = getBusinessActiveDays(store, pageData.business.id);
  const selectedDate = bookingDate ?? findNextBookingDate("2026-03-13", activeDays);
  const dateOptions = buildBookingDateOptions(selectedDate, activeDays);

  if (!selectedService) {
    return {
      ...pageData,
      bookingDate: selectedDate,
      dateOptions,
      selectedService: null,
      slots: [] as string[],
    };
  }

  const dayOfWeek = getDayOfWeek(selectedDate);
  const slots = calculateAvailableSlots({
    rules: store.availabilityRules.filter(
      (rule) =>
        rule.businessId === pageData.business.id && rule.active && rule.dayOfWeek === dayOfWeek
    ),
    blocked: store.blockedSlots.filter(
      (slot) => slot.businessId === pageData.business.id && slot.blockedDate === selectedDate
    ),
    bookings: store.bookings.filter(
      (booking) =>
        booking.businessId === pageData.business.id &&
        booking.bookingDate === selectedDate &&
        (booking.status === "pending" || booking.status === "confirmed")
    ),
    durationMinutes: selectedService.durationMinutes,
  });

  return {
    ...pageData,
    bookingDate: selectedDate,
    dateOptions,
    selectedService,
    slots,
  };
}

export async function createLocalPublicBooking(input: CreateLocalBookingInput) {
  return mutateStore((store) => {
    const business = getBusinessBySlug(store, input.businessSlug);

    if (!business) {
      throw new Error("Business not found");
    }

    const service = store.services.find(
      (candidate) =>
        candidate.businessId === business.id &&
        candidate.id === input.serviceId &&
        candidate.active
    );

    if (!service) {
      throw new Error("Service not found");
    }

    const startMinutes = toMinutes(input.startTime);
    const endMinutes = startMinutes + service.durationMinutes;
    const endTime = fromMinutes(endMinutes);

    const blockedConflict = store.blockedSlots.some(
      (slot) =>
        slot.businessId === business.id &&
        slot.blockedDate === input.bookingDate &&
        overlaps(startMinutes, endMinutes, toMinutes(slot.startTime), toMinutes(slot.endTime))
    );

    if (blockedConflict) {
      throw new Error("Ese horario esta bloqueado.");
    }

    const bookingConflict = store.bookings.some(
      (booking) =>
        booking.id !== input.rescheduleBookingId &&
        booking.businessId === business.id &&
        booking.bookingDate === input.bookingDate &&
        (booking.status === "pending" || booking.status === "confirmed") &&
        overlaps(startMinutes, endMinutes, toMinutes(booking.startTime), toMinutes(booking.endTime))
    );

    if (bookingConflict) {
      throw new Error("Ese horario ya no esta disponible.");
    }

    let customer = store.customers.find(
      (candidate) => candidate.businessId === business.id && candidate.phone === input.phone
    );

    if (!customer) {
      customer = {
        id: randomUUID(),
        businessId: business.id,
        fullName: input.fullName,
        phone: input.phone,
        email: input.email ?? "",
        notes: input.notes ?? "",
        createdAt: new Date().toISOString(),
      };
      store.customers.push(customer);
    } else {
      customer.fullName = input.fullName;
      customer.email = input.email ?? customer.email;
      customer.notes = input.notes ?? customer.notes;
    }

    const existingBooking = input.rescheduleBookingId
      ? store.bookings.find(
          (candidate) =>
            candidate.id === input.rescheduleBookingId && candidate.businessId === business.id
        )
      : null;

    if (input.rescheduleBookingId && !existingBooking) {
      throw new Error("No encontramos el turno para reprogramar.");
    }

    if (existingBooking) {
      existingBooking.customerId = customer.id;
      existingBooking.serviceId = service.id;
      existingBooking.bookingDate = input.bookingDate;
      existingBooking.startTime = input.startTime;
      existingBooking.endTime = endTime;
      existingBooking.status = "pending";
      existingBooking.notes = input.notes ?? "";

      return existingBooking.id;
    }

    const booking: LocalBooking = {
      id: randomUUID(),
      businessId: business.id,
      customerId: customer.id,
      serviceId: service.id,
      bookingDate: input.bookingDate,
      startTime: input.startTime,
      endTime,
      status: "pending",
      notes: input.notes ?? "",
      createdAt: new Date().toISOString(),
    };

    store.bookings.unshift(booking);

    return booking.id;
  });
}

export async function getLocalBookingConfirmationData(bookingId?: string) {
  const store = await readStore();
  const fallbackBusiness = getPrimaryBusiness(store);

  if (!bookingId) {
    return {
      businessName: fallbackBusiness.name,
      businessAddress: fallbackBusiness.address,
      businessTimezone: fallbackBusiness.timezone,
      bookingDate: "2026-03-13",
      startTime: "16:45",
      serviceName: "Corte + barba",
      durationMinutes: 60,
      source: "local" as const,
    };
  }

  const booking = store.bookings.find((candidate) => candidate.id === bookingId);

  if (!booking) {
    return {
      businessName: fallbackBusiness.name,
      businessAddress: fallbackBusiness.address,
      businessTimezone: fallbackBusiness.timezone,
      bookingDate: "2026-03-13",
      startTime: "16:45",
      serviceName: "Corte + barba",
      durationMinutes: 60,
      source: "local" as const,
    };
  }

  const service = store.services.find((candidate) => candidate.id === booking.serviceId);
  const business = store.businesses.find((candidate) => candidate.id === booking.businessId);

  return {
    businessName: business?.name ?? fallbackBusiness.name,
    businessAddress: business?.address ?? fallbackBusiness.address,
    businessTimezone: business?.timezone ?? fallbackBusiness.timezone,
    bookingDate: booking.bookingDate,
    startTime: booking.startTime,
    serviceName: service?.name ?? "Servicio",
    durationMinutes: service?.durationMinutes ?? 60,
    source: "local" as const,
  };
}

export async function getLocalOnboardingData() {
  const store = await readStore();

  return {
    templates: demoBusinessOptions.map((option) => ({
      ...option,
      businessName: demoPresets[option.slug]?.business.name ?? option.label,
    })),
    businesses: store.businesses
      .slice()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((business) => ({
        slug: business.slug,
        name: business.name,
        templateSlug: business.templateSlug ?? business.slug,
        phone: business.phone,
      })),
  };
}

export async function createLocalBusinessFromTemplate(
  input: CreateLocalBusinessFromTemplateInput
) {
  return mutateStore((store) => {
    const preset = demoPresets[input.templateSlug];
    const normalizedSlug = slugify(input.slug || input.name);

    if (!preset) {
      throw new Error("La demo base no existe.");
    }

    if (!normalizedSlug) {
      throw new Error("Necesitamos un slug valido para crear el negocio.");
    }

    if (store.businesses.some((business) => business.slug === normalizedSlug)) {
      throw new Error("Ese slug ya existe. Proba con otro.");
    }

    const businessId = randomUUID();
    const createdAt = new Date().toISOString();

    store.businesses.push({
      id: businessId,
      name: input.name.trim(),
      slug: normalizedSlug,
      templateSlug: input.templateSlug,
      phone: input.phone.trim(),
      email: input.email.trim(),
      address: input.address.trim(),
      timezone: input.timezone ?? preset.business.timezone,
      active: true,
      createdAt,
    });

    store.services.push(
      ...preset.services.map((service) => ({
        id: randomUUID(),
        businessId,
        name: service.name,
        description: service.description,
        durationMinutes: service.durationMinutes,
        price: service.price,
        active: true,
        createdAt,
      }))
    );

    store.availabilityRules.push(
      ...preset.availabilityRules.map((rule) => ({
        id: randomUUID(),
        businessId,
        dayOfWeek: rule.dayOfWeek,
        startTime: rule.startTime,
        endTime: rule.endTime,
        active: rule.active,
      }))
    );

    return normalizedSlug;
  });
}

export async function updateLocalBusiness(input: UpdateLocalBusinessInput) {
  return mutateStore((store) => {
    const business = getBusinessBySlug(store, input.businessSlug);

    if (!business) {
      throw new Error("No encontramos el negocio para actualizar.");
    }

    business.name = input.name;
    business.phone = input.phone;
    business.email = input.email;
    business.address = input.address;

    return business.slug;
  });
}

export async function updateLocalBusinessBranding(input: UpdateLocalBusinessBrandingInput) {
  return mutateStore((store) => {
    const business = getBusinessBySlug(store, input.businessSlug);

    if (!business) {
      throw new Error("No encontramos el negocio para actualizar el branding.");
    }

    business.publicProfileOverrides = {
      badge: input.badge,
      eyebrow: input.eyebrow,
      headline: input.headline,
      description: input.description,
      primaryCta: input.primaryCta,
      secondaryCta: input.secondaryCta,
      instagram: input.instagram || undefined,
      accent: input.accent,
      accentSoft: input.accentSoft,
      surfaceTint: input.surfaceTint,
      trustPoints: input.trustPoints,
      benefits: input.benefits,
      policies: input.policies,
      facebook: input.facebook || undefined,
      tiktok: input.tiktok || undefined,
      website: input.website || undefined,
      logoLabel: input.logoLabel || undefined,
      logoUrl: input.logoUrl || undefined,
      heroImageUrl: input.heroImageUrl || undefined,
      heroImageAlt: input.heroImageAlt || undefined,
      gallery: input.gallery?.length ? input.gallery : undefined,
      mapQuery: input.mapQuery || undefined,
      mapEmbedUrl: input.mapEmbedUrl || undefined,
    };

    return business.slug;
  });
}

export async function trackLocalAnalyticsEvent(input: {
  businessSlug: string;
  eventName: LocalAnalyticsEventName;
  pagePath: string;
  source?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
}) {
  await mutateStore((store) => {
    const business = getBusinessBySlug(store, input.businessSlug);

    if (!business) {
      return;
    }

    store.analyticsEvents.unshift({
      id: randomUUID(),
      businessId: business.id,
      eventName: input.eventName,
      pagePath: input.pagePath,
      source: input.source?.trim() || "direct",
      medium: input.medium?.trim() || "none",
      campaign: input.campaign?.trim() || "",
      referrer: input.referrer?.trim() || "",
      createdAt: new Date().toISOString(),
    });
  });
}

async function recordLocalCommunicationEvent(
  store: LocalStore,
  input: {
    businessId: string;
    bookingId: string;
    customerId: string;
    kind: LocalCommunicationKind;
    status: LocalCommunicationStatus;
    recipient: string;
    subject: string;
    note: string;
  }
) {
  store.communicationEvents.unshift({
    id: randomUUID(),
    businessId: input.businessId,
    bookingId: input.bookingId,
    customerId: input.customerId,
    channel: "email",
    kind: input.kind,
    status: input.status,
    recipient: input.recipient,
    subject: input.subject,
    note: input.note,
    createdAt: new Date().toISOString(),
  });
}

export async function runLocalBookingReminderSweep(input?: {
  businessSlug?: string;
  now?: string;
  dryRun?: boolean;
}) {
  return mutateStore(async (store) => {
    const now = input?.now ? new Date(input.now) : new Date();
    const reminderWindowHours = 24;
    const scopedBusiness =
      input?.businessSlug ? getBusinessBySlug(store, input.businessSlug) : null;
    const businesses = scopedBusiness ? [scopedBusiness] : store.businesses;
    const dryRun = Boolean(input?.dryRun);
    const summary = {
      dryRun,
      reminderWindowHours,
      businesses: businesses.length,
      candidates: 0,
      missingEmail: 0,
      readyWithoutProvider: 0,
      sent: 0,
      failed: 0,
    };

    for (const business of businesses) {
      const candidates = findReminderCandidatesForBusiness(
        store,
        business.id,
        now,
        reminderWindowHours
      );

      for (const candidate of candidates) {
        const recipient = candidate.customer?.email?.trim() ?? "";

        if (!recipient) {
          summary.missingEmail += 1;
          continue;
        }

        summary.candidates += 1;

        if (dryRun) {
          continue;
        }

        const result = await sendBookingReminderEmail({
          bookingId: candidate.booking.id,
          businessSlug: business.slug,
          customerName: candidate.customer?.fullName ?? "",
          customerEmail: recipient,
          confirmation: {
            businessName: business.name,
            businessAddress: business.address,
            businessTimezone: business.timezone,
            bookingDate: candidate.booking.bookingDate,
            startTime: candidate.booking.startTime,
            serviceName: candidate.service?.name ?? "Servicio",
            durationMinutes: candidate.service?.durationMinutes ?? 60,
          },
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

        await recordLocalCommunicationEvent(store, {
          businessId: business.id,
          bookingId: candidate.booking.id,
          customerId: candidate.customer?.id ?? candidate.booking.customerId,
          kind: "reminder",
          status: result.status,
          recipient,
          subject: result.subject,
          note: result.reason ?? "",
        });
      }
    }

    return summary;
  });
}

export async function getLocalPublicManageBookingData(bookingId?: string) {
  const store = await readStore();
  const details = getLocalBookingDetails(store, bookingId);

  if (!details?.booking || !details.business) {
    return null;
  }

  return {
    id: details.booking.id,
    businessSlug: details.business.slug,
    businessName: details.business.name,
    businessAddress: details.business.address,
    businessTimezone: details.business.timezone,
    serviceId: details.service?.id ?? "",
    serviceName: details.service?.name ?? "Servicio",
    durationMinutes: details.service?.durationMinutes ?? 60,
    bookingDate: details.booking.bookingDate,
    startTime: details.booking.startTime,
    status: details.booking.status,
    statusLabel: formatBookingStatus(details.booking.status),
    fullName: details.customer?.fullName ?? "",
    phone: details.customer?.phone ?? "",
    email: details.customer?.email ?? "",
    notes: details.booking.notes ?? details.customer?.notes ?? "",
  };
}

export async function cancelLocalPublicBooking(input: {
  businessSlug: string;
  bookingId: string;
}) {
  return mutateStore((store) => {
    const business = getBusinessBySlug(store, input.businessSlug);

    if (!business) {
      throw new Error("Business not found");
    }

    const booking = store.bookings.find(
      (candidate) => candidate.id === input.bookingId && candidate.businessId === business.id
    );

    if (!booking) {
      throw new Error("Booking not found");
    }

    booking.status = "cancelled";

    return booking.id;
  });
}

export async function getLocalAdminShellData(activeBusinessSlug?: string | null) {
  const store = await readStore();
  const business = getAdminBusiness(store, activeBusinessSlug);

  return {
    demoMode: true,
    profileName: "Demo Owner",
    businessName: business.name,
    businessSlug: business.slug,
    userEmail: "demo@reservaya.app",
    businessOptions: store.businesses
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((item) => ({
        slug: item.slug,
        name: item.name,
        templateSlug: item.templateSlug ?? item.slug,
      })),
  };
}

export async function getLocalAdminDashboardData(activeBusinessSlug?: string | null) {
  const store = await readStore();
  const business = getAdminBusiness(store, activeBusinessSlug);
  const customers = getBusinessCustomers(store, business.id);
  const analytics = buildLocalAnalyticsSummary(store, business.id);
  const reminders = buildLocalReminderSummary(store, business.id);
  const bookings = getBusinessBookings(store, business.id)
    .slice()
    .sort((a, b) => {
      const left = `${a.bookingDate}T${a.startTime}`;
      const right = `${b.bookingDate}T${b.startTime}`;
      return left.localeCompare(right);
    })
    .slice(0, 5)
    .map((booking) => {
      const customer = customers.find((candidate) => candidate.id === booking.customerId);
      const service = store.services.find((candidate) => candidate.id === booking.serviceId);

      return {
        id: booking.id,
        name: customer?.fullName ?? "Cliente",
        service: service?.name ?? "Servicio",
        date: booking.bookingDate,
        time: booking.startTime,
        status: formatBookingStatus(booking.status),
      };
    });

  const pendingBookings = getBusinessBookings(store, business.id).filter(
    (booking) => booking.status === "pending"
  ).length;
  const notifications = [
    pendingBookings > 0
      ? `${pendingBookings} turnos pendientes de confirmar`
      : "Sin turnos pendientes de confirmar",
    reminders.pending > 0
      ? reminders.providerReady
        ? `${reminders.pending} recordatorios listos para enviar`
        : `${reminders.pending} recordatorios listos cuando actives Resend`
      : "Sin recordatorios pendientes en las proximas 24 hs",
    analytics.bookingsCreated > 0
      ? `${analytics.bookingsCreated} reservas llegaron desde la web`
      : "Todavia no se registran reservas web",
    analytics.visits > 0
      ? `Canal principal: ${analytics.topSource}`
      : "Todavia no hay visitas registradas",
  ];

  return {
    profileName: "Demo Owner",
    businessName: business.name,
    businessSlug: business.slug,
    userEmail: "demo@reservaya.app",
    demoMode: true,
    metrics: [
      {
        label: "Visitas publicas",
        value: String(analytics.visits),
        hint: `${analytics.ctaClicks} clics en reservar`,
        icon: ChartColumnBig,
      },
      {
        label: "Reservas creadas",
        value: String(analytics.bookingsCreated),
        hint: `${pendingBookings} pendientes de confirmar`,
        icon: CalendarClock,
      },
      {
        label: "Conversion web",
        value: `${analytics.conversionRate}%`,
        hint:
          analytics.visits > 0
            ? `Campana principal: ${analytics.topCampaign}`
            : "Todavia sin visitas registradas",
        icon: Percent,
      },
      {
        ...dashboardHighlights[1],
        value: String(customers.length),
        hint: "Clientes guardados en modo local",
      },
    ],
    bookings,
    analytics,
    reminders,
    notifications,
  };
}

export async function getLocalAdminBookingsData(activeBusinessSlug?: string | null) {
  const store = await readStore();
  const business = getAdminBusiness(store, activeBusinessSlug);

  return getBusinessBookings(store, business.id)
    .slice()
    .sort((a, b) => `${a.bookingDate}T${a.startTime}`.localeCompare(`${b.bookingDate}T${b.startTime}`))
    .map((booking) => {
      const customer = store.customers.find((candidate) => candidate.id === booking.customerId);
      const service = store.services.find((candidate) => candidate.id === booking.serviceId);

      return {
        id: booking.id,
        customerName: customer?.fullName ?? "Cliente",
        phone: customer?.phone ?? "",
        serviceName: service?.name ?? "Servicio",
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        status: formatBookingStatus(booking.status),
        notes: booking.notes,
      };
    });
}

export async function getLocalAdminCustomersData(activeBusinessSlug?: string | null) {
  const store = await readStore();
  const business = getAdminBusiness(store, activeBusinessSlug);

  return getBusinessCustomers(store, business.id)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((customer) => {
      const customerBookings = store.bookings.filter((booking) => booking.customerId === customer.id);
      const lastBooking = customerBookings
        .slice()
        .sort((a, b) => `${b.bookingDate}T${b.startTime}`.localeCompare(`${a.bookingDate}T${a.startTime}`))[0];

      return {
        id: customer.id,
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
        notes: customer.notes,
        bookingsCount: customerBookings.length,
        lastBookingDate: lastBooking?.bookingDate ?? null,
      };
    });
}

export async function getLocalAdminServicesData(activeBusinessSlug?: string | null) {
  const store = await readStore();
  const business = getAdminBusiness(store, activeBusinessSlug);

  return getBusinessServices(store, business.id).map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description,
    durationMinutes: service.durationMinutes,
    priceLabel: formatMoney(service.price),
  }));
}

export async function getLocalAdminAvailabilityData(activeBusinessSlug?: string | null) {
  const store = await readStore();
  const business = getAdminBusiness(store, activeBusinessSlug);

  return {
    rules: store.availabilityRules
      .filter((rule) => rule.businessId === business.id)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek),
    blockedSlots: store.blockedSlots
      .filter((slot) => slot.businessId === business.id)
      .sort((a, b) => `${a.blockedDate}T${a.startTime}`.localeCompare(`${b.blockedDate}T${b.startTime}`)),
  };
}

export async function getLocalAdminSettingsData(activeBusinessSlug?: string | null) {
  const store = await readStore();
  const business = getAdminBusiness(store, activeBusinessSlug);
  const profile = buildBusinessPublicProfile(business);

  return {
    businessName: business.name,
    businessSlug: business.slug,
    templateSlug: business.templateSlug ?? business.slug,
    phone: business.phone,
    email: business.email,
    address: business.address,
    timezone: business.timezone,
    publicUrl: `/${business.slug}`,
    profile,
  };
}
