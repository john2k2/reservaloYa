import { NextResponse } from "next/server";

import { getAuthenticatedSupabaseUser } from "@/server/supabase-auth";
import { getSupabaseAdminClient } from "@/server/supabase-store/_core";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthenticatedSupabaseUser();

    if (!user) {
      return NextResponse.json({
        loggedIn: false,
        isPlatformAdmin: false,
        displayName: "",
        subscriptionExpired: false,
      });
    }

    const superadminEmail = (env.PLATFORM_SUPERADMIN_EMAIL ?? "").toLowerCase();
    const email = String(user.email ?? "").toLowerCase();
    const isPlatformAdmin = superadminEmail ? email === superadminEmail : false;

    if (isPlatformAdmin) {
      return NextResponse.json({
        loggedIn: true,
        isPlatformAdmin: true,
        displayName: "Admin",
        subscriptionExpired: false,
      });
    }

    let displayName = String(user.name ?? user.email ?? "Usuario");

    if (user.businessId) {
      try {
        const client = await getSupabaseAdminClient();
        const { data } = await client
          .from("businesses")
          .select("name")
          .eq("id", user.businessId)
          .single();
        if (data?.name) displayName = data.name;
      } catch {
        // fallback to user name
      }
    }

    return NextResponse.json({
      loggedIn: true,
      isPlatformAdmin: false,
      displayName,
      subscriptionExpired: false,
    });
  } catch {
    return NextResponse.json({
      loggedIn: false,
      isPlatformAdmin: false,
      displayName: "",
      subscriptionExpired: false,
    });
  }
}
