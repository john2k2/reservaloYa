import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

import { createPocketBaseServerClient, refreshPocketBaseAuth } from "@/lib/pocketbase/server";
import { getBlueDollarRate } from "@/lib/dollar-rate";

export const dynamic = "force-dynamic";

const USD_PRICE = 17;

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
    redirect("/login");
  }

  const blueRate = await getBlueDollarRate();
  const arsPrice = blueRate ? USD_PRICE * blueRate : USD_PRICE * 1435;

  const mpAccessToken = process.env.MP_ACCESS_TOKEN;
  
  if (!mpAccessToken) {
    console.error("[MP Payment] MP_ACCESS_TOKEN no configurado");
    return NextResponse.redirect(`${appUrl}/admin/subscription/pay?error=mp_not_configured`);
  }

  try {
    const body = {
      items: [
        {
          title: "ReservaYa - Suscripción mensual",
          description: "Acceso al panel de gestión de turnos",
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
      console.error("[MP Payment] Error creando preferencia:", errorBody);
      return NextResponse.redirect(`${appUrl}/admin/subscription/pay?error=preference_failed`);
    }

    const preference = await res.json();
    
    if (preference.init_point) {
      return NextResponse.redirect(preference.init_point);
    }
    
    return NextResponse.redirect(`${appUrl}/admin/subscription/pay?error=no_init_point`);
  } catch (err) {
    console.error("[MP Payment] Error:", err);
    return NextResponse.redirect(`${appUrl}/admin/subscription/pay?error=unknown`);
  }
}
