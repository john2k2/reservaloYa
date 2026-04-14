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
  getLocalBookingBusinessSlug,
  updateLocalBookingPayment,
  updateLocalBusinessMPTokens,
} from "@/server/local-store";
import { getUsableBusinessMercadoPagoAccessToken } from "@/server/mercadopago-business-auth";
import {
  getBusinessSubscription,
  getPocketBaseBookingBusinessSlug,
  getPocketBaseBusinessPaymentSettingsByCollectorId,
  updatePocketBaseBookingPayment,
  updatePocketBaseBusinessMPTokens,
} from "@/server/pocketbase-store";
import { createLogger } from "@/server/logger";
import { sendBookingConfirmationEmail } from "@/server/booking-notifications";
import { getBookingConfirmationData } from "@/server/queries/public";

const logger = createLogger("MP Webhook");

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
    const collectorId =
      (body?.user_id != null ? String(body.user_id) : null) ?? url.searchParams.get("user_id");

    const businessPaymentSettings = collectorId
      ? isPocketBase
        ? await getPocketBaseBusinessPaymentSettingsByCollectorId(collectorId)
        : await getLocalBusinessPaymentSettingsByCollectorId(collectorId)
      : null;

    const businessAccessToken = businessPaymentSettings
      ? await getUsableBusinessMercadoPagoAccessToken(
          businessPaymentSettings,
          async (tokens) => {
            if (isPocketBase) {
              await updatePocketBaseBusinessMPTokens({
                businessId: businessPaymentSettings.businessId,
                ...tokens,
              });
              return;
            }

            await updateLocalBusinessMPTokens({
              businessSlug: businessPaymentSettings.businessSlug,
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
          const confirmation = await getBookingConfirmationData({ slug, bookingId: externalReference });
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
