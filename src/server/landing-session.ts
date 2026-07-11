import { env } from "@/lib/env";
import { getAuthenticatedSupabaseUser } from "@/server/supabase-auth";
import { getSupabaseAdminClient } from "@/server/supabase-store/_core";

export type LandingHeaderSession = {
  loggedIn: boolean;
  isPlatformAdmin: boolean;
  displayName: string;
};

const GUEST_SESSION: LandingHeaderSession = {
  loggedIn: false,
  isPlatformAdmin: false,
  displayName: "",
};

export async function getLandingHeaderSession(): Promise<LandingHeaderSession> {
  try {
    const user = await getAuthenticatedSupabaseUser();

    if (!user) {
      return GUEST_SESSION;
    }

    const superadminEmail = (env.PLATFORM_SUPERADMIN_EMAIL ?? "").toLowerCase();
    const email = String(user.email ?? "").toLowerCase();
    const isPlatformAdmin = superadminEmail ? email === superadminEmail : false;

    if (isPlatformAdmin) {
      return {
        loggedIn: true,
        isPlatformAdmin: true,
        displayName: "Admin",
      };
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

    return {
      loggedIn: true,
      isPlatformAdmin: false,
      displayName,
    };
  } catch {
    return GUEST_SESSION;
  }
}
