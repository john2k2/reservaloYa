import { unstable_noStore as noStore } from "next/cache";

import { isDemoBusiness } from "@/constants/demo";
import { createAdminClient } from "@/lib/supabase/server";
import { resolvePaginationRange } from "./data";
import type { PaginationOptions, PlatformUserRow } from "./types";

export async function getPlatformUsersList(pagination?: PaginationOptions): Promise<PlatformUserRow[] | null> {
  noStore();

  const client = createAdminClient();
  const { from, to } = resolvePaginationRange(pagination);

  const [appUsersRes, businessesRes, authUsersRes] = await Promise.all([
    client.from("app_users").select("*").order("created", { ascending: false }).range(from, to),
    client.from("businesses").select("id, name, slug").limit(1000),
    client.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const appUsers = appUsersRes.data ?? [];
  const businesses = businessesRes.data ?? [];
  const authUsers = authUsersRes.data?.users ?? [];

  const businessMap = new Map(businesses.map((b) => [b.id, b]));
  const emailMap = new Map(authUsers.map((u) => [u.id, u.email ?? ""]));

  return appUsers
    .filter((u) => u.role !== "public_app")
    .map((u) => {
      const biz = u.business_id ? businessMap.get(u.business_id) : null;
      return {
        id: u.id,
        name: String(u.name ?? emailMap.get(u.id) ?? "—"),
        email: emailMap.get(u.id) ?? "—",
        businessId: String(u.business_id ?? ""),
        businessName: biz?.name ?? "—",
        businessSlug: biz?.slug ?? "—",
        role: String(u.role ?? "staff"),
        active: u.active !== false,
        verified: true,
        createdAt: u.created as string,
      };
    })
    .filter((u) => !u.businessSlug || !isDemoBusiness(u.businessSlug));
}

export async function togglePlatformUserActive(userId: string, active: boolean) {
  const client = createAdminClient();
  const { error } = await client
    .from("app_users")
    .update({ active, updated: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw new Error(`No se pudo actualizar el usuario: ${error.message}`);

  // Ban/unban en Auth para que no pueda iniciar sesión si está inactivo.
  const { error: authError } = active
    ? await client.auth.admin.updateUserById(userId, { ban_duration: "none" })
    : await client.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
  if (authError) {
    throw new Error(`Usuario actualizado en app, pero Auth falló: ${authError.message}`);
  }
}
