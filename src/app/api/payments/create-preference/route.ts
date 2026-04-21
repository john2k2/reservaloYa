import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

import { getBlueDollarRate } from "@/lib/dollar-rate";
import { createLogger } from "@/server/logger";
import { getSubscriptionArsPrice } from "@/server/payments-domain";
import { createSubscriptionPreference, isMercadoPagoConfigured } from "@/server/mercadopago";
import { getAuthenticatedSupabaseUser } from "@/server/supabase-auth";

export const dynamic = "force-dynamic";

const logger = createLogger("MP Payment");

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const user = await getAuthenticatedSupabaseUser();

  if (!user?.businessId) {
    redirect("/admin/login");
  }

  if (!isMercadoPagoConfigured()) {
    logger.error("MP_ACCESS_TOKEN no configurado");
    return NextResponse.redirect(`${appUrl}/admin/subscription/pay?error=mp_not_configured`);
  }

  const blueRate = await getBlueDollarRate();
  const arsPrice = getSubscriptionArsPrice(blueRate);

  const result = await createSubscriptionPreference({
    businessId: user.businessId,
    priceAmount: arsPrice,
  });

  if (!result.ok) {
    logger.error("Error creando preferencia de suscripcion", result.error);
    return NextResponse.redirect(`${appUrl}/admin/subscription/pay?error=preference_failed`);
  }

  return NextResponse.redirect(result.checkoutUrl);
}
