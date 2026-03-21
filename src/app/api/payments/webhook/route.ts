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
  updateLocalBookingPayment,
  getLocalBookingBusinessSlug,
} from "@/server/local-store";
import {
  updatePocketBaseBookingPayment,
  getPocketBaseBookingBusinessSlug,
  getBusinessSubscription,
} from "@/server/pocketbase-store";
import { sendBookingConfirmationEmail } from "@/server/booking-notifications";
import { getBookingConfirmationData } from "@/server/queries/public";

/**
 * Webhook de MercadoPago — se llama cuando hay cambios en un pago.
 * Docs: https://www.mercadopago.com.ar/developers/es/docs/notifications/webhooks
 *
 * Maneja dos tipos de pagos:
 * 1. Pagos de bookings (external_reference = bookingId)
 * 2. Pagos de suscripciones (external_reference = businessId)
 *
 * MP puede enviar el mismo evento más de una vez → el handler es idempotente.
 * Responde 401 si la firma configurada no valida; errores internos se loguean y responden 200.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const body = (await request.json().catch(() => null)) as MPWebhookPayload | null;

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
    console.warn("[MP Webhook] Sin payment ID en el payload:", body);
    return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
  }

  if (
    shouldVerifyMPWebhookSignature() &&
    !isValidMPWebhookSignature({
      paymentId,
      requestId: request.headers.get("x-request-id"),
      signatureHeader: request.headers.get("x-signature"),
    })
  ) {
    console.warn("[MP Webhook] Firma inválida o incompleta para payment ID:", paymentId);
    return NextResponse.json({ ok: false, error: "Invalid webhook signature" }, { status: 401 });
  }

  try {
    const paymentInfo = await getMPPaymentInfo(paymentId);

    if (!paymentInfo) {
      console.warn("[MP Webhook] No se pudo obtener info del pago:", paymentId);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const { externalReference, status, transactionAmount, currencyId } = paymentInfo;

    if (!externalReference) {
      console.warn("[MP Webhook] Pago sin external_reference:", paymentId);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const paymentStatus = mapMPStatusToPaymentStatus(status);

    // Check if this is a subscription payment (businessId) or booking payment
    const subscription = await getBusinessSubscription(externalReference);

    if (subscription) {
      // This is a subscription payment
      console.log(`[MP Webhook] Procesando pago de suscripción ${paymentId} → ${paymentStatus} para business ${externalReference}`);

      if (paymentStatus === "approved") {
        const nextBillingDate = new Date();
        nextBillingDate.setDate(nextBillingDate.getDate() + 30);

        await subscription.update({
          status: "active",
          trialEndsAt: null,
          nextBillingDate: nextBillingDate.toISOString().split("T")[0],
        });

        console.log(`[MP Webhook] Suscripción ${subscription.id} activada para business ${externalReference}`);
      } else if (paymentStatus === "rejected" || paymentStatus === "cancelled") {
        // Keep trial or suspend - don't change status on rejection
        console.log(`[MP Webhook] Pago rechazado/cancelado para suscripción ${subscription.id}`);
      }

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // This is a booking payment (original logic)
    const paymentData = {
      bookingId: externalReference,
      paymentStatus,
      paymentAmount: transactionAmount,
      paymentCurrency: currencyId,
      paymentProvider: "mercadopago" as const,
      paymentExternalId: paymentId,
    };

    if (isPocketBaseConfigured()) {
      await updatePocketBaseBookingPayment(paymentData);
    } else {
      await updateLocalBookingPayment(paymentData);
    }

    if (paymentStatus === "approved") {
      try {
        const slug = isPocketBaseConfigured()
          ? await getPocketBaseBookingBusinessSlug(externalReference).catch(() => null)
          : await getLocalBookingBusinessSlug(externalReference).catch(() => null);

        if (slug) {
          const confirmation = await getBookingConfirmationData({ slug, bookingId: externalReference });
          if (confirmation) {
            await sendBookingConfirmationEmail(confirmation, "created");
          }
        }
      } catch (emailErr) {
        console.error("[MP Webhook] Error enviando email de confirmación:", emailErr);
      }
    }

    console.log(
      `[MP Webhook] Pago ${paymentId} → ${paymentStatus} para booking ${externalReference}`
    );
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[MP Webhook] Error procesando pago:", err);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "mercadopago-webhook" }, { status: 200 });
}
