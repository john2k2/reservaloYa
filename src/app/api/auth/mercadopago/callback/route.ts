import { NextResponse } from "next/server";

import { isPocketBaseConfigured } from "@/lib/pocketbase/config";
import { updateLocalBusinessMPTokens } from "@/server/local-store";
import {
  updatePocketBaseBusinessMPTokens,
  getPocketBaseBusinessIdBySlug,
} from "@/server/pocketbase-store";

/**
 * Callback OAuth de MercadoPago.
 * MP redirige aquí con ?code=XXX&state=businessSlug después de que el negocio autoriza.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // = businessSlug

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const errorRedirect = `${appUrl}/admin/onboarding?tab=integraciones&mp=error`;

  if (!code || !state) {
    return NextResponse.redirect(errorRedirect);
  }

  const mpAppId = process.env.MP_APP_ID;
  const mpAppSecret = process.env.MP_APP_SECRET;

  if (!mpAppId || !mpAppSecret) {
    console.error("[MP OAuth] MP_APP_ID o MP_APP_SECRET no configurados");
    return NextResponse.redirect(errorRedirect);
  }

  // Intercambiar code por tokens
  let tokenData: {
    access_token: string;
    refresh_token: string;
    user_id: number;
    expires_in: number;
  };

  try {
    const redirectUri = `${appUrl}/api/auth/mercadopago/callback`;

    const res = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: mpAppId,
        client_secret: mpAppSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("[MP OAuth] Error al intercambiar code por tokens:", errorBody);
      return NextResponse.redirect(errorRedirect);
    }

    tokenData = await res.json() as typeof tokenData;
  } catch (err) {
    console.error("[MP OAuth] Error en token exchange:", err);
    return NextResponse.redirect(errorRedirect);
  }

  const mpTokenExpiresAt = new Date(
    Date.now() + tokenData.expires_in * 1000
  ).toISOString();

  const tokens = {
    mpAccessToken: tokenData.access_token,
    mpRefreshToken: tokenData.refresh_token,
    mpCollectorId: String(tokenData.user_id),
    mpTokenExpiresAt,
  };

  // Guardar tokens en el negocio
  try {
    if (isPocketBaseConfigured()) {
      // En PocketBase mode, state = businessSlug → buscar el ID primero
      const businessId = await getPocketBaseBusinessIdBySlug(state);
      if (!businessId) {
        console.error("[MP OAuth] No se encontró el negocio con slug:", state);
        return NextResponse.redirect(errorRedirect);
      }
      await updatePocketBaseBusinessMPTokens({ businessId, ...tokens });
    } else {
      // En local mode, state = businessSlug
      await updateLocalBusinessMPTokens({ businessSlug: state, ...tokens });
    }
  } catch (err) {
    console.error("[MP OAuth] Error guardando tokens:", err);
    return NextResponse.redirect(errorRedirect);
  }

  console.log(`[MP OAuth] Tokens guardados para negocio: ${state}`);

  return NextResponse.redirect(
    `${appUrl}/admin/onboarding?tab=integraciones&mp=connected`
  );
}
