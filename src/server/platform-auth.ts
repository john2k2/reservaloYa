import { getAuthenticatedSupabaseUser } from "@/server/supabase-auth";

export async function getAuthenticatedPlatformAdmin() {
  const superadminEmail = process.env.PLATFORM_SUPERADMIN_EMAIL;
  if (!superadminEmail) return null;

  const user = await getAuthenticatedSupabaseUser();
  if (!user) return null;

  const email = String(user.email ?? "").toLowerCase().trim();
  if (email !== superadminEmail.toLowerCase().trim()) return null;

  return user;
}
