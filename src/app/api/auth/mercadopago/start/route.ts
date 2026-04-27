import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { getPublicAppUrl } from "@/lib/runtime";
import { getAdminShellData } from "@/server/queries/admin";
import { createMercadoPagoOAuthState } from "@/server/mercadopago-oauth-state";

const MP_OAUTH_NONCE_COOKIE = "reservaya-mp-oauth-nonce";

export async function GET() {
  const appUrl = getPublicAppUrl();
  const errorRedirect = `${appUrl}/admin/onboarding?tab=integraciones&mp=error`;
  const mpAppId = process.env.MP_APP_ID?.trim();
  const mpAppSecret = process.env.MP_APP_SECRET?.trim();
  const shellData = await getAdminShellData();

  if (!shellData?.businessSlug || !shellData.userEmail || !mpAppId || !mpAppSecret) {
    return NextResponse.redirect(errorRedirect);
  }

  const redirectUri = `${appUrl}/api/auth/mercadopago/callback`;
  const nonce = randomUUID();
  const state = createMercadoPagoOAuthState({
    businessSlug: shellData.businessSlug,
    businessId: shellData.businessId,
    userEmail: shellData.userEmail,
    nonce,
  });

  const mpOAuthUrl =
    `https://auth.mercadopago.com/authorization?client_id=${mpAppId}` +
    `&response_type=code&platform_id=mp&state=${encodeURIComponent(state)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`;

  const response = NextResponse.redirect(mpOAuthUrl);
  response.cookies.set(MP_OAUTH_NONCE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: appUrl.startsWith("https://"),
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
