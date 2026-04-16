import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isPocketBaseConfigured } from "@/lib/pocketbase/config";
import { updateLocalBusinessMPTokens } from "@/server/local-store";
import { createLogger } from "@/server/logger";
import { parseMercadoPagoOAuthState } from "@/server/mercadopago-oauth-state";
import { getAdminShellData } from "@/server/queries/admin";
import {
  getPocketBaseBusinessIdBySlug,
  updatePocketBaseBusinessMPTokens,
} from "@/server/pocketbase-store";

const logger = createLogger("MP OAuth");
const MP_OAUTH_NONCE_COOKIE = "reservaya-mp-oauth-nonce";

function withClearedOAuthNonceCookie(response: NextResponse) {
  response.cookies.set(MP_OAUTH_NONCE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").startsWith("https://"),
    path: "/",
    maxAge: 0,
  });

  return response;
}

/**
 * Callback OAuth de MercadoPago.
 * MercadoPago redirige aqui con ?code=...&state=...
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const errorRedirect = `${appUrl}/admin/onboarding?tab=integraciones&mp=error`;
  const cookieStore = await cookies();
  const oauthNonce = cookieStore.get(MP_OAUTH_NONCE_COOKIE)?.value ?? null;

  if (!code || !state) {
    return withClearedOAuthNonceCookie(NextResponse.redirect(errorRedirect));
  }

  const mpAppId = process.env.MP_APP_ID?.trim();
  const mpAppSecret = process.env.MP_APP_SECRET?.trim();

  if (!mpAppId || !mpAppSecret) {
    logger.error("MP_APP_ID o MP_APP_SECRET no configurados");
    return withClearedOAuthNonceCookie(NextResponse.redirect(errorRedirect));
  }

  const parsedState = parseMercadoPagoOAuthState(state);

  if (!parsedState) {
    logger.warn("State invalido o vencido");
    return withClearedOAuthNonceCookie(NextResponse.redirect(errorRedirect));
  }

  const shellData = await getAdminShellData();

  if (
    !shellData?.businessSlug ||
    !shellData.userEmail ||
    !oauthNonce ||
    oauthNonce !== parsedState.nonce ||
    shellData.businessSlug !== parsedState.businessSlug ||
    shellData.userEmail !== parsedState.userEmail ||
    (parsedState.businessId && shellData.businessId !== parsedState.businessId)
  ) {
    logger.warn("Callback OAuth rechazado por sesion/nonce invalido");
    return withClearedOAuthNonceCookie(NextResponse.redirect(errorRedirect));
  }

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
      logger.error("Error al intercambiar code por tokens", errorBody);
      return withClearedOAuthNonceCookie(NextResponse.redirect(errorRedirect));
    }

    tokenData = (await res.json()) as typeof tokenData;
  } catch (err) {
    logger.error("Error en token exchange", err);
    return withClearedOAuthNonceCookie(NextResponse.redirect(errorRedirect));
  }

  const tokens = {
    mpAccessToken: tokenData.access_token,
    mpRefreshToken: tokenData.refresh_token,
    mpCollectorId: String(tokenData.user_id),
    mpTokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
  };

  try {
    if (isPocketBaseConfigured()) {
      const businessId =
        parsedState.businessId ?? (await getPocketBaseBusinessIdBySlug(parsedState.businessSlug));

      if (!businessId) {
        logger.error("No se encontro el negocio", parsedState.businessSlug);
        return withClearedOAuthNonceCookie(NextResponse.redirect(errorRedirect));
      }

      await updatePocketBaseBusinessMPTokens({ businessId, ...tokens });
    } else {
      await updateLocalBusinessMPTokens({
        businessSlug: parsedState.businessSlug,
        ...tokens,
      });
    }
  } catch (err) {
    logger.error("Error guardando tokens", err);
    return withClearedOAuthNonceCookie(NextResponse.redirect(errorRedirect));
  }

  logger.info(`Tokens guardados para negocio: ${parsedState.businessSlug}`);

  return withClearedOAuthNonceCookie(
    NextResponse.redirect(`${appUrl}/admin/onboarding?tab=integraciones&mp=connected`)
  );
}
