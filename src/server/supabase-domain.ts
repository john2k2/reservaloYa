import {
  getPublicBusinessProfile,
  type PublicBusinessProfile,
} from "@/constants/public-business-profiles";

export type BookingStatus =
  | "pending"
  | "pending_payment"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type BusinessRecord = {
  id: string;
  created: string;
  updated: string;
  name: string;
  slug: string;
  templateSlug?: string;
  phone?: string;
  email?: string;
  address?: string;
  timezone?: string;
  active?: boolean;
  publicProfileOverrides?: string;
  cancellationPolicy?: string;
  mpAccessToken?: string;
  mpRefreshToken?: string;
  mpCollectorId?: string;
  mpTokenExpiresAt?: string;
  mpConnected?: boolean;
  autoConfirmBookings?: boolean;
};

export type ServiceRecord = {
  id: string;
  created: string;
  updated: string;
  business_id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price?: number;
  featured?: boolean;
  featuredLabel?: string;
  active?: boolean;
};

export type CustomerRecord = {
  id: string;
  created: string;
  updated: string;
  business_id: string;
  fullName: string;
  phone?: string;
  email?: string;
  notes?: string;
};

export type BookingRecord = {
  id: string;
  created: string;
  updated: string;
  business_id: string;
  customer_id: string;
  service_id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  notes?: string;
  paymentStatus?: "pending" | "approved" | "rejected" | "cancelled" | "refunded";
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentProvider?: "mercadopago";
  paymentPreferenceId?: string;
  paymentExternalId?: string;
};

export type AvailabilityRuleRecord = {
  id: string;
  created: string;
  updated: string;
  business_id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active?: boolean;
};

export type BlockedSlotRecord = {
  id: string;
  created: string;
  updated: string;
  business_id: string;
  blockedDate: string;
  startTime: string;
  endTime: string;
  reason?: string;
};

export type AnalyticsRecord = {
  id: string;
  created: string;
  business_id: string;
  eventName: string;
  pagePath: string;
  source?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
};

export type CommunicationRecord = {
  id: string;
  created: string;
  business_id: string;
  booking_id: string;
  customer_id: string;
  channel: string;
  kind: "confirmation" | "reminder" | "followup";
  status: "sent" | "failed";
  recipient: string;
  subject: string;
  note?: string;
};

export type AppUserRecord = {
  id: string;
  created: string;
  updated: string;
  business_id?: string;
  name?: string;
  role?: string;
  active?: boolean;
};

export type SubscriptionRecord = {
  id: string;
  created: string;
  updated: string;
  businessId: string;
  status: "trial" | "active" | "cancelled" | "suspended";
  trialEndsAt?: string;
  nextBillingDate?: string;
  mpSubscriptionId?: string;
};

export type WaitlistEntryRecord = {
  id: string;
  created: string;
  updated: string;
  business_id: string;
  service_id?: string;
  bookingDate: string;
  fullName: string;
  email: string;
  phone?: string;
  notified?: boolean;
};

export type ReviewRecord = {
  id: string;
  created: string;
  updated: string;
  business_id: string;
  booking_id?: string;
  service_id?: string;
  customerName: string;
  rating: number;
  comment?: string;
};

export function joinSupabaseFilters(...filters: Array<string | undefined>) {
  return filters.filter((filter): filter is string => Boolean(filter?.trim())).join(" AND ");
}

export function parseProfileOverrides(value?: string) {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(value) as Partial<PublicBusinessProfile>;
  } catch {
    return {};
  }
}

export function buildBusinessPublicProfile(record: BusinessRecord) {
  const baseProfile = getPublicBusinessProfile(record.slug, record.name, record.templateSlug);

  return {
    ...baseProfile,
    ...parseProfileOverrides(record.publicProfileOverrides),
  };
}

export function toMoney(value?: number | null) {
  if (value == null) {
    return "Consultar";
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatStatus(status: BookingStatus) {
  const labels: Record<BookingStatus, string> = {
    pending: "Pendiente",
    pending_payment: "Pago pendiente",
    confirmed: "Confirmado",
    completed: "Completado",
    cancelled: "Cancelado",
    no_show: "No asistio",
  };

  return labels[status];
}

export function toMinutes(value: string) {
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

export function overlaps(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA;
}

export function isActiveRecord(record: { active?: boolean }) {
  return record.active !== false;
}

export function countFeaturedRecords(services: ServiceRecord[], excludedServiceId?: string) {
  return services.filter((service) => service.id !== excludedServiceId && service.featured).length;
}

export function buildBlockedSlotKey(input: {
  blockedDate: string;
  startTime: string;
  endTime: string;
}) {
  return `${input.blockedDate}::${input.startTime}::${input.endTime}`;
}

export function calculateSlots(input: {
  rules: AvailabilityRuleRecord[];
  blocked: BlockedSlotRecord[];
  bookings: BookingRecord[];
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
