import { unstable_noStore as noStore } from "next/cache";
import { randomBytes } from "node:crypto";

import { demoPresets } from "@/constants/demo";
import { createAdminClient } from "@/lib/supabase/server";
import { buildImpersonationRedirectTo } from "@/server/platform-impersonation";
import { buildBusinessRow, resolvePaginationRange } from "./data";
import type { PaginationOptions, PlatformBusinessRow } from "./types";

export async function getPlatformBusinessesList(pagination?: PaginationOptions): Promise<PlatformBusinessRow[] | null> {
  noStore();

  const client = createAdminClient();
  const { from, to } = resolvePaginationRange(pagination);

  const demoSlugs = Object.keys(demoPresets);
  const { data: businesses, error: businessesError } = await client
    .from("businesses")
    .select("*")
    .not("slug", "in", `(${demoSlugs.join(",")})`)
    .order("created", { ascending: false })
    .range(from, to);

  if (businessesError || !businesses) {
    return null;
  }

  const liveBusinesses = businesses;
  if (liveBusinesses.length === 0) return [];

  const businessIds = liveBusinesses.map((b) => b.id as string);

  const [appUsersRes, subsRes, servicesRes, availabilityRes, notificationsRes] = await Promise.all([
    client.from("app_users").select("*").in("business_id", businessIds).limit(1000),
    client.from("subscriptions").select("*").in("businessId", businessIds).limit(1000),
    client.from("services").select("id, business_id").in("business_id", businessIds).limit(1000),
    client.from("availability_rules").select("id, business_id, active").in("business_id", businessIds).limit(1000),
    client.from("communication_events").select("id, business_id, created").in("business_id", businessIds).gte("created", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()).limit(1000),
  ]);

  const appUsers = appUsersRes.data ?? [];
  const subscriptions = subsRes.data ?? [];
  const services = servicesRes.data ?? [];
  const availabilityRules = availabilityRes.data ?? [];
  const notifications = notificationsRes.data ?? [];

  const { data: authUsersData } = await client.auth.admin.listUsers({ perPage: 1000 });
  const authUsers = authUsersData?.users ?? [];
  const emailMap = new Map(authUsers.map((u) => [u.id, u.email ?? ""]));

  const ownerMap = new Map<string, { name: string; email: string }>();
  const ownerCountMap = new Map<string, number>();
  for (const user of appUsers) {
    if (user.role === "owner" && user.business_id) {
      ownerCountMap.set(user.business_id, (ownerCountMap.get(user.business_id) ?? 0) + 1);
      const existing = ownerMap.get(user.business_id);
      if (!existing || user.active !== false) {
        ownerMap.set(user.business_id, {
          name: String(user.name ?? emailMap.get(user.id) ?? "—"),
          email: emailMap.get(user.id) ?? "—",
        });
      }
    }
  }

  const subMap = new Map<string, Record<string, unknown>>();
  for (const sub of subscriptions) {
    subMap.set(sub.businessId as string, sub as Record<string, unknown>);
  }

  const serviceCountMap = new Map<string, number>();
  for (const s of services) {
    serviceCountMap.set(s.business_id, (serviceCountMap.get(s.business_id) ?? 0) + 1);
  }

  const availabilityMap = new Map<string, number>();
  for (const r of availabilityRules) {
    if (r.active !== false) {
      availabilityMap.set(r.business_id, (availabilityMap.get(r.business_id) ?? 0) + 1);
    }
  }

  const notifMap = new Map<string, number>();
  for (const n of notifications) {
    notifMap.set(n.business_id, (notifMap.get(n.business_id) ?? 0) + 1);
  }

  return liveBusinesses.map((b) =>
    buildBusinessRow(b, ownerMap, subMap, serviceCountMap, availabilityMap, notifMap, ownerCountMap)
  );
}

export async function togglePlatformBusinessActive(businessId: string, active: boolean) {
  const client = createAdminClient();
  const { error } = await client
    .from("businesses")
    .update({ active, updated: new Date().toISOString() })
    .eq("id", businessId);
  if (error) throw error;
}

/**
 * Deja un solo owner por negocio (el email preferido si existe) y pasa el resto a staff inactivo.
 */
export async function consolidateBusinessOwners(
  businessId: string,
  preferredOwnerEmail?: string
): Promise<{ keptOwnerId: string; demoted: number }> {
  const client = createAdminClient();
  const { data: owners, error } = await client
    .from("app_users")
    .select("id, role, active")
    .eq("business_id", businessId)
    .eq("role", "owner");

  if (error) throw new Error(error.message);
  if (!owners || owners.length <= 1) {
    return { keptOwnerId: owners?.[0]?.id ?? "", demoted: 0 };
  }

  const { data: authUsersData } = await client.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map((authUsersData?.users ?? []).map((u) => [u.id, (u.email ?? "").toLowerCase()]));

  const preferred = preferredOwnerEmail?.toLowerCase().trim();
  const keep =
    owners.find((o) => preferred && emailById.get(o.id) === preferred) ??
    owners.find((o) => o.active !== false) ??
    owners[0];

  let demoted = 0;
  for (const owner of owners) {
    if (owner.id === keep.id) continue;
    const { error: updateError } = await client
      .from("app_users")
      .update({ role: "staff", active: false, updated: new Date().toISOString() })
      .eq("id", owner.id);
    if (updateError) throw new Error(updateError.message);
    await client.auth.admin.updateUserById(owner.id, { ban_duration: "876000h" });
    demoted += 1;
  }

  return { keptOwnerId: keep.id, demoted };
}

export async function enableTrial(businessId: string, days: number): Promise<void> {
  const client = createAdminClient();
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

  const { data: existing } = await client
    .from("subscriptions")
    .select("id")
    .eq("businessId", businessId)
    .single();

  if (existing) {
    const { error } = await client
      .from("subscriptions")
      .update({ status: "trial", trialStartedAt: now.toISOString(), trialEndsAt, lockedAt: null })
      .eq("businessId", businessId);
    if (error) throw new Error(`Error habilitando trial: ${error.message}`);
  } else {
    const { error } = await client
      .from("subscriptions")
      .insert({ businessId, status: "trial", trialStartedAt: now.toISOString(), trialEndsAt });
    if (error) throw new Error(`Error habilitando trial: ${error.message}`);
  }
}

export async function extendTrial(businessId: string, days: number): Promise<void> {
  const client = createAdminClient();

  const { data: sub, error } = await client
    .from("subscriptions")
    .select("trialEndsAt")
    .eq("businessId", businessId)
    .single();

  if (error || !sub) throw new Error("No existe suscripción para este negocio");

  const currentEndsAt = sub.trialEndsAt ? new Date(sub.trialEndsAt) : new Date();
  const newEndsAt = new Date(currentEndsAt.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

  const { error: updateError } = await client
    .from("subscriptions")
    .update({ trialEndsAt: newEndsAt })
    .eq("businessId", businessId);

  if (updateError) throw new Error(`Error extendiendo trial: ${updateError.message}`);
}

export async function cancelSubscription(businessId: string): Promise<void> {
  const client = createAdminClient();

  const { data: sub, error } = await client
    .from("subscriptions")
    .select("lockedAt")
    .eq("businessId", businessId)
    .single();

  if (error || !sub) throw new Error("No existe suscripción para este negocio");

  const { error: updateError } = await client
    .from("subscriptions")
    .update({ status: "cancelled", lockedAt: sub.lockedAt ?? new Date().toISOString() })
    .eq("businessId", businessId);

  if (updateError) throw new Error(`Error cancelando suscripción: ${updateError.message}`);
}

export async function unlockBusinessSubscription(businessId: string): Promise<void> {
  const client = createAdminClient();
  await client
    .from("subscriptions")
    .update({ lockedAt: null })
    .eq("businessId", businessId);
}

/** Activa la suscripción tras comprobar una transferencia bancaria manual. */
export async function markSubscriptionPaid(businessId: string): Promise<void> {
  const { activateSupabaseSubscription } = await import("@/server/supabase-store/subscription");
  await activateSupabaseSubscription(businessId);
}

const IMPERSONATION_TOKEN_TTL_MS = 2 * 60 * 1000;

/**
 * Generates a one-time impersonation magic link and returns an opaque token
 * for it instead of the link itself. The real Supabase magic link (a full
 * auth bypass into the business owner's account) must never reach client JS
 * — it only ever travels server-side, from this function into the DB, and
 * from the redirect route's Location header straight to the browser.
 */
export async function generateImpersonationToken(businessId: string): Promise<string> {
  const client = createAdminClient();

  const { data: appUser } = await client
    .from("app_users")
    .select("id")
    .eq("business_id", businessId)
    .eq("role", "owner")
    .single();

  if (!appUser) throw new Error("No se encontró el owner del negocio");

  const { data: authUsersData } = await client.auth.admin.listUsers({ perPage: 1000 });
  const authUser = authUsersData?.users.find((u) => u.id === appUser.id);
  if (!authUser?.email) throw new Error("No se encontró el email del owner");

  const { data, error } = await client.auth.admin.generateLink({
    type: "magiclink",
    email: authUser.email,
    options: {
      redirectTo: buildImpersonationRedirectTo(),
    },
  });

  if (error || !data?.properties?.action_link) {
    throw new Error(`No se pudo generar el link: ${error?.message ?? "sin respuesta"}`);
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + IMPERSONATION_TOKEN_TTL_MS).toISOString();

  const { error: insertError } = await client.from("impersonation_tokens").insert({
    token,
    magic_link: data.properties.action_link,
    expires_at: expiresAt,
  });

  if (insertError) {
    throw new Error(`No se pudo registrar el token de impersonation: ${insertError.message}`);
  }

  return token;
}

/**
 * Resolves a one-time impersonation token to its magic link, marking it used
 * atomically so a second concurrent request for the same token can't also
 * consume it. Returns null for a missing, expired, or already-used token.
 */
export async function resolveImpersonationToken(token: string): Promise<string | null> {
  const client = createAdminClient();

  const { data: row } = await client
    .from("impersonation_tokens")
    .select("magic_link, expires_at, used_at")
    .eq("token", token)
    .single();

  if (!row || row.used_at || new Date(row.expires_at) < new Date()) {
    return null;
  }

  const { data: updated, error } = await client
    .from("impersonation_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("token", token)
    .is("used_at", null)
    .select("magic_link")
    .single();

  if (error || !updated) {
    // Lost the race against a concurrent request for the same token.
    return null;
  }

  return updated.magic_link as string;
}
