import { addMinutes } from "@/lib/bookings/format";
import type { BookingStatus, PaymentStatus } from "@/types/domain";

type TimeRangeLike = {
  startTime: string;
  endTime: string;
};

type AvailabilityRuleLike = TimeRangeLike;

type ConflictBookingLike = TimeRangeLike & {
  id: string;
  status: BookingStatus;
};

type CustomerDetailsLike = {
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
};

export function bookingTimeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function bookingTimeRangesOverlap(
  startMinutes: number,
  endMinutes: number,
  comparedStartTime: string,
  comparedEndTime: string
) {
  const comparedStart = bookingTimeToMinutes(comparedStartTime);
  const comparedEnd = bookingTimeToMinutes(comparedEndTime);
  return startMinutes < comparedEnd && endMinutes > comparedStart;
}

export function buildBookingTimeWindow(startTime: string, durationMinutes: number) {
  const startMinutes = bookingTimeToMinutes(startTime);
  const endTime = addMinutes(startTime, durationMinutes);
  const endMinutes = bookingTimeToMinutes(endTime);

  return {
    startMinutes,
    endTime,
    endMinutes,
  };
}

export function fitsBookingWithinAvailability(
  rules: AvailabilityRuleLike[],
  input: { startMinutes: number; endMinutes: number }
) {
  return rules.some(
    (rule) =>
      input.startMinutes >= bookingTimeToMinutes(rule.startTime) &&
      input.endMinutes <= bookingTimeToMinutes(rule.endTime)
  );
}

export function hasBlockedSlotConflict(
  blockedSlots: TimeRangeLike[],
  input: { startMinutes: number; endMinutes: number }
) {
  return blockedSlots.some((slot) =>
    bookingTimeRangesOverlap(input.startMinutes, input.endMinutes, slot.startTime, slot.endTime)
  );
}

export function hasBookingConflict(
  bookings: ConflictBookingLike[],
  input: {
    startMinutes: number;
    endMinutes: number;
    allowedStatuses: BookingStatus[];
    excludeBookingId?: string | null;
  }
) {
  return bookings.some(
    (booking) =>
      booking.id !== input.excludeBookingId &&
      input.allowedStatuses.includes(booking.status) &&
      bookingTimeRangesOverlap(
        input.startMinutes,
        input.endMinutes,
        booking.startTime,
        booking.endTime
      )
  );
}

export function buildBookingCustomerDetails(
  input: {
    fullName: string;
    phone?: string | null;
    email?: string | null;
    notes?: string | null;
  },
  existing?: CustomerDetailsLike | null
) {
  return {
    fullName: input.fullName,
    phone: input.phone ?? existing?.phone ?? "",
    email: input.email ?? existing?.email ?? "",
    notes: input.notes ?? existing?.notes ?? "",
  };
}

export function buildBookingMutationFields(input: {
  bookingDate: string;
  startTime: string;
  durationMinutes: number;
  status?: BookingStatus;
  notes?: string | null;
  paymentPreferenceId?: string;
}) {
  const { endTime } = buildBookingTimeWindow(input.startTime, input.durationMinutes);
  const paymentPatch = input.paymentPreferenceId
    ? {
        paymentProvider: "mercadopago" as const,
        paymentPreferenceId: input.paymentPreferenceId,
        paymentStatus: "pending" as PaymentStatus,
      }
    : {};

  return {
    bookingDate: input.bookingDate,
    startTime: input.startTime,
    endTime,
    status: input.status ?? "pending",
    notes: input.notes ?? "",
    ...paymentPatch,
  };
}
