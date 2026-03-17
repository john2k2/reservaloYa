"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";

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
import {
  RateLimitError,
  assertRateLimit,
  getRateLimitIdentifier,
} from "@/server/rate-limit";
import {
  isMercadoPagoConfigured,
  isMercadoPagoConfiguredForBusiness,
  createPaymentPreference,
  createPaymentPreferenceForBusiness,
} from "@/server/mercadopago";

const PUBLIC_BOOKING_LIMIT_MAX = 8;
const PUBLIC_BOOKING_LIMIT_WINDOW_MS = 60_000;

async function enforcePublicBookingRateLimit(input: {
  businessSlug: string;
  phone: string;
  bookingDate: string;
  startTime: string;
}) {
  const requestHeaders = await headers();
  const clientId = getRateLimitIdentifier(requestHeaders, "public-booking");

  await assertRateLimit({
    bucket: "public-booking",
    identifier: `${input.businessSlug}:${clientId}:${input.phone}:${input.bookingDate}:${input.startTime}`,
    max: PUBLIC_BOOKING_LIMIT_MAX,
    windowMs: PUBLIC_BOOKING_LIMIT_WINDOW_MS,
    message: "Demasiados intentos de reserva. Intenta nuevamente en unos segundos.",
  });
}

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
  customerPhone?: string;
  serviceName: string;
  bookingDate: string;
  startTime: string;
  notes?: string;
  mode: "created" | "rescheduled";
}) {
  const confirmation = await getBookingConfirmationData({
    slug: input.businessSlug,
    bookingId: input.bookingId,
  });

  if (!confirmation) {
    console.error("No se pudo obtener datos de confirmación para:", input.bookingId);
    return;
  }

  // Enviar email al cliente si tiene email
  if (input.customerEmail) {
    await sendBookingConfirmationEmail(confirmation, input.mode);
  }

  // Enviar notificación al negocio
  if (confirmation.businessNotificationEmail) {
    const { sendBusinessNotificationEmail } = await import("@/server/booking-notifications");
    await sendBusinessNotificationEmail(confirmation, input.mode);
  }
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

  // Cargar datos del negocio/servicio antes de crear el booking
  // para poder determinar si se requiere pago
  const { getPublicBusinessPageData: getPageDataEarly } = await import("@/server/queries/public");
  const pageDataEarly = await getPageDataEarly(parsed.data.businessSlug);
  const serviceEarly = pageDataEarly?.services.find(s => s.id === parsed.data.serviceId);

  // Token MP del negocio (OAuth por negocio) o fallback al token global
  const businessMPAccessToken = (pageDataEarly as { business?: { mpAccessToken?: string } } | null)
    ?.business?.mpAccessToken;

  const requiresPayment =
    !parsed.data.rescheduleBookingId &&
    serviceEarly?.price != null &&
    serviceEarly.price > 0 &&
    (isMercadoPagoConfiguredForBusiness(businessMPAccessToken) || isMercadoPagoConfigured());

  let bookingId: string;

  try {
    await enforcePublicBookingRateLimit({
      businessSlug: parsed.data.businessSlug,
      phone: parsed.data.phone,
      bookingDate: parsed.data.bookingDate,
      startTime: parsed.data.startTime,
    });

    const bookingInput = {
      ...parsed.data,
      initialStatus: requiresPayment ? ("pending_payment" as const) : ("pending" as const),
    };

    if (!isPocketBaseConfigured()) {
      bookingId = await createLocalPublicBooking(bookingInput);
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
      bookingId = await createPocketBasePublicBooking(bookingInput);
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
    const errorMessage =
      error instanceof RateLimitError
        ? `${error.message} Reintenta en ${error.retryAfterSeconds}s.`
        : error instanceof Error
          ? error.message
          : "No se pudo crear la reserva.";

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
        error: errorMessage,
      })
    );
  }

  const isReschedule = !!parsed.data.rescheduleBookingId;

  // Si el servicio tiene precio y MercadoPago está configurado → redirigir a pago
  if (requiresPayment && serviceEarly) {
    const businessName =
      (pageDataEarly as { profile?: { businessName?: string } } | null)?.profile?.businessName ||
      parsed.data.businessSlug;

    const preferenceInput = {
      bookingId,
      businessSlug: parsed.data.businessSlug,
      businessName,
      serviceName: serviceEarly.name,
      customerEmail: parsed.data.email || undefined,
      customerName: parsed.data.fullName,
      priceAmount: serviceEarly.price!,
    };

    const preferenceResult = businessMPAccessToken
      ? await createPaymentPreferenceForBusiness(preferenceInput, businessMPAccessToken)
      : await createPaymentPreference(preferenceInput);

    if (preferenceResult.ok) {
      // Actualizar el booking con el preferenceId antes de redirigir
      if (!isPocketBaseConfigured()) {
        const { updateLocalBookingPayment } = await import("@/server/local-store");
        await updateLocalBookingPayment({
          bookingId,
          paymentStatus: "pending",
          paymentProvider: "mercadopago",
          paymentPreferenceId: preferenceResult.preferenceId,
          paymentAmount: serviceEarly.price!,
        });
      } else {
        const { updatePocketBaseBookingPayment } = await import("@/server/pocketbase-store");
        await updatePocketBaseBookingPayment({
          bookingId,
          paymentStatus: "pending",
          paymentProvider: "mercadopago",
          paymentPreferenceId: preferenceResult.preferenceId,
          paymentAmount: serviceEarly.price!,
        });
      }

      redirect(preferenceResult.checkoutUrl);
    }
    // Si falla la creación de preferencia → revertir a pending y continuar sin pago
    console.error("[MP] No se pudo crear la preferencia de pago, revirtiendo a pending");
    try {
      if (!isPocketBaseConfigured()) {
        const { revertLocalBookingFromPendingPayment } = await import("@/server/local-store");
        await revertLocalBookingFromPendingPayment(bookingId);
      } else {
        const { revertPocketBaseBookingFromPendingPayment } = await import("@/server/pocketbase-store");
        await revertPocketBaseBookingFromPendingPayment(bookingId);
      }
    } catch (revertErr) {
      console.error("[MP] No se pudo revertir el booking:", revertErr);
    }
  }

  await sendConfirmationEmailIfPossible({
    bookingId,
    businessSlug: parsed.data.businessSlug,
    customerName: parsed.data.fullName,
    customerEmail: parsed.data.email || undefined,
    customerPhone: parsed.data.phone,
    serviceName: serviceEarly?.name || "Servicio",
    bookingDate: parsed.data.bookingDate,
    startTime: parsed.data.startTime,
    notes: parsed.data.notes,
    mode: isReschedule ? "rescheduled" : "created",
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
