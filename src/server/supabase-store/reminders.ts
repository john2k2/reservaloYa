import { getSupabaseAdminClient } from "./_core";
import { getAvailableReminderChannels, hasReminderProviderConfigured, isTwilioConfigured, sendBookingReminderEmail, sendBookingReminderWhatsApp, sendPostBookingFollowUpEmail, sendPostBookingFollowUpWhatsApp } from "@/server/booking-notifications";
import { buildAbsoluteReviewUrl, canGenerateBookingManageLinks, createBookingManageToken } from "@/server/public-booking-links";
import type { BusinessRecord, BookingRecord, ServiceRecord, CustomerRecord, CommunicationRecord } from "@/server/supabase-domain";

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
  let autoCompleted = 0;

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

    const { data: pastConfirmed } = await client
      .from("bookings")
      .select("id, bookingDate, endTime")
      .in("status", ["pending", "confirmed"]);

    for (const booking of pastConfirmed ?? []) {
      const endTime = booking.endTime as string | undefined;
      if (!endTime) continue;
      const endMs = new Date(`${booking.bookingDate}T${endTime}:00`).getTime();
      if (now.getTime() > endMs + 60 * 60 * 1000) {
        await client.from("bookings").update({ status: "completed" }).eq("id", booking.id);
        autoCompleted += 1;
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
    autoCompleted,
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

        const reviewUrl = manageToken ? buildAbsoluteReviewUrl(business.slug, booking.id) ?? undefined : undefined;

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
