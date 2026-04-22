type AdminBookingListItemInput<TStatus extends string = string> = {
  id: string;
  customerName?: string | null;
  phone?: string | null;
  serviceName?: string | null;
  bookingDate: string;
  startTime: string;
  status: TStatus;
  notes?: string | null;
};

type AdminBookingFilters = {
  status?: string;
  date?: string;
  q?: string;
};

type AdminCustomerInput = {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  createdAt?: string | null;
};

type AdminCustomerBookingInput = {
  customerId: string;
  bookingDate: string;
  startTime: string;
};

type AdminServiceInput = {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number | null;
  featured?: boolean | null;
  featuredLabel?: string | null;
};

type AdminAvailabilityRuleInput = {
  id: string;
  businessId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
};

type AdminBlockedSlotInput = {
  id: string;
  businessId: string;
  blockedDate: string;
  startTime: string;
  endTime: string;
  reason?: string | null;
};

type AdminSettingsBusinessInput = {
  name: string;
  slug: string;
  templateSlug?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  timezone?: string | null;
  cancellationPolicy?: string | null;
  autoConfirmBookings?: boolean | null;
  mpConnected?: boolean | null;
  mpCollectorId?: string | null;
};

function compareBookingTimestampAsc(
  left: { bookingDate: string; startTime: string },
  right: { bookingDate: string; startTime: string }
) {
  return `${left.bookingDate}T${left.startTime}`.localeCompare(`${right.bookingDate}T${right.startTime}`);
}

function compareBookingTimestampDesc(
  left: { bookingDate: string; startTime: string },
  right: { bookingDate: string; startTime: string }
) {
  return `${right.bookingDate}T${right.startTime}`.localeCompare(`${left.bookingDate}T${left.startTime}`);
}

function normalizeSearchTerm(value?: string | null) {
  return value?.trim().toLocaleLowerCase("es-AR") ?? "";
}

export function buildAdminBookingsView<TStatus extends string>(
  bookings: AdminBookingListItemInput<TStatus>[],
  filters: AdminBookingFilters | undefined,
  formatStatus: (status: TStatus) => string
) {
  const query = normalizeSearchTerm(filters?.q);

  return bookings
    .slice()
    .sort(compareBookingTimestampAsc)
    .map((booking) => ({
      id: booking.id,
      customerName: booking.customerName ?? "Cliente",
      phone: booking.phone ?? "",
      serviceName: booking.serviceName ?? "Servicio",
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

export function buildAdminCustomersView(
  customers: AdminCustomerInput[],
  bookings: AdminCustomerBookingInput[],
  query?: string
) {
  const normalizedQuery = normalizeSearchTerm(query);

  return customers
    .slice()
    .filter((customer) => {
      if (!normalizedQuery) {
        return true;
      }

      return [customer.fullName, customer.phone, customer.email]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("es-AR").includes(normalizedQuery));
    })
    .sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""))
    .map((customer) => {
      const customerBookings = bookings.filter((booking) => booking.customerId === customer.id);
      const lastBooking = customerBookings.slice().sort(compareBookingTimestampDesc)[0];

      return {
        id: customer.id,
        fullName: customer.fullName,
        phone: customer.phone ?? "",
        email: customer.email ?? "",
        notes: customer.notes ?? "",
        bookingsCount: customerBookings.length,
        lastBookingDate: lastBooking?.bookingDate ?? null,
      };
    });
}

export function buildAdminServicesView(
  services: AdminServiceInput[],
  formatPrice: (price: number | null) => string
) {
  return services
    .slice()
    .sort((left, right) => {
      const featuredDelta = Number(Boolean(right.featured)) - Number(Boolean(left.featured));
      if (featuredDelta !== 0) {
        return featuredDelta;
      }

      return left.name.localeCompare(right.name);
    })
    .map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description ?? "",
      durationMinutes: service.durationMinutes,
      price: service.price,
      featured: Boolean(service.featured),
      featuredLabel: service.featuredLabel ?? "",
      priceLabel: formatPrice(service.price),
    }));
}

export function buildAdminAvailabilityView(
  rules: AdminAvailabilityRuleInput[],
  blockedSlots: AdminBlockedSlotInput[]
) {
  return {
    rules: rules
      .slice()
      .sort((left, right) => left.dayOfWeek - right.dayOfWeek)
      .map((rule) => ({
        id: rule.id,
        businessId: rule.businessId,
        dayOfWeek: rule.dayOfWeek,
        startTime: rule.startTime,
        endTime: rule.endTime,
        active: Boolean(rule.active),
      })),
    blockedSlots: blockedSlots
      .slice()
      .sort((left, right) =>
        `${left.blockedDate}T${left.startTime}`.localeCompare(`${right.blockedDate}T${right.startTime}`)
      )
      .map((slot) => ({
        id: slot.id,
        businessId: slot.businessId,
        blockedDate: slot.blockedDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        reason: slot.reason ?? "",
      })),
  };
}

export function buildAdminSettingsView<TProfile>(
  business: AdminSettingsBusinessInput,
  profile: TProfile
) {
  return {
    businessName: business.name,
    businessSlug: business.slug,
    templateSlug: business.templateSlug ?? business.slug,
    phone: business.phone ?? "",
    email: business.email ?? "",
    address: business.address ?? "",
    timezone: business.timezone ?? "America/Argentina/Buenos_Aires",
    publicUrl: `/${business.slug}`,
    profile,
    cancellationPolicy: business.cancellationPolicy ?? undefined,
    autoConfirmBookings: business.autoConfirmBookings ?? false,
    mpConnected: business.mpConnected ?? false,
    mpCollectorId: business.mpCollectorId ?? undefined,
  };
}
