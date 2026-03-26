import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { CalendarClock, ChartColumnBig, Percent } from "lucide-react";

import { dashboardHighlights, demoBusinessOptions } from "@/constants/site";
import { demoPresets } from "@/constants/demo";
import {
  addMinutes,
  buildBookingDateOptions,
  findNextBookingDate,
  getDayOfWeek,
} from "@/lib/bookings/format";
import { buildWeeklySchedule } from "@/lib/bookings/schedule";
import { slugify } from "@/lib/utils";
import { withBookingDateLock } from "@/server/booking-slot-lock";
import {
  buildBlockedSlotKey,
  buildBusinessPublicProfile,
  buildLocalAnalyticsSummary,
  buildLocalReminderSummary,
  calculateAvailableSlots,
  countFeaturedServices,
  type CreateLocalBlockedSlotInput,
  type CreateLocalBlockedSlotsInput,
  type CreateLocalBookingInput,
  type CreateLocalBusinessFromTemplateInput,
  type DeactivateLocalServiceInput,
  ensureDemoPresetData,
  findReminderCandidatesForBusiness,
  getBookingTimestamp,
  getBusinessCommunicationEvents,
  formatBookingStatus,
  formatMoney,
  getAdminBusiness,
  getBusinessActiveDays,
  getBusinessBookings,
  getBusinessBySlug,
  getBusinessCustomers,
  getBusinessServices,
  getLocalBookingDetails,
  getPrimaryBusiness,
  fromMinutes,
  type LegacyLocalStore,
  type LocalAnalyticsEventName,
  type LocalBooking,
  type LocalCommunicationKind,
  type LocalCommunicationStatus,
  type LocalStore,
  normalizeServiceName,
  normalizeStore,
  overlaps,
  type RemoveLocalBlockedSlotInput,
  toMinutes,
  type UpdateLocalAdminBookingInput,
  type UpdateLocalBusinessBrandingInput,
  type UpdateLocalBusinessInput,
  type UpdateLocalBusinessMPTokensInput,
  type UpsertLocalAvailabilityRuleInput,
  type UpsertLocalAvailabilityRulesInput,
  type UpsertLocalServiceInput,
} from "@/server/local-domain";
import {
  getAvailableReminderChannels,
  isTwilioConfigured,
  sendBookingReminderEmail,
  sendBookingReminderWhatsApp,
  sendPostBookingFollowUpEmail,
  sendPostBookingFollowUpWhatsApp,
} from "@/server/booking-notifications";
import {
  buildBookingPaymentPatch,
  buildBusinessPaymentSettings,
  type BookingPaymentUpdateInput,
} from "@/server/payments-domain";
import {
  buildBookingConfirmationView,
  buildManageBookingView,
} from "@/server/bookings-domain";
import {
  buildAdminAvailabilityView,
  buildAdminBookingsView,
  buildAdminCustomersView,
  buildAdminServicesView,
  buildAdminSettingsView,
} from "@/server/admin-views-domain";
import { canGenerateBookingManageLinks, createBookingManageToken } from "@/server/public-booking-links";

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
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      phone: business.phone,
      email: business.email,
      address: business.address,
      timezone: business.timezone,
      cancellationPolicy: business.cancellationPolicy,
      mpConnected: business.mpConnected ?? false,
    },
    profile,
    weeklyHours,
    services: getBusinessServices(store, business.id)
      .slice()
      .sort((a, b) => {
        const featuredDelta = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
        if (featuredDelta !== 0) {
          return featuredDelta;
        }

        return a.name.localeCompare(b.name);
      })
      .map((service) => ({
        ...service,
        featured: Boolean(service.featured),
        featuredLabel: service.featuredLabel ?? "",
        priceLabel: formatMoney(service.price),
      })),
    source: "local" as const,
  };
}

export async function getLocalBusinessPaymentSettings(slug: string) {
  const store = await readStore();
  const business = getBusinessBySlug(store, slug);

  if (!business) {
    return null;
  }

  return buildBusinessPaymentSettings(business);
}

export async function getLocalBusinessPaymentSettingsByCollectorId(collectorId: string) {
  const normalizedCollectorId = collectorId.trim();

  if (!normalizedCollectorId) {
    return null;
  }

  const store = await readStore();
  const business = store.businesses.find(
    (item) => item.mpCollectorId?.trim() === normalizedCollectorId
  );

  if (!business) {
    return null;
  }

  return buildBusinessPaymentSettings(business);
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
  const selectedDate =
    bookingDate ?? findNextBookingDate(new Date().toISOString().slice(0, 10), activeDays);
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
  return withBookingDateLock(
    {
      businessKey: input.businessSlug,
      bookingDate: input.bookingDate,
    },
    () =>
      mutateStore((store) => {
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
            (booking.status === "pending" ||
              booking.status === "pending_payment" ||
              booking.status === "confirmed") &&
            overlaps(
              startMinutes,
              endMinutes,
              toMinutes(booking.startTime),
              toMinutes(booking.endTime)
            )
        );

        if (bookingConflict) {
          throw new Error("Ese horario ya no esta disponible.");
        }

        let customer = store.customers.find(
          (candidate) => candidate.businessId === business.id && candidate.email === input.email
        );

        if (!customer) {
          customer = {
            id: randomUUID(),
            businessId: business.id,
            fullName: input.fullName,
            phone: input.phone ?? "",
            email: input.email,
            notes: input.notes ?? "",
            createdAt: new Date().toISOString(),
          };
          store.customers.push(customer);
        } else {
          customer.fullName = input.fullName;
          customer.phone = input.phone ?? customer.phone;
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
          status: input.initialStatus ?? "pending",
          notes: input.notes ?? "",
          createdAt: new Date().toISOString(),
          ...(input.paymentPreferenceId
            ? {
                paymentProvider: "mercadopago" as const,
                paymentPreferenceId: input.paymentPreferenceId,
                paymentStatus: "pending" as const,
              }
            : {}),
        };

        store.bookings.unshift(booking);

        return booking.id;
      })
  );
}

export async function getLocalBookingConfirmationData(bookingId?: string) {
  const store = await readStore();
  const fallbackBusiness = getPrimaryBusiness(store);

  if (!bookingId) {
    return null;
  }

  const booking = store.bookings.find((candidate) => candidate.id === bookingId);

  if (!booking) {
    return null;
  }

  const service = store.services.find((candidate) => candidate.id === booking.serviceId);
  const business = store.businesses.find((candidate) => candidate.id === booking.businessId);
  const customer = store.customers.find((candidate) => candidate.id === booking.customerId);
  const timezone = business?.timezone ?? fallbackBusiness.timezone;

  return buildBookingConfirmationView({
    bookingId: booking.id,
    confirmationCode: (booking as { confirmationCode?: string }).confirmationCode,
    customerName: customer?.fullName,
    customerEmail: customer?.email,
    customerPhone: customer?.phone,
    businessId: business?.id ?? fallbackBusiness.id,
    businessName: business?.name ?? fallbackBusiness.name,
    businessSlug: business?.slug ?? fallbackBusiness.slug,
    businessAddress: business?.address ?? fallbackBusiness.address,
    businessTimezone: timezone,
    businessNotificationEmail: business?.notificationEmail ?? business?.email,
    serviceId: service?.id,
    serviceName: service?.name,
    durationMinutes: service?.durationMinutes,
    priceAmount: service?.price ?? null,
    bookingDate: booking.bookingDate,
    startTime: booking.startTime,
    status: booking.status,
    manageToken: (booking as { manageToken?: string }).manageToken,
    source: "local",
    paymentStatus: booking.paymentStatus,
    paymentAmount: booking.paymentAmount,
    paymentCurrency: booking.paymentCurrency,
    paymentProvider: booking.paymentProvider,
  });
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
    if (input.cancellationPolicy !== undefined) {
      business.cancellationPolicy = input.cancellationPolicy || undefined;
    }

    return business.slug;
  });
}

export async function upsertLocalService(input: UpsertLocalServiceInput) {
  return mutateStore((store) => {
    const business = getBusinessBySlug(store, input.businessSlug);

    if (!business) {
      throw new Error("No encontramos el negocio para guardar el servicio.");
    }

    const duplicateService = store.services.find(
      (service) =>
        service.businessId === business.id &&
        service.active &&
        service.id !== input.serviceId &&
        normalizeServiceName(service.name) === normalizeServiceName(input.name)
    );

    if (duplicateService) {
      throw new Error("Ya existe un servicio activo con ese nombre.");
    }

    const businessServices = getBusinessServices(store, business.id);

    if (input.featured && countFeaturedServices(businessServices, input.serviceId) >= 3) {
      throw new Error("Puedes destacar hasta 3 servicios activos.");
    }

    if (input.serviceId) {
      const service = store.services.find(
        (candidate) =>
          candidate.id === input.serviceId && candidate.businessId === business.id && candidate.active
      );

      if (!service) {
        throw new Error("No encontramos el servicio a editar.");
      }

      service.name = input.name;
      service.description = input.description;
      service.durationMinutes = input.durationMinutes;
      service.price = input.price;
      service.featured = input.featured;
      service.featuredLabel = input.featured ? input.featuredLabel : "";

      return service.id;
    }

    store.services.push({
      id: randomUUID(),
      businessId: business.id,
      name: input.name,
      description: input.description,
      durationMinutes: input.durationMinutes,
      price: input.price,
      featured: input.featured,
      featuredLabel: input.featured ? input.featuredLabel : "",
      active: true,
      createdAt: new Date().toISOString(),
    });

    return business.slug;
  });
}

export async function deactivateLocalService(input: DeactivateLocalServiceInput) {
  return mutateStore((store) => {
    const business = getBusinessBySlug(store, input.businessSlug);

    if (!business) {
      throw new Error("No encontramos el negocio para desactivar el servicio.");
    }

    const service = store.services.find(
      (candidate) =>
        candidate.id === input.serviceId && candidate.businessId === business.id && candidate.active
    );

    if (!service) {
      throw new Error("No encontramos el servicio a desactivar.");
    }

    service.active = false;

    return service.id;
  });
}

export async function upsertLocalAvailabilityRule(input: UpsertLocalAvailabilityRuleInput) {
  return upsertLocalAvailabilityRules({
    businessSlug: input.businessSlug,
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

export async function upsertLocalAvailabilityRules(input: UpsertLocalAvailabilityRulesInput) {
  return mutateStore((store) => {
    const business = getBusinessBySlug(store, input.businessSlug);

    if (!business) {
      throw new Error("No encontramos el negocio para guardar la disponibilidad.");
    }

    for (const ruleInput of input.rules) {
      const existingRule = ruleInput.ruleId
        ? store.availabilityRules.find(
            (rule) => rule.id === ruleInput.ruleId && rule.businessId === business.id
          )
        : store.availabilityRules.find(
            (rule) => rule.businessId === business.id && rule.dayOfWeek === ruleInput.dayOfWeek
          );

      if (!ruleInput.active && !existingRule) {
        continue;
      }

      if (existingRule) {
        existingRule.startTime = ruleInput.startTime;
        existingRule.endTime = ruleInput.endTime;
        existingRule.active = ruleInput.active;
        continue;
      }

      store.availabilityRules.push({
        id: randomUUID(),
        businessId: business.id,
        dayOfWeek: ruleInput.dayOfWeek,
        startTime: ruleInput.startTime,
        endTime: ruleInput.endTime,
        active: ruleInput.active,
      });
    }

    return input.rules.length;
  });
}

export async function createLocalBlockedSlot(input: CreateLocalBlockedSlotInput) {
  const result = await createLocalBlockedSlots({
    businessSlug: input.businessSlug,
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

  return input.businessSlug;
}

export async function createLocalBlockedSlots(input: CreateLocalBlockedSlotsInput) {
  return mutateStore((store) => {
    const business = getBusinessBySlug(store, input.businessSlug);

    if (!business) {
      throw new Error("No encontramos el negocio para bloquear agenda.");
    }

    const existingKeys = new Set(
      store.blockedSlots
        .filter((slot) => slot.businessId === business.id)
        .map((slot) => buildBlockedSlotKey(slot))
    );
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
      store.blockedSlots.push({
        id: randomUUID(),
        businessId: business.id,
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
  });
}

export async function removeLocalBlockedSlot(input: RemoveLocalBlockedSlotInput) {
  return mutateStore((store) => {
    const business = getBusinessBySlug(store, input.businessSlug);

    if (!business) {
      throw new Error("No encontramos el negocio para quitar el bloqueo.");
    }

    const slotIndex = store.blockedSlots.findIndex(
      (slot) => slot.id === input.blockedSlotId && slot.businessId === business.id
    );

    if (slotIndex < 0) {
      throw new Error("No encontramos el bloqueo a eliminar.");
    }

    store.blockedSlots.splice(slotIndex, 1);

    return input.blockedSlotId;
  });
}

export async function createLocalWaitlistEntry(input: {
  businessSlug: string;
  serviceId: string;
  bookingDate: string;
  fullName: string;
  email: string;
  phone?: string;
}) {
  return mutateStore((store) => {
    const business = getBusinessBySlug(store, input.businessSlug);

    if (!business) {
      throw new Error("No encontramos el negocio.");
    }

    // Check for duplicate entry (same email + date + service)
    const existing = store.waitlistEntries.find(
      (e) =>
        e.businessId === business.id &&
        e.serviceId === input.serviceId &&
        e.bookingDate === input.bookingDate &&
        e.email === input.email
    );

    if (existing) {
      return existing.id;
    }

    const entry = {
      id: randomUUID(),
      businessId: business.id,
      serviceId: input.serviceId,
      bookingDate: input.bookingDate,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      notified: false,
      createdAt: new Date().toISOString(),
    };

    store.waitlistEntries.push(entry);

    return entry.id;
  });
}

export async function createLocalReview(input: {
  businessSlug: string;
  bookingId: string;
  serviceId: string;
  customerName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
}) {
  return mutateStore((store) => {
    const business = getBusinessBySlug(store, input.businessSlug);

    if (!business) {
      throw new Error("No encontramos el negocio.");
    }

    // Only one review per booking
    const existing = store.reviews.find(
      (r) => r.businessId === business.id && r.bookingId === input.bookingId
    );

    if (existing) {
      return existing.id;
    }

    const booking = store.bookings.find(
      (b) => b.id === input.bookingId && b.businessId === business.id
    );

    if (!booking) {
      throw new Error("No encontramos el turno.");
    }

    const review = {
      id: randomUUID(),
      businessId: business.id,
      bookingId: input.bookingId,
      serviceId: input.serviceId,
      customerName: input.customerName,
      rating: input.rating,
      comment: input.comment,
      createdAt: new Date().toISOString(),
    };

    store.reviews.push(review);

    return review.id;
  });
}

export async function updateLocalAdminBooking(input: UpdateLocalAdminBookingInput) {
  return mutateStore((store) => {
    const business = getBusinessBySlug(store, input.businessSlug);

    if (!business) {
      throw new Error("No encontramos el negocio para actualizar el turno.");
    }

    const booking = store.bookings.find(
      (candidate) => candidate.id === input.bookingId && candidate.businessId === business.id
    );

    if (!booking) {
      throw new Error("No encontramos el turno a actualizar.");
    }

    const service = store.services.find(
      (candidate) => candidate.id === booking.serviceId && candidate.businessId === business.id
    );

    if (!service) {
      throw new Error("No encontramos el servicio del turno.");
    }

    const selectedDayOfWeek = getDayOfWeek(input.bookingDate);
    const startMinutes = toMinutes(input.startTime);
    const endTime = addMinutes(input.startTime, service.durationMinutes);
    const endMinutes = toMinutes(endTime);
    const activeRules = store.availabilityRules.filter(
      (rule) =>
        rule.businessId === business.id &&
        rule.active &&
        rule.dayOfWeek === selectedDayOfWeek
    );
    const fitsWithinAvailability = activeRules.some(
      (rule) =>
        startMinutes >= toMinutes(rule.startTime) && endMinutes <= toMinutes(rule.endTime)
    );

    if (!fitsWithinAvailability) {
      throw new Error("Ese horario queda fuera de la disponibilidad configurada.");
    }

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
      (candidate) =>
        candidate.id !== booking.id &&
        candidate.businessId === business.id &&
        candidate.bookingDate === input.bookingDate &&
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

    booking.bookingDate = input.bookingDate;
    booking.startTime = input.startTime;
    booking.endTime = endTime;
    booking.status = input.status;
    booking.notes = input.notes;

    return booking.id;
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
      logoUrl: input.logoUrl === null ? null : input.logoUrl || undefined,
      heroImageUrl: input.heroImageUrl === null ? null : input.heroImageUrl || undefined,
      heroImageAlt: input.heroImageAlt || undefined,
      gallery:
        input.gallery === null ? null : input.gallery?.length ? input.gallery : undefined,
      mapQuery: input.mapQuery || undefined,
      mapEmbedUrl: input.mapEmbedUrl || undefined,
      enableDarkMode: input.enableDarkMode ?? false,
      darkModeColors: input.darkModeColors,
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
      channel: "email" | "whatsapp";
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
    channel: input.channel,
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
    const PENDING_PAYMENT_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 horas
    let expiredPaymentsCancelled = 0;

    // Auto-cancelar bookings pending_payment vencidos (más de 2 horas)
    if (!dryRun) {
      for (const booking of store.bookings) {
        if (
          booking.status === "pending_payment" &&
          booking.createdAt &&
          now.getTime() - new Date(booking.createdAt).getTime() > PENDING_PAYMENT_EXPIRY_MS
        ) {
          booking.status = "cancelled";
          expiredPaymentsCancelled += 1;
        }
      }
    }

    const FOLLOWUP_MIN_MS = 60 * 60 * 1000;   // 1h después del servicio
    const FOLLOWUP_MAX_MS = 25 * 60 * 60 * 1000; // ventana de 24h para enviar

    const summary = {
      dryRun,
      reminderWindowHours,
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
      const candidates = findReminderCandidatesForBusiness(
        store,
        business.id,
        now,
        reminderWindowHours
      );

      for (const candidate of candidates) {
        const channels = getAvailableReminderChannels({
          customerEmail: candidate.customer?.email,
          customerPhone: candidate.customer?.phone,
        });

        if (channels.length === 0) {
          summary.missingEmail += 1;
          continue;
        }

        summary.candidates += 1;

        if (dryRun) {
          continue;
        }

        const confirmation = {
          businessName: business.name,
          businessAddress: business.address,
          businessTimezone: business.timezone,
          bookingDate: candidate.booking.bookingDate,
          startTime: candidate.booking.startTime,
          serviceName: candidate.service?.name ?? "Servicio",
          durationMinutes: candidate.service?.durationMinutes ?? 60,
        };

        for (const channel of channels) {
          // Skip SMS for now - not implemented
          if (channel === "sms") continue;

          const result =
            channel === "email"
              ? await sendBookingReminderEmail({
                  bookingId: candidate.booking.id,
                  businessSlug: business.slug,
                  customerName: candidate.customer?.fullName ?? "",
                  customerEmail: candidate.customer?.email?.trim() ?? "",
                  confirmation,
                })
              : await sendBookingReminderWhatsApp({
                  bookingId: candidate.booking.id,
                  businessSlug: business.slug,
                  customerName: candidate.customer?.fullName ?? "",
                  customerPhone: candidate.customer?.phone?.trim() ?? "",
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

          await recordLocalCommunicationEvent(store, {
            businessId: business.id,
            bookingId: candidate.booking.id,
            customerId: candidate.customer?.id ?? candidate.booking.customerId,
            channel,
            kind: "reminder",
            status: result.status === "error" ? "failed" : result.status,
            recipient:
              channel === "email"
                ? candidate.customer?.email?.trim() ?? ""
                : candidate.customer?.phone?.trim() ?? "",
            subject: result.subject ?? "Recordatorio de reserva",
            note: (result as { reason?: string }).reason ?? "",
          });
        }
      }

      // Follow-up emails: completed bookings where end time was 1–25h ago
      if (!dryRun) {
        const sentFollowupIds = new Set(
          getBusinessCommunicationEvents(store, business.id)
            .filter((event) => event.kind === "followup" && event.status === "sent")
            .map((event) => event.bookingId)
        );

        const completedBookings = getBusinessBookings(store, business.id).filter(
          (booking) => booking.status === "completed" && !sentFollowupIds.has(booking.id)
        );

        for (const booking of completedBookings) {
          const endMs = getBookingTimestamp(booking.bookingDate, booking.endTime);
          const elapsed = now.getTime() - endMs;

          if (elapsed < FOLLOWUP_MIN_MS || elapsed > FOLLOWUP_MAX_MS) continue;

          const customer = store.customers.find((c) => c.id === booking.customerId);
          const service = store.services.find((s) => s.id === booking.serviceId);

          if (!customer?.email) continue;

          const manageToken = canGenerateBookingManageLinks()
            ? createBookingManageToken(business.slug, booking.id)
            : undefined;

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

          if (result.status === "sent") {
            summary.followupSent += 1;
          } else if (result.status === "error") {
            summary.followupFailed += 1;
          }

          await recordLocalCommunicationEvent(store, {
            businessId: business.id,
            bookingId: booking.id,
            customerId: customer.id,
            channel: "email",
            kind: "followup",
            status: result.status === "sent" ? "sent" : "failed",
            recipient: customer.email,
            subject: `Follow-up: ${service?.name ?? "Servicio"}`,
            note: result.status === "error" ? result.error : "",
          });

          // WhatsApp follow-up si el cliente tiene teléfono y Twilio está configurado
          if (customer.phone && isTwilioConfigured()) {
            const reviewUrl = manageToken
              ? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/${business.slug}/resena?booking=${booking.id}&token=${manageToken}`
              : undefined;

            const wpResult = await sendPostBookingFollowUpWhatsApp({
              customerPhone: customer.phone,
              customerName: customer.fullName,
              businessName: business.name,
              businessSlug: business.slug,
              serviceName: service?.name ?? "Servicio",
              reviewUrl,
            });

            await recordLocalCommunicationEvent(store, {
              businessId: business.id,
              bookingId: booking.id,
              customerId: customer.id,
              channel: "whatsapp",
              kind: "followup",
              status: wpResult.status === "sent" ? "sent" : "failed",
              recipient: customer.phone,
              subject: `Follow-up WA: ${service?.name ?? "Servicio"}`,
              note: wpResult.status === "error" ? wpResult.error : "",
            });
          }
        }
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

  return buildManageBookingView({
    id: details.booking.id,
    businessSlug: details.business.slug,
    businessName: details.business.name,
    businessAddress: details.business.address,
    businessTimezone: details.business.timezone,
    serviceId: details.service?.id,
    serviceName: details.service?.name,
    durationMinutes: details.service?.durationMinutes,
    bookingDate: details.booking.bookingDate,
    startTime: details.booking.startTime,
    status: details.booking.status,
    statusLabel: formatBookingStatus(details.booking.status),
    fullName: details.customer?.fullName,
    phone: details.customer?.phone,
    email: details.customer?.email,
    notes: details.booking.notes ?? details.customer?.notes ?? "",
    source: "local",
  });
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
          : `${reminders.pending} recordatorios listos cuando actives email o WhatsApp`
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

export async function getLocalAdminBookingsData(
  activeBusinessSlug?: string | null,
  filters?: {
    status?: string;
    date?: string;
    q?: string;
  }
) {
  const store = await readStore();
  const business = getAdminBusiness(store, activeBusinessSlug);

  return buildAdminBookingsView(
    getBusinessBookings(store, business.id).map((booking) => {
      const customer = store.customers.find((candidate) => candidate.id === booking.customerId);
      const service = store.services.find((candidate) => candidate.id === booking.serviceId);

      return {
        id: booking.id,
        customerName: customer?.fullName,
        phone: customer?.phone,
        serviceName: service?.name,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        status: booking.status,
        notes: booking.notes,
      };
    }),
    filters,
    formatBookingStatus
  );
}

export async function getLocalAdminCustomersData(
  activeBusinessSlug?: string | null,
  query?: string
) {
  const store = await readStore();
  const business = getAdminBusiness(store, activeBusinessSlug);

  return buildAdminCustomersView(
    getBusinessCustomers(store, business.id).map((customer) => ({
      id: customer.id,
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email,
      notes: customer.notes,
      createdAt: customer.createdAt,
    })),
    store.bookings
      .filter((booking) => booking.businessId === business.id)
      .map((booking) => ({
        customerId: booking.customerId,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
      })),
    query
  );
}

export async function getLocalAdminServicesData(activeBusinessSlug?: string | null) {
  const store = await readStore();
  const business = getAdminBusiness(store, activeBusinessSlug);

  return buildAdminServicesView(
    getBusinessServices(store, business.id).map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      durationMinutes: service.durationMinutes,
      price: service.price,
      featured: service.featured,
      featuredLabel: service.featuredLabel,
    })),
    formatMoney
  );
}

export async function getLocalAdminAvailabilityData(activeBusinessSlug?: string | null) {
  const store = await readStore();
  const business = getAdminBusiness(store, activeBusinessSlug);

  return buildAdminAvailabilityView(
    store.availabilityRules
      .filter((rule) => rule.businessId === business.id)
      .map((rule) => ({
        id: rule.id,
        businessId: rule.businessId,
        dayOfWeek: rule.dayOfWeek,
        startTime: rule.startTime,
        endTime: rule.endTime,
        active: rule.active,
      })),
    store.blockedSlots
      .filter((slot) => slot.businessId === business.id)
      .map((slot) => ({
        id: slot.id,
        businessId: slot.businessId,
        blockedDate: slot.blockedDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        reason: slot.reason,
      }))
  );
}

export async function getLocalAdminSettingsData(activeBusinessSlug?: string | null) {
  const store = await readStore();
  const business = getAdminBusiness(store, activeBusinessSlug);
  const profile = buildBusinessPublicProfile(business);

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
      mpConnected: business.mpConnected,
      mpCollectorId: business.mpCollectorId,
    },
    profile
  );
}

/**
 * Devuelve el slug del negocio al que pertenece un booking.
 * Usado internamente por el webhook de MercadoPago.
 */
export async function getLocalBookingBusinessSlug(bookingId: string): Promise<string | null> {
  const store = await readStore();
  const booking = store.bookings.find((b) => b.id === bookingId);
  if (!booking) return null;
  const business = store.businesses.find((b) => b.id === booking.businessId);
  return business?.slug ?? null;
}

export type UpdateLocalBookingPaymentInput = BookingPaymentUpdateInput;

/**
 * Actualiza los campos de pago de una reserva.
 * Si el pago fue aprobado, cambia el status del booking a "confirmed".
 */
export async function updateLocalBookingPayment(input: UpdateLocalBookingPaymentInput) {
  return mutateStore((store) => {
    const booking = store.bookings.find((b) => b.id === input.bookingId);

    if (!booking) {
      throw new Error("No encontramos el turno para actualizar el pago.");
    }

    Object.assign(booking, buildBookingPaymentPatch(input));

    return booking.id;
  });
}

/**
 * Revierte el status de un booking de pending_payment a pending.
 * Usado cuando falla la creación de preferencia de pago.
 */
export async function revertLocalBookingFromPendingPayment(bookingId: string) {
  return mutateStore((store) => {
    const booking = store.bookings.find((b) => b.id === bookingId);
    if (!booking || booking.status !== "pending_payment") return;
    booking.status = "pending";
  });
}

/**
 * Guarda los tokens OAuth de MercadoPago en el negocio.
 */
export async function updateLocalBusinessMPTokens(
  input: UpdateLocalBusinessMPTokensInput
) {
  return mutateStore((store) => {
    const business = getBusinessBySlug(store, input.businessSlug);
    if (!business) throw new Error("No encontramos el negocio.");

    business.mpAccessToken = input.mpAccessToken;
    business.mpRefreshToken = input.mpRefreshToken;
    business.mpCollectorId = input.mpCollectorId;
    business.mpTokenExpiresAt = input.mpTokenExpiresAt;
    business.mpConnected = true;

    return business.slug;
  });
}

/**
 * Elimina los tokens OAuth de MercadoPago del negocio.
 */
export async function clearLocalBusinessMPTokens(businessSlug: string) {
  return mutateStore((store) => {
    const business = getBusinessBySlug(store, businessSlug);
    if (!business) throw new Error("No encontramos el negocio.");

    business.mpAccessToken = undefined;
    business.mpRefreshToken = undefined;
    business.mpCollectorId = undefined;
    business.mpTokenExpiresAt = undefined;
    business.mpConnected = false;

    return business.slug;
  });
}
