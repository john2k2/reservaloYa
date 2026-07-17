import { CustomerPortal } from "@polar-sh/nextjs";
import { NextRequest, NextResponse } from "next/server";

import { getPublicAppUrl } from "@/lib/runtime";
import {
  getPolarAccessToken,
  getPolarReturnUrl,
  getPolarServer,
  isPolarConfigured,
} from "@/server/polar-config";
import { getAuthenticatedSupabaseUser } from "@/server/supabase-auth";

export async function GET(req: NextRequest) {
  if (!isPolarConfigured()) {
    return NextResponse.redirect(
      new URL("/admin/billing?error=polar_not_configured", getPublicAppUrl())
    );
  }

  const accessToken = getPolarAccessToken();
  if (!accessToken) {
    return NextResponse.redirect(
      new URL("/admin/billing?error=polar_not_configured", getPublicAppUrl())
    );
  }

  const user = await getAuthenticatedSupabaseUser();
  if (!user?.businessId) {
    return NextResponse.redirect(new URL("/login", getPublicAppUrl()));
  }

  const portal = CustomerPortal({
    accessToken,
    server: getPolarServer(),
    returnUrl: getPolarReturnUrl(),
    getExternalCustomerId: async () => user.businessId!,
  });

  return portal(req);
}
