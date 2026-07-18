import { Checkout } from "@polar-sh/nextjs";
import { NextRequest, NextResponse } from "next/server";

import { getPublicAppUrl } from "@/lib/runtime";
import {
  getPolarAccessToken,
  getPolarProductId,
  getPolarReturnUrl,
  getPolarServer,
  getPolarSuccessUrl,
  isPolarConfigured,
} from "@/server/polar-config";
import { getAuthenticatedSupabaseUser } from "@/server/supabase-auth";

function payErrorRedirect(error: string) {
  return NextResponse.redirect(
    new URL(`/admin/subscription/pay?error=${encodeURIComponent(error)}`, getPublicAppUrl())
  );
}

/** Polar rechaza TLDs reservados (.local, .test, etc.). */
function isPolarCustomerEmail(email: string | null | undefined): email is string {
  if (!email?.includes("@")) return false;
  return !/\.(local|test|example|invalid)$/i.test(email);
}

export async function GET(req: NextRequest) {
  if (!isPolarConfigured()) {
    return payErrorRedirect("polar_not_configured");
  }

  const user = await getAuthenticatedSupabaseUser();
  if (!user?.businessId) {
    return NextResponse.redirect(new URL("/login", getPublicAppUrl()));
  }

  const productId = getPolarProductId();
  const accessToken = getPolarAccessToken();
  if (!productId || !accessToken) {
    return payErrorRedirect("polar_not_configured");
  }

  const url = new URL(req.url);
  url.searchParams.set("products", productId);
  url.searchParams.set("customerExternalId", user.businessId);
  if (isPolarCustomerEmail(user.email)) {
    url.searchParams.set("customerEmail", user.email);
  }
  if (user.name) {
    url.searchParams.set("customerName", user.name);
  }
  // No encodeURIComponent: searchParams.set encodea; Polar hace JSON.parse del valor ya decodificado.
  url.searchParams.set("metadata", JSON.stringify({ businessId: user.businessId }));

  const checkout = Checkout({
    accessToken,
    successUrl: getPolarSuccessUrl(),
    returnUrl: getPolarReturnUrl(),
    server: getPolarServer(),
  });

  return checkout(new NextRequest(url, req));
}
