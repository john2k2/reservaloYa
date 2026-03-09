"use server";

import { redirect } from "next/navigation";

import { isPocketBaseConfigured } from "@/lib/pocketbase/config";
import { publicBookingSchema } from "@/lib/validations/booking";
import { trackAnalyticsEvent } from "@/server/analytics";
import { sendBookingConfirmationEmail } from "@/server/booking-notifications";
import {
  cancelLocalPublicBooking,
  createLocalPublicBooking,
} from "@/server/local-store";
import { isValidBookingManageToken } from "@/server/public-booking-links";
import {
  cancelPocketBasePublicBooking,
  createPocketBasePublicBooking,
  reschedulePocketBasePublicBooking,
} from "@/server/pocketbase-store";
import { getBookingConfirmationData } from "@/server/queries/public";

function buildBookingPageHref(input: {
  businessSlug: string;
  serviceId?: string;
  bookingDate?: string;
  rescheduleBookingId?: string;
  manageToken?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  error?: string;
}) {
  const params = new URLSearchParams();

  if (input.serviceId) {
    params.set("service", input.serviceId);
  }

  if (input.bookingDate) {
    params.set("date", input.bookingDate);
  }

  if (input.rescheduleBookingId) {
    params.set("reschedule", input.rescheduleBookingId);
  }

  if (input.manageToken) {
    params.set("token", input.manageToken);
  }

  if (input.source) {
    params.set("utm_source", input.source);
  }

  if (input.medium) {
    params.set("utm_medium", input.medium);
  }

  if (input.campaign) {
    params.set("utm_campaign", input.campaign);
  }

  if (input.error) {
    params.set("error", input.error);
  }

  const query = params.toString();

  return query ? `/${input.businessSlug}/reservar?${query}` : `/${input.businessSlug}/reservar`;
}

function buildManagePageHref(input: {
  businessSlug: string;
  bookingId: string;
  manageToken: string;
  error?: string;
  status?: string;
}) {
  const params = new URLSearchParams({
    booking: input.bookingId,
    token: input.manageToken,
  });

  if (input.error) {
    params.set("error", input.error);
  }

  if (input.status) {
    params.set("status", input.status);
  }

  return `/${input.businessSlug}/mi-turno?${params.toString()}`;
}

async function sendConfirmationEmailIfPossible(input: {
  bookingId: string;
  businessSlug: string;
  customerName: string;
  customerEmail?: string;
  mode: "created" | "rescheduled";
}) {
  if (!input.customerEmail) {
    return;
  }

  const confirmation = await getBookingConfirmationData({
    slug: input.businessSlug,
    bookingId: input.bookingId,
  });

  await sendBookingConfirmationEmail({
    bookingId: input.bookingId,
    businessSlug: input.businessSlug,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    mode: input.mode,
    confirmation,
  });
}

async function reschedulePocketBaseBooking(input: {
  businessSlug: string;
  serviceId: string;
  bookingDate: string;
  startTime: string;
  fullName: string;
  phone: string;
  email?: string;
  notes?: string;
  rescheduleBookingId: string;
  manageToken: string;
}) {
  if (
    !isValidBookingManageToken({
      slug: input.businessSlug,
      bookingId: input.rescheduleBookingId,
      token: input.manageToken,
    })
  ) {
    throw new Error("Link de gestion invalido.");
  }

  return reschedulePocketBasePublicBooking(input);
}

export async function createPublicBookingAction(formData: FormData) {
  const raw = {
    businessSlug: String(formData.get("businessSlug") ?? ""),
    serviceId: String(formData.get("serviceId") ?? ""),
    bookingDate: String(formData.get("bookingDate") ?? ""),
    startTime: String(formData.get("startTime") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    rescheduleBookingId: String(formData.get("rescheduleBookingId") ?? ""),
    manageToken: String(formData.get("manageToken") ?? ""),
    source: String(formData.get("source") ?? ""),
    medium: String(formData.get("medium") ?? ""),
    campaign: String(formData.get("campaign") ?? ""),
  };

  const parsed = publicBookingSchema.safeParse(raw);

  if (!parsed.success) {
    redirect(
      buildBookingPageHref({
        businessSlug: raw.businessSlug,
        serviceId: raw.serviceId,
        bookingDate: raw.bookingDate,
        rescheduleBookingId: raw.rescheduleBookingId,
        manageToken: raw.manageToken,
        source: raw.source,
        medium: raw.medium,
        campaign: raw.campaign,
        error: "Completa los datos del turno.",
      })
    );
  }

  if (
    parsed.data.rescheduleBookingId &&
    !isValidBookingManageToken({
      slug: parsed.data.businessSlug,
      bookingId: parsed.data.rescheduleBookingId,
      token: parsed.data.manageToken,
    })
  ) {
    redirect(
      buildBookingPageHref({
        businessSlug: parsed.data.businessSlug,
        serviceId: parsed.data.serviceId,
        bookingDate: parsed.data.bookingDate,
        source: raw.source,
        medium: raw.medium,
        campaign: raw.campaign,
        error: "Link de gestion invalido.",
      })
    );
  }

  let bookingId: string;

  try {
    if (!isPocketBaseConfigured()) {
      bookingId = await createLocalPublicBooking(parsed.data);
      if (!parsed.data.rescheduleBookingId) {
        await trackAnalyticsEvent({
          businessSlug: parsed.data.businessSlug,
          eventName: "booking_created",
          pagePath: `/${parsed.data.businessSlug}/confirmacion`,
          source: raw.source,
          medium: raw.medium,
          campaign: raw.campaign,
        });
      }
    } else if (parsed.data.rescheduleBookingId) {
      bookingId = await reschedulePocketBaseBooking({
        ...parsed.data,
        rescheduleBookingId: parsed.data.rescheduleBookingId,
        manageToken: parsed.data.manageToken ?? "",
      });
    } else {
      bookingId = await createPocketBasePublicBooking(parsed.data);
      await trackAnalyticsEvent({
        businessSlug: parsed.data.businessSlug,
        eventName: "booking_created",
        pagePath: `/${parsed.data.businessSlug}/confirmacion`,
        source: raw.source,
        medium: raw.medium,
        campaign: raw.campaign,
      });
    }
  } catch (error) {
    redirect(
      buildBookingPageHref({
        businessSlug: parsed.data.businessSlug,
        serviceId: parsed.data.serviceId,
        bookingDate: parsed.data.bookingDate,
        rescheduleBookingId: parsed.data.rescheduleBookingId,
        manageToken: parsed.data.manageToken,
        source: raw.source,
        medium: raw.medium,
        campaign: raw.campaign,
        error:
          error instanceof Error ? error.message : "No se pudo crear la reserva.",
      })
    );
  }

  await sendConfirmationEmailIfPossible({
    bookingId,
    businessSlug: parsed.data.businessSlug,
    customerName: parsed.data.fullName,
    customerEmail: parsed.data.email || undefined,
    mode: parsed.data.rescheduleBookingId ? "rescheduled" : "created",
  });

  redirect(`/${parsed.data.businessSlug}/confirmacion?booking=${bookingId}`);
}

export async function cancelPublicBookingAction(formData: FormData) {
  const businessSlug = String(formData.get("businessSlug") ?? "");
  const bookingId = String(formData.get("bookingId") ?? "");
  const manageToken = String(formData.get("manageToken") ?? "");

  if (!isValidBookingManageToken({ slug: businessSlug, bookingId, token: manageToken })) {
    redirect(`/${businessSlug}/mi-turno?error=${encodeURIComponent("Link de gestion invalido.")}`);
  }

  try {
    if (!isPocketBaseConfigured()) {
      await cancelLocalPublicBooking({ businessSlug, bookingId });
    } else {
      await cancelPocketBasePublicBooking({ businessSlug, bookingId });
    }
  } catch (error) {
    redirect(
      buildManagePageHref({
        businessSlug,
        bookingId,
        manageToken,
        error: error instanceof Error ? error.message : "No se pudo cancelar el turno.",
      })
    );
  }

  redirect(
    buildManagePageHref({
      businessSlug,
      bookingId,
      manageToken,
      status: "cancelled",
    })
  );
}
