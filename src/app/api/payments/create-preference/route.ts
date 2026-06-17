import { NextResponse } from "next/server";

import { getBlueDollarRate } from "@/lib/dollar-rate";
import { CSRF_TOKEN_HEADER, validateCsrfToken } from "@/lib/csrf";
import { createLogger } from "@/server/logger";
import { getSubscriptionArsPrice } from "@/server/payments-domain";
import { createSubscriptionPreference, isMercadoPagoConfigured } from "@/server/mercadopago";
import { getAuthenticatedSupabaseUser } from "@/server/supabase-auth";
import { createSupabaseSubscriptionPaymentAttempt } from "@/server/supabase-store";

export const dynamic = "force-dynamic";

const logger = createLogger("MP Payment");

export async function POST(request: Request) {
  const user = await getAuthenticatedSupabaseUser();

  if (!user?.businessId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const csrfToken = request.headers.get(CSRF_TOKEN_HEADER);

  if (!validateCsrfToken(csrfToken, user.id)) {
    return NextResponse.json({ ok: false, error: "invalid_csrf" }, { status: 403 });
  }

  if (!isMercadoPagoConfigured()) {
    logger.error("MP_ACCESS_TOKEN no configurado");
    return NextResponse.json(
      { ok: false, error: "mp_not_configured" },
      { status: 503 }
    );
  }

  const blueRate = await getBlueDollarRate();
  const arsPrice = getSubscriptionArsPrice(blueRate);

  const result = await createSubscriptionPreference({
    businessId: user.businessId,
    priceAmount: arsPrice,
  });

  if (!result.ok) {
    logger.error("Error creando preferencia de suscripcion", result.error);
    return NextResponse.json(
      { ok: false, error: "preference_failed" },
      { status: 500 }
    );
  }

  try {
    await createSupabaseSubscriptionPaymentAttempt({
      businessId: user.businessId,
      preferenceId: result.preferenceId,
      amountArs: arsPrice,
      currency: "ARS",
      blueRate,
      status: "pending",
    });
  } catch (err) {
    logger.error("Error registrando intento de pago de suscripcion", err);
    return NextResponse.json(
      { ok: false, error: "attempt_failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    checkoutUrl: result.checkoutUrl,
  });
}
