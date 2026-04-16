import { NextResponse } from "next/server";

import { isPocketBaseConfigured } from "@/lib/pocketbase/config";
import {
  getMPPaymentInfo,
  isValidMPWebhookSignature,
  mapMPStatusToPaymentStatus,
  type MPWebhookPayload,
  shouldVerifyMPWebhookSignature,
} from "@/server/mercadopago";
import {
  getLocalBusinessPaymentSettingsByCollectorId,
  getLocalBookingPaymentValidationContext,
  getLocalBookingBusinessSlug,
  updateLocalBookingPayment,
  updateLocalBusinessMPTokens,
} from "@/server/local-store";
import { getUsableBusinessMercadoPagoAccessToken } from "@/server/mercadopago-business-auth";
import {
  getBusinessSubscription,
  getPocketBaseBookingPaymentValidationContext,
  getPocketBaseBookingBusinessSlug,
  getPocketBaseBusinessPaymentSettingsByCollectorId,
  updatePocketBaseBookingPayment,
  updatePocketBaseBusinessMPTokens,
} from "@/server/pocketbase-store";
import { createLogger } from "@/server/logger";
import { sendBookingConfirmationEmail } from "@/server/booking-notifications";
import { getBookingConfirmationData } from "@/server/queries/public";

const logger = createLogger("MP Webhook");

function amountsMatch(expectedAmount: number | undefined, actualAmount: number) {
  if (expectedAmount == null) {
    return false;
  }

  return Math.abs(expectedAmount - actualAmount) < 0.01;
}

function canApplyBookingPayment(input: {
  booking:
    | Awaited<ReturnType<typeof getLocalBookingPaymentValidationContext>>
    | Awaited<ReturnType<typeof getPocketBaseBookingPaymentValidationContext>>;
  collectorId?: string | null;
  paymentInfo: Awaited<ReturnType<typeof getMPPaymentInfo>>;
  paymentStatus: ReturnType<typeof mapMPStatusToPaymentStatus>;
  businessPaymentSettings:
    | Awaited<ReturnType<typeof getLocalBusinessPaymentSettingsByCollectorId>>
    | Awaited<ReturnType<typeof getPocketBaseBusinessPaymentSettingsByCollectorId>>
    | null;
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

  if (
    paymentInfo.metadata?.bookingId &&
    paymentInfo.metadata.bookingId !== booking.bookingId
  ) {
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

/**
 * Webhook de MercadoPago: se llama cuando hay cambios en un pago.
 * Docs: https://www.mercadopago.com.ar/developers/es/docs/notifications/webhooks
 *
 * Maneja dos tipos de pagos:
 * 1. Pagos de bookings (external_reference = bookingId)
 * 2. Pagos de suscripciones (external_reference = businessId)
 *
 * MP puede enviar el mismo evento mas de una vez, por eso el handler es idempotente.
 * Responde 401 si la firma configurada no valida.
 * Responde 500 ante errores de infraestructura para que MP reintente el evento.
 * Responde 200 en todos los casos donde el evento fue procesado (exito, rechazo, skip).
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const body = (await request.json().catch(() => null)) as MPWebhookPayload | null;
  const isPocketBase = isPocketBaseConfigured();

  const isPaymentEvent =
    body?.type === "payment" ||
    body?.action === "payment.created" ||
    body?.action === "payment.updated" ||
    url.searchParams.get("type") === "payment";

  if (!isPaymentEvent) {
    return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
  }

  const paymentId =
    (body?.data?.id ? String(body.data.id) : null) ??
    (body?.id ? String(body.id) : null) ??
    url.searchParams.get("data.id") ??
    url.searchParams.get("id");

  if (!paymentId) {
    logger.warn("Sin payment ID en el payload", body);
    return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
  }

  if (!shouldVerifyMPWebhookSignature()) {
    const isRealDeployment = isPocketBase || process.env.NODE_ENV === "production";
    if (isRealDeployment) {
      logger.error("MP_WEBHOOK_SECRET no configurado en deployment real: rechazando webhook");
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
      (body?.user_id != null ? String(body.user_id) : null) ?? url.searchParams.get("user_id");

    let businessPaymentSettings = collectorIdFromRequest
      ? isPocketBase
        ? await getPocketBaseBusinessPaymentSettingsByCollectorId(collectorIdFromRequest)
        : await getLocalBusinessPaymentSettingsByCollectorId(collectorIdFromRequest)
      : null;

    const initialBusinessPaymentSettings = businessPaymentSettings;

    const businessAccessToken = initialBusinessPaymentSettings
      ? await getUsableBusinessMercadoPagoAccessToken(
          initialBusinessPaymentSettings,
          async (tokens) => {
            if (isPocketBase) {
              await updatePocketBaseBusinessMPTokens({
                businessId: initialBusinessPaymentSettings.businessId,
                ...tokens,
              });
              return;
            }

            await updateLocalBusinessMPTokens({
              businessSlug: initialBusinessPaymentSettings.businessSlug,
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
      businessPaymentSettings = isPocketBase
        ? await getPocketBaseBusinessPaymentSettingsByCollectorId(resolvedCollectorId)
        : await getLocalBusinessPaymentSettingsByCollectorId(resolvedCollectorId);
    }

    if (!externalReference) {
      logger.warn("Pago sin external_reference", paymentId);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const paymentStatus = mapMPStatusToPaymentStatus(status);

    const subscription = isPocketBase ? await getBusinessSubscription(externalReference) : null;

    if (subscription) {
      logger.info(
        `Procesando pago de suscripcion ${paymentId} -> ${paymentStatus} para business ${externalReference}`
      );

      if (paymentStatus === "approved") {
        const nextBillingDate = new Date();
        nextBillingDate.setDate(nextBillingDate.getDate() + 30);

        await subscription.update({
          status: "active",
          trialEndsAt: null,
          nextBillingDate: nextBillingDate.toISOString().split("T")[0],
        });

        logger.info(`Suscripcion ${subscription.id} activada para business ${externalReference}`);
      } else if (paymentStatus === "rejected" || paymentStatus === "cancelled") {
        logger.info(`Pago rechazado/cancelado para suscripcion ${subscription.id}`);
      }

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const bookingValidation = isPocketBase
      ? await getPocketBaseBookingPaymentValidationContext(externalReference)
      : await getLocalBookingPaymentValidationContext(externalReference);

    const paymentValidation = canApplyBookingPayment({
      booking: bookingValidation,
      collectorId: resolvedCollectorId,
      paymentInfo,
      paymentStatus,
      businessPaymentSettings,
    });

    if (!paymentValidation.ok) {
      logger.warn("Webhook MP ignorado por validación de booking", {
        paymentId,
        bookingId: externalReference,
        reason: paymentValidation.reason,
      });
      return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
    }

    const paymentData = {
      bookingId: externalReference,
      paymentStatus,
      paymentAmount: transactionAmount,
      paymentCurrency: currencyId,
      paymentProvider: "mercadopago" as const,
      paymentExternalId: paymentId,
    };

    if (isPocketBase) {
      await updatePocketBaseBookingPayment(paymentData);
    } else {
      await updateLocalBookingPayment(paymentData);
    }

    if (paymentStatus === "approved") {
      try {
        const slug = isPocketBase
          ? await getPocketBaseBookingBusinessSlug(externalReference).catch(() => null)
          : await getLocalBookingBusinessSlug(externalReference).catch(() => null);

        if (slug) {
          const confirmation = await getBookingConfirmationData({
            slug,
            bookingId: externalReference,
            skipTokenValidation: true,
          });
          if (confirmation) {
            await sendBookingConfirmationEmail(confirmation, "created");
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
