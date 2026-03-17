import { NextResponse } from "next/server";

import { isPocketBaseConfigured } from "@/lib/pocketbase/config";
import {
  getMPPaymentInfo,
  mapMPStatusToPaymentStatus,
  type MPWebhookPayload,
} from "@/server/mercadopago";
import {
  updateLocalBookingPayment,
  getLocalBookingBusinessSlug,
} from "@/server/local-store";
import {
  updatePocketBaseBookingPayment,
  getPocketBaseBookingBusinessSlug,
} from "@/server/pocketbase-store";
import { sendBookingConfirmationEmail } from "@/server/booking-notifications";
import { getBookingConfirmationData } from "@/server/queries/public";

/**
 * Webhook de MercadoPago — se llama cuando hay cambios en un pago.
 * Docs: https://www.mercadopago.com.ar/developers/es/docs/notifications/webhooks
 *
 * MP puede enviar el mismo evento más de una vez → el handler es idempotente.
 * Siempre responde 200 para que MP no reintente; errores internos se loguean.
 */
export async function POST(request: Request) {
  let body: MPWebhookPayload;

  try {
    body = (await request.json()) as MPWebhookPayload;
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const isPaymentEvent =
    body.type === "payment" ||
    body.action === "payment.created" ||
    body.action === "payment.updated";

  if (!isPaymentEvent) {
    return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
  }

  const paymentId =
    (body.data?.id ? String(body.data.id) : null) ??
    (body.id ? String(body.id) : null);

  if (!paymentId) {
    console.warn("[MP Webhook] Sin payment ID en el payload:", body);
    return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
  }

  try {
    const paymentInfo = await getMPPaymentInfo(paymentId);

    if (!paymentInfo) {
      console.warn("[MP Webhook] No se pudo obtener info del pago:", paymentId);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const { externalReference: bookingId, status, transactionAmount, currencyId } = paymentInfo;

    if (!bookingId) {
      console.warn("[MP Webhook] Pago sin external_reference (bookingId):", paymentId);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const paymentStatus = mapMPStatusToPaymentStatus(status);

    const paymentData = {
      bookingId,
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
          ? await getPocketBaseBookingBusinessSlug(bookingId).catch(() => null)
          : await getLocalBookingBusinessSlug(bookingId).catch(() => null);

        if (slug) {
          const confirmation = await getBookingConfirmationData({ slug, bookingId });
          if (confirmation) {
            await sendBookingConfirmationEmail(confirmation, "created");
          }
        }
      } catch (emailErr) {
        console.error("[MP Webhook] Error enviando email de confirmación:", emailErr);
      }
    }

    console.log(
      `[MP Webhook] Pago ${paymentId} → ${paymentStatus} para booking ${bookingId}`
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
