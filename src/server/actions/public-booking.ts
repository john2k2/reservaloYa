"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createHash } from "node:crypto";

import { publicBookingSchema } from "@/lib/validations/booking";
import { trackAnalyticsEvent } from "@/server/analytics";
import { notifyBookingConfirmation } from "@/server/booking-confirmation-notifier";
import { getUsableBusinessMercadoPagoAccessToken } from "@/server/mercadopago-business-auth";
import {
  buildBookingConfirmationHref,
  isValidBookingManageToken,
} from "@/server/public-booking-links";
import {
  cancelSupabasePublicBooking,
  createSupabasePublicBooking,
  rescheduleSupabasePublicBooking,
  updateSupabaseBookingPayment,
  getSupabaseBusinessPaymentSettingsBySlug,
  updateSupabaseBusinessMPTokens,
} from "@/server/supabase-store";
import {
  getBookingConfirmationData,
  getPublicBusinessPageData,
} from "@/server/queries/public";
import {
  RateLimitError,
  assertRateLimit,
  getRateLimitIdentifier,
} from "@/server/rate-limit";
import { createLogger } from "@/server/logger";
import { createPaymentPreferenceForBusiness } from "@/server/mercadopago";

const logger = createLogger("Public Booking");

const PUBLIC_BOOKING_LIMIT_MAX = 8;
const PUBLIC_BOOKING_LIMIT_WINDOW_MS = 60_000;
// Keyed only by email (hashed) so rotating businessSlug/date/time can't reset it —
// closes email-bombing a victim across many date/time combinations.
const PUBLIC_BOOKING_EMAIL_LIMIT_MAX = 5;
const PUBLIC_BOOKING_EMAIL_LIMIT_WINDOW_MS = 10 * 60_000;
const PAYMENT_INIT_ERROR_MESSAGE =
  "No pudimos iniciar el pago online. Intenta nuevamente en unos minutos o contacta al negocio.";

function hashRateLimitEmail(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

async function enforcePublicBookingRateLimit(input: {
  businessSlug: string;
  email: string;
  bookingDate: string;
  startTime: string;
}) {
  const requestHeaders = await headers();
  const clientId = getRateLimitIdentifier(requestHeaders, "public-booking");

  // Bucket 1: IP + business only — not attacker-controlled, so rotating the
  // email/date/time can't create a fresh bucket and defeat this one.
  await assertRateLimit({
    bucket: "public-booking-client",
    identifier: `${input.businessSlug}:${clientId}`,
    max: PUBLIC_BOOKING_LIMIT_MAX,
    windowMs: PUBLIC_BOOKING_LIMIT_WINDOW_MS,
    message: "Demasiados intentos de reserva. Intenta nuevamente en unos segundos.",
  });

  // Bucket 2: hashed email only, no date/time — closes the email-bombing
  // vector where the same victim email is tried across many slots.
  await assertRateLimit({
    bucket: "public-booking-email",
    identifier: hashRateLimitEmail(input.email),
    max: PUBLIC_BOOKING_EMAIL_LIMIT_MAX,
    windowMs: PUBLIC_BOOKING_EMAIL_LIMIT_WINDOW_MS,
    message: "Demasiados intentos de reserva con este email. Intenta nuevamente en unos minutos.",
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

  if (input.serviceId) params.set("service", input.serviceId);
  if (input.bookingDate) params.set("date", input.bookingDate);
  if (input.rescheduleBookingId) params.set("reschedule", input.rescheduleBookingId);
  if (input.manageToken) params.set("token", input.manageToken);
  if (input.source) params.set("utm_source", input.source);
  if (input.medium) params.set("utm_medium", input.medium);
  if (input.campaign) params.set("utm_campaign", input.campaign);
  if (input.error) params.set("error", input.error);

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

  if (input.error) params.set("error", input.error);
  if (input.status) params.set("status", input.status);

  return `/${input.businessSlug}/mi-turno?${params.toString()}`;
}

function buildConfirmationPageHref(input: {
  businessSlug: string;
  bookingId: string;
  payment?: "success" | "failure" | "pending";
}) {
  const href = buildBookingConfirmationHref(input.businessSlug, input.bookingId);

  if (!href) {
    return `/${input.businessSlug}`;
  }

  if (!input.payment) {
    return href;
  }

  const url = new URL(href, "http://localhost");
  url.searchParams.set("payment", input.payment);
  return `${url.pathname}?${url.searchParams.toString()}`;
}

async function sendConfirmationEmailIfPossible(input: {
  bookingId: string;
  businessSlug: string;
  customerEmail?: string;
  customerPhone?: string;
  mode: "created" | "rescheduled";
}) {
  const confirmation = await getBookingConfirmationData({
    slug: input.businessSlug,
    bookingId: input.bookingId,
    skipTokenValidation: true,
  });

  if (!confirmation) {
    logger.info("No se pudo obtener datos de confirmacion", { bookingId: input.bookingId });
    return;
  }

  await notifyBookingConfirmation({
    // bookingId viene del caller: es el id real del turno recién creado.
    confirmation: { ...confirmation, bookingId: input.bookingId },
    mode: input.mode,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
  });
}

// Resuelve si el turno requiere pago online: trae el payment settings del
// negocio (nunca en un reschedule) y refresca el access token de MercadoPago
// si esta por vencer, antes de decidir si el servicio + negocio habilitan cobro.
async function resolvePaymentRequirement(input: {
  businessSlug: string;
  rescheduleBookingId?: string;
  servicePrice?: number | null;
}) {
  const businessPaymentSettings = !input.rescheduleBookingId
    ? await getSupabaseBusinessPaymentSettingsBySlug(input.businessSlug).catch(() => null)
    : null;

  const serviceHasPrice =
    !input.rescheduleBookingId && input.servicePrice != null && input.servicePrice > 0;

  const businessMPAccessToken = businessPaymentSettings
    ? await getUsableBusinessMercadoPagoAccessToken(businessPaymentSettings, async (tokens) => {
        await updateSupabaseBusinessMPTokens({
          businessId: businessPaymentSettings.businessId,
          ...tokens,
        });
      })
    : null;

  const businessHasMercadoPago = Boolean(businessMPAccessToken);
  const requiresPayment = serviceHasPrice && businessHasMercadoPago;

  return { businessPaymentSettings, businessMPAccessToken, requiresPayment };
}

// Crea la preferencia de pago en MercadoPago para un booking ya creado en
// "pending_payment". Si sale bien, marca el pago pendiente y redirige al
// checkout; si falla, revierte (cancela) el booking y redirige con error.
async function createPaymentPreferenceOrRollback(input: {
  bookingId: string;
  businessSlug: string;
  businessName: string;
  service: { name: string; price?: number | null };
  fullName: string;
  email: string;
  phone?: string;
  serviceId: string;
  bookingDate: string;
  source: string;
  medium: string;
  campaign: string;
  businessId: string;
  accessToken: string;
}) {
  const preferenceResult = await createPaymentPreferenceForBusiness(
    {
      bookingId: input.bookingId,
      businessSlug: input.businessSlug,
      businessName: input.businessName,
      serviceName: input.service.name,
      customerEmail: input.email || undefined,
      customerName: input.fullName,
      customerPhone: input.phone || undefined,
      priceAmount: input.service.price!,
    },
    input.accessToken
  );

  if (preferenceResult.ok) {
    await updateSupabaseBookingPayment({
      bookingId: input.bookingId,
      businessId: input.businessId,
      paymentStatus: "pending",
      paymentProvider: "mercadopago",
      paymentPreferenceId: preferenceResult.preferenceId,
      paymentAmount: input.service.price!,
      paymentCurrency: "ARS",
    });

    redirect(preferenceResult.checkoutUrl);
  }

  logger.error("No se pudo crear la preferencia de pago", preferenceResult.error);

  try {
    await cancelSupabasePublicBooking({
      businessSlug: input.businessSlug,
      bookingId: input.bookingId,
    });
  } catch (revertErr) {
    logger.error("No se pudo cancelar el booking tras fallar el pago", revertErr);
  }

  redirect(
    buildBookingPageHref({
      businessSlug: input.businessSlug,
      serviceId: input.serviceId,
      bookingDate: input.bookingDate,
      source: input.source,
      medium: input.medium,
      campaign: input.campaign,
      error: PAYMENT_INIT_ERROR_MESSAGE,
    })
  );
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

  const pageDataEarly = await getPublicBusinessPageData(parsed.data.businessSlug);
  const serviceEarly = pageDataEarly?.services.find((s) => s.id === parsed.data.serviceId);

  const { businessPaymentSettings, businessMPAccessToken, requiresPayment } =
    await resolvePaymentRequirement({
      businessSlug: parsed.data.businessSlug,
      rescheduleBookingId: parsed.data.rescheduleBookingId,
      servicePrice: serviceEarly?.price,
    });

  let bookingId: string;

  try {
    await enforcePublicBookingRateLimit({
      businessSlug: parsed.data.businessSlug,
      email: parsed.data.email,
      bookingDate: parsed.data.bookingDate,
      startTime: parsed.data.startTime,
    });

    const bookingInput = {
      ...parsed.data,
      initialStatus: requiresPayment ? ("pending_payment" as const) : ("confirmed" as const),
    };

    if (parsed.data.rescheduleBookingId) {
      bookingId = await rescheduleSupabasePublicBooking({
        ...parsed.data,
        rescheduleBookingId: parsed.data.rescheduleBookingId,
        manageToken: parsed.data.manageToken ?? "",
      });
    } else {
      bookingId = await createSupabasePublicBooking(bookingInput);
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

  if (requiresPayment && serviceEarly && businessMPAccessToken && businessPaymentSettings) {
    const businessName =
      (pageDataEarly as { profile?: { businessName?: string } } | null)?.profile?.businessName ||
      parsed.data.businessSlug;

    await createPaymentPreferenceOrRollback({
      bookingId,
      businessSlug: parsed.data.businessSlug,
      businessName,
      service: serviceEarly,
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      serviceId: parsed.data.serviceId,
      bookingDate: parsed.data.bookingDate,
      source: raw.source,
      medium: raw.medium,
      campaign: raw.campaign,
      businessId: businessPaymentSettings.businessId,
      accessToken: businessMPAccessToken,
    });
  }

  if (!isReschedule) {
    await sendConfirmationEmailIfPossible({
      bookingId,
      businessSlug: parsed.data.businessSlug,
      customerEmail: parsed.data.email || undefined,
      customerPhone: parsed.data.phone,
      mode: "created",
    });
  }

  redirect(
    buildConfirmationPageHref({
      businessSlug: parsed.data.businessSlug,
      bookingId,
    })
  );
}

export async function cancelPublicBookingAction(formData: FormData) {
  const businessSlug = String(formData.get("businessSlug") ?? "");
  const bookingId = String(formData.get("bookingId") ?? "");
  const manageToken = String(formData.get("manageToken") ?? "");

  if (!isValidBookingManageToken({ slug: businessSlug, bookingId, token: manageToken })) {
    redirect(`/${businessSlug}/mi-turno?error=${encodeURIComponent("Link de gestion invalido.")}`);
  }

  try {
    await cancelSupabasePublicBooking({ businessSlug, bookingId });
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
