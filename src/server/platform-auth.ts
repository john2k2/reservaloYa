import { getAuthenticatedPocketBaseUser } from "@/server/pocketbase-auth";

export async function getAuthenticatedPlatformAdmin() {
  const superadminEmail = process.env.PLATFORM_SUPERADMIN_EMAIL;
  if (!superadminEmail) return null;

  const user = await getAuthenticatedPocketBaseUser();
  if (!user) return null;

  const email = String(user.email ?? "").toLowerCase().trim();
  if (email !== superadminEmail.toLowerCase().trim()) return null;

  return user;
}
