import { NextResponse } from "next/server";

import {
  getMPPaymentInfo,
  isValidMPWebhookSignature,
  mapMPStatusToPaymentStatus,
  mpWebhookPayloadSchema,
  shouldVerifyMPWebhookSignature,
} from "@/server/mercadopago";
import { getUsableBusinessMercadoPagoAccessToken } from "@/server/mercadopago-business-auth";
import {
  getSupabaseBusinessPaymentSettingsByCollectorId,
  getSupabaseBookingPaymentValidationContext,
  getSupabaseBookingBusinessSlug,
  updateSupabaseBookingPayment,
  updateSupabaseBookingPaymentIfStatus,
  updateSupabaseBusinessMPTokens,
  getSupabaseSubscriptionByBusinessId,
  activateSupabaseSubscription,
  getSupabaseSubscriptionPaymentAttemptForWebhook,
  updateSupabaseSubscriptionPaymentAttemptStatus,
} from "@/server/supabase-store";
import { createLogger } from "@/server/logger";
import { sendBookingConfirmationEmail, sendBookingConfirmationWhatsApp, sendBusinessNotificationEmail } from "@/server/booking-notifications";
import { getBookingConfirmationData } from "@/server/queries/public";
import { type BookingPaymentValidationContext } from "@/server/payments-domain";

const logger = createLogger("MP Webhook");

function amountsMatch(expectedAmount: number | undefined, actualAmount: number) {
  if (expectedAmount == null) return false;
  return Math.abs(expectedAmount - actualAmount) < 0.01;
}

function mapPaymentStatusToSubscriptionAttemptStatus(
  paymentStatus: ReturnType<typeof mapMPStatusToPaymentStatus>
) {
  if (["approved", "rejected", "cancelled"].includes(paymentStatus)) {
    return paymentStatus as "approved" | "rejected" | "cancelled";
  }

  return null;
}

function canApplyBookingPayment(input: {
  booking: BookingPaymentValidationContext | null;
  collectorId?: string | null;
  paymentInfo: Awaited<ReturnType<typeof getMPPaymentInfo>>;
  paymentStatus: ReturnType<typeof mapMPStatusToPaymentStatus>;
  businessPaymentSettings: Awaited<ReturnType<typeof getSupabaseBusinessPaymentSettingsByCollectorId>>;
}) {
  const { booking, collectorId, paymentInfo, paymentStatus, businessPaymentSettings } = input;

  if (!booking || !paymentInfo) {
    return { ok: false, reason: "booking_not_found" } as const;
  }

  if (booking.paymentProvider !== "mercadopago" || !booking.paymentPreferenceId) {
    return { ok: false, reason: "booking_not_prepared_for_mp" } as const;
  }

  if (!amountsMatch(booking.paymentAmount, paymentInfo.transactionAmount)) {
    return { ok: false, reason: "payment_amount_mismatch" } as const;
  }

  const expectedCurrency = booking.paymentCurrency ?? "ARS";
  if (paymentInfo.currencyId !== expectedCurrency) {
    return { ok: false, reason: "payment_currency_mismatch" } as const;
  }

  if (booking.paymentExternalId && booking.paymentExternalId !== paymentInfo.id) {
    return { ok: false, reason: "payment_external_id_mismatch" } as const;
  }

  const resolvedCollectorId = collectorId ?? paymentInfo.collectorId ?? null;
  if (resolvedCollectorId && booking.mpCollectorId && resolvedCollectorId !== booking.mpCollectorId) {
    return { ok: false, reason: "collector_mismatch" } as const;
  }

  if (businessPaymentSettings && businessPaymentSettings.businessId !== booking.businessId) {
    return { ok: false, reason: "business_mismatch" } as const;
  }

  if (paymentInfo.metadata?.bookingId && paymentInfo.metadata.bookingId !== booking.bookingId) {
    return { ok: false, reason: "metadata_booking_mismatch" } as const;
  }

  if (
    paymentInfo.metadata?.businessSlug &&
    paymentInfo.metadata.businessSlug !== booking.businessSlug
  ) {
    return { ok: false, reason: "metadata_business_mismatch" } as const;
  }

  if (
    paymentStatus === "approved" &&
    !["pending_payment", "confirmed"].includes(booking.status)
  ) {
    return { ok: false, reason: "invalid_booking_status_for_approval" } as const;
  }

  return { ok: true } as const;
}

// A booking is written first, then MP's preference is created, then we persist
// paymentProvider/paymentPreferenceId on it (see src/server/actions/public-booking.ts).
// If Mercado Pago's webhook lands in that last write's window, the booking looks
// "not prepared for MP" even though it's about to be. MP tolerates a slow response far
// beyond this budget, so retry briefly instead of dropping the payment with a 200.
const BOOKING_NOT_PREPARED_RETRY_DELAYS_MS = [700, 700, 700];

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveBookingPaymentValidation(input: {
  bookingId: string;
  collectorId?: string | null;
  paymentInfo: Awaited<ReturnType<typeof getMPPaymentInfo>>;
  paymentStatus: ReturnType<typeof mapMPStatusToPaymentStatus>;
  businessPaymentSettings: Awaited<ReturnType<typeof getSupabaseBusinessPaymentSettingsByCollectorId>>;
}) {
  const { bookingId, ...rest } = input;

  let booking = await getSupabaseBookingPaymentValidationContext(bookingId);
  let validation = canApplyBookingPayment({ booking, ...rest });

  for (const delayMs of BOOKING_NOT_PREPARED_RETRY_DELAYS_MS) {
    if (validation.reason !== "booking_not_prepared_for_mp") break;

    await wait(delayMs);
    booking = await getSupabaseBookingPaymentValidationContext(bookingId);
    validation = canApplyBookingPayment({ booking, ...rest });
  }

  return { booking, validation };
}

async function canApplySubscriptionPayment(input: {
  businessId: string;
  paymentInfo: Awaited<ReturnType<typeof getMPPaymentInfo>>;
  paymentStatus: ReturnType<typeof mapMPStatusToPaymentStatus>;
}) {
  const { businessId, paymentInfo, paymentStatus } = input;

  if (!paymentInfo) {
    return { ok: false, reason: "payment_not_found" } as const;
  }

  if (!businessId || paymentInfo.externalReference !== businessId) {
    return { ok: false, reason: "subscription_external_reference_mismatch" } as const;
  }

  const attempt = await getSupabaseSubscriptionPaymentAttemptForWebhook({
    businessId,
    preferenceId: paymentInfo.preferenceId,
  });

  if (!attempt) {
    return { ok: false, reason: "subscription_payment_attempt_not_found" } as const;
  }

  const attemptStatus = mapPaymentStatusToSubscriptionAttemptStatus(paymentStatus);

  if (paymentStatus !== "approved") {
    if (attemptStatus) {
      await updateSupabaseSubscriptionPaymentAttemptStatus({
        attemptId: attempt.id,
        status: attemptStatus,
        paymentId: paymentInfo.id,
      });
    }

    return { ok: false, reason: "subscription_payment_not_approved" } as const;
  }

  if (paymentInfo.currencyId !== attempt.currency) {
    await updateSupabaseSubscriptionPaymentAttemptStatus({
      attemptId: attempt.id,
      status: "rejected",
      paymentId: paymentInfo.id,
    });
    return { ok: false, reason: "subscription_currency_mismatch" } as const;
  }

  if (!amountsMatch(attempt.amountArs, paymentInfo.transactionAmount)) {
    await updateSupabaseSubscriptionPaymentAttemptStatus({
      attemptId: attempt.id,
      status: "rejected",
      paymentId: paymentInfo.id,
    });
    return { ok: false, reason: "subscription_amount_mismatch" } as const;
  }

  const subscription = await getSupabaseSubscriptionByBusinessId(businessId);
  if (!subscription) {
    return { ok: false, reason: "subscription_not_found" } as const;
  }

  if (subscription.status === "active") {
    return { ok: false, reason: "subscription_already_active" } as const;
  }

  return { ok: true, attempt, subscription } as const;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const rawBody = await request.json().catch(() => null);
  const parseResult = mpWebhookPayloadSchema.safeParse(rawBody);

  if (!parseResult.success) {
    logger.warn("Payload de webhook invalido", parseResult.error.flatten());
    return NextResponse.json({ ok: false, error: "Invalid webhook payload" }, { status: 400 });
  }

  const body = parseResult.data;

  const isPaymentEvent =
    body.type === "payment" ||
    body.action === "payment.created" ||
    body.action === "payment.updated" ||
    url.searchParams.get("type") === "payment";

  if (!isPaymentEvent) {
    return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
  }

  const paymentId =
    (body.data?.id ? String(body.data.id) : null) ??
    (body.id ? String(body.id) : null) ??
    url.searchParams.get("data.id") ??
    url.searchParams.get("id");

  if (!paymentId) {
    logger.warn("Sin payment ID en el payload", body);
    return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
  }

  if (!shouldVerifyMPWebhookSignature()) {
    if (process.env.NODE_ENV === "production") {
      logger.error("MP_WEBHOOK_SECRET no configurado en production: rechazando webhook");
      return NextResponse.json({ ok: false, error: "Webhook signature required" }, { status: 401 });
    }
    logger.warn("MP_WEBHOOK_SECRET no configurado: webhook sin verificacion de firma (solo dev local)");
  } else if (
    !isValidMPWebhookSignature({
      paymentId,
      requestId: request.headers.get("x-request-id"),
      signatureHeader: request.headers.get("x-signature"),
    })
  ) {
    logger.warn("Firma invalida o incompleta para payment ID", paymentId);
    return NextResponse.json({ ok: false, error: "Invalid webhook signature" }, { status: 401 });
  }

  try {
    const collectorIdFromRequest =
      (body.user_id != null ? String(body.user_id) : null) ?? url.searchParams.get("user_id");

    let businessPaymentSettings = collectorIdFromRequest
      ? await getSupabaseBusinessPaymentSettingsByCollectorId(collectorIdFromRequest)
      : null;

    const businessAccessToken = businessPaymentSettings
      ? await getUsableBusinessMercadoPagoAccessToken(
          businessPaymentSettings,
          async (tokens) => {
            await updateSupabaseBusinessMPTokens({
              businessId: businessPaymentSettings!.businessId,
              ...tokens,
            });
          }
        )
      : null;

    const paymentInfo = await getMPPaymentInfo(paymentId, businessAccessToken ?? undefined);

    if (!paymentInfo) {
      logger.warn("No se pudo obtener info del pago", paymentId);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const { externalReference, status, transactionAmount, currencyId } = paymentInfo;

    const resolvedCollectorId = collectorIdFromRequest ?? paymentInfo.collectorId ?? null;

    if (!businessPaymentSettings && resolvedCollectorId) {
      businessPaymentSettings =
        await getSupabaseBusinessPaymentSettingsByCollectorId(resolvedCollectorId);
    }

    if (!externalReference) {
      logger.warn("Pago sin external_reference", paymentId);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const paymentStatus = mapMPStatusToPaymentStatus(status);

    const { booking: bookingValidation, validation: paymentValidation } =
      await resolveBookingPaymentValidation({
        bookingId: externalReference,
        collectorId: resolvedCollectorId,
        paymentInfo,
        paymentStatus,
        businessPaymentSettings,
      });

    if (!paymentValidation.ok) {
      if (paymentValidation.reason === "booking_not_found") {
        const subscriptionValidation = await canApplySubscriptionPayment({
          businessId: externalReference,
          paymentInfo,
          paymentStatus,
        });

        if (subscriptionValidation.ok) {
          try {
            await activateSupabaseSubscription(externalReference);
            await updateSupabaseSubscriptionPaymentAttemptStatus({
              attemptId: subscriptionValidation.attempt.id,
              status: "approved",
              paymentId,
            });
            logger.info(`Suscripcion activada via webhook para negocio ${externalReference}`);
          } catch (activateErr) {
            logger.error("Error activando suscripcion", activateErr);
          }
          return NextResponse.json({ ok: true }, { status: 200 });
        }

        logger.warn("Webhook MP ignorado por validación de suscripción", {
          paymentId,
          businessId: externalReference,
          reason: subscriptionValidation.reason,
        });
        return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
      }

      logger.warn("Webhook MP ignorado por validación de booking", {
        paymentId,
        bookingId: externalReference,
        reason: paymentValidation.reason,
      });
      return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
    }

    let shouldRunApprovedSideEffects = false;

    if (paymentStatus === "approved") {
      // Conditional on the booking still being "pending_payment": if two deliveries of
      // the same webhook race each other, only the one that actually flips the row wins
      // and gets to send the confirmation email — the other affects 0 rows.
      shouldRunApprovedSideEffects = await updateSupabaseBookingPaymentIfStatus({
        bookingId: externalReference,
        paymentStatus,
        paymentAmount: transactionAmount,
        paymentCurrency: currencyId,
        paymentProvider: "mercadopago",
        paymentExternalId: paymentId,
        expectedCurrentStatus: "pending_payment",
      });
    } else {
      await updateSupabaseBookingPayment({
        bookingId: externalReference,
        paymentStatus,
        paymentAmount: transactionAmount,
        paymentCurrency: currencyId,
        paymentProvider: "mercadopago",
        paymentExternalId: paymentId,
      });
    }

    if (shouldRunApprovedSideEffects) {
      try {
        const slug = await getSupabaseBookingBusinessSlug(externalReference).catch(() => null);

        if (slug) {
          const confirmation = await getBookingConfirmationData({
            slug,
            bookingId: externalReference,
            skipTokenValidation: true,
          });
          if (confirmation) {
            await sendBookingConfirmationEmail(confirmation, "created");
            await sendBookingConfirmationWhatsApp(confirmation);
            if (confirmation.businessNotificationEmail) {
              await sendBusinessNotificationEmail(confirmation, "created");
            }
          }
        }
      } catch (emailErr) {
        logger.error("Error enviando email de confirmacion", emailErr);
      }
    }

    logger.info(`Pago ${paymentId} -> ${paymentStatus} para booking ${externalReference}`);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    logger.error("Error procesando pago", err);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "mercadopago-webhook" }, { status: 200 });
}
