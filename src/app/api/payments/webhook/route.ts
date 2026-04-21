import { NextResponse } from "next/server";

import {
  getMPPaymentInfo,
  isValidMPWebhookSignature,
  mapMPStatusToPaymentStatus,
  type MPWebhookPayload,
  shouldVerifyMPWebhookSignature,
} from "@/server/mercadopago";
import { getUsableBusinessMercadoPagoAccessToken } from "@/server/mercadopago-business-auth";
import {
  getSupabaseBusinessPaymentSettingsByCollectorId,
  getSupabaseBookingPaymentValidationContext,
  getSupabaseBookingBusinessSlug,
  updateSupabaseBookingPayment,
  updateSupabaseBusinessMPTokens,
} from "@/server/supabase-store";
import { createLogger } from "@/server/logger";
import { sendBookingConfirmationEmail } from "@/server/booking-notifications";
import { getBookingConfirmationData } from "@/server/queries/public";
import type { BookingPaymentValidationContext } from "@/server/payments-domain";

const logger = createLogger("MP Webhook");

function amountsMatch(expectedAmount: number | undefined, actualAmount: number) {
  if (expectedAmount == null) return false;
  return Math.abs(expectedAmount - actualAmount) < 0.01;
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
      (body?.user_id != null ? String(body.user_id) : null) ?? url.searchParams.get("user_id");

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

    const bookingValidation = await getSupabaseBookingPaymentValidationContext(externalReference);

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

    await updateSupabaseBookingPayment({
      bookingId: externalReference,
      paymentStatus,
      paymentAmount: transactionAmount,
      paymentCurrency: currencyId,
      paymentProvider: "mercadopago",
      paymentExternalId: paymentId,
    });

    if (paymentStatus === "approved") {
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
