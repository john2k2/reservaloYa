import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

import { createPocketBaseServerClient, refreshPocketBaseAuth } from "@/lib/pocketbase/server";
import { getBlueDollarRate } from "@/lib/dollar-rate";
import { createLogger } from "@/server/logger";

export const dynamic = "force-dynamic";

const USD_PRICE = 17;
const FALLBACK_ARS_RATE = 1435;
const logger = createLogger("MP Payment");

async function getBusinessIdFromSession(): Promise<string | null> {
  const pb = await createPocketBaseServerClient();
  const refreshed = await refreshPocketBaseAuth(pb);

  if (!refreshed || !pb.authStore.record) {
    return null;
  }

  const businessId = Array.isArray(pb.authStore.record.business)
    ? pb.authStore.record.business[0]
    : pb.authStore.record.business;

  return businessId as string | null;
}

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const businessId = await getBusinessIdFromSession();

  if (!businessId) {
    redirect("/admin/login");
  }

  const blueRate = await getBlueDollarRate();
  const arsPrice = blueRate ? USD_PRICE * blueRate : USD_PRICE * FALLBACK_ARS_RATE;

  const mpAccessToken = process.env.MP_ACCESS_TOKEN?.trim();

  if (!mpAccessToken) {
    logger.error("MP_ACCESS_TOKEN no configurado");
    return NextResponse.redirect(`${appUrl}/admin/subscription/pay?error=mp_not_configured`);
  }

  try {
    const body = {
      items: [
        {
          title: "ReservaYa - Suscripcion mensual",
          description: "Acceso al panel de gestion de turnos",
          quantity: 1,
          unit_price: arsPrice,
          currency_id: "ARS",
        },
      ],
      back_urls: {
        success: `${appUrl}/admin/subscription/success`,
        failure: `${appUrl}/admin/subscription/pay?error=payment_failed`,
        pending: `${appUrl}/admin/subscription/pay?error=payment_pending`,
      },
      external_reference: businessId,
      notification_url: `${appUrl}/api/payments/webhook`,
    };

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mpAccessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      logger.error("Error creando preferencia", errorBody);
      return NextResponse.redirect(`${appUrl}/admin/subscription/pay?error=preference_failed`);
    }

    const preference = (await res.json()) as { init_point?: string };

    if (preference.init_point) {
      return NextResponse.redirect(preference.init_point);
    }

    return NextResponse.redirect(`${appUrl}/admin/subscription/pay?error=no_init_point`);
  } catch (err) {
    logger.error("Error creando preferencia", err);
    return NextResponse.redirect(`${appUrl}/admin/subscription/pay?error=unknown`);
  }
}
