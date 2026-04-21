import { unstable_noStore as noStore } from "next/cache";

import { createAdminClient } from "@/lib/supabase/server";

export type PlatformSubscriptionInfo = {
  status: "trial" | "active" | "cancelled" | "suspended" | "none";
  trialEndsAt?: string;
  nextBillingDate?: string;
  lockedAt?: string;
};

export type PlatformBusinessRow = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  templateSlug: string;
  createdAt: string;
  ownerEmail: string;
  ownerName: string;
  mpConnected: boolean;
  subscription: PlatformSubscriptionInfo;
};

export type PlatformUserRow = {
  id: string;
  name: string;
  email: string;
  businessName: string;
  businessSlug: string;
  role: string;
  active: boolean;
  verified: boolean;
  createdAt: string;
};

export type PlatformDashboardData = {
  totalBusinesses: number;
  activeBusinesses: number;
  totalUsers: number;
  bookingsLast30d: number;
  newBusinessesThisWeek: number;
  subscriptionActive: number;
  subscriptionTrial: number;
  subscriptionSuspended: number;
  recentBusinesses: PlatformBusinessRow[];
};

async function fetchPlatformData() {
  const client = createAdminClient();
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [businessesRes, appUsersRes, bookingsRes, authUsersRes, subsRes] = await Promise.all([
    client.from("businesses").select("*").order("created", { ascending: false }),
    client.from("app_users").select("*"),
    client.from("bookings").select("id, created").gte("created", since30d),
    client.auth.admin.listUsers({ perPage: 1000 }),
    client.from("subscriptions").select("*"),
  ]);

  const businesses = businessesRes.data ?? [];
  const appUsers = appUsersRes.data ?? [];
  const bookings = bookingsRes.data ?? [];
  const authUsers = authUsersRes.data?.users ?? [];
  const subscriptions = subsRes.data ?? [];

  const emailMap = new Map(authUsers.map((u) => [u.id, u.email ?? ""]));

  const ownerMap = new Map<string, { name: string; email: string }>();
  for (const user of appUsers) {
    if (user.role === "owner" && user.business_id) {
      ownerMap.set(user.business_id, {
        name: String(user.name ?? emailMap.get(user.id) ?? "—"),
        email: emailMap.get(user.id) ?? "—",
      });
    }
  }

  const subMap = new Map<string, Record<string, unknown>>();
  for (const sub of subscriptions) {
    subMap.set(sub.businessId as string, sub as Record<string, unknown>);
  }

  return { businesses, appUsers, bookings, emailMap, ownerMap, subMap };
}

function buildSubscriptionInfo(
  businessId: string,
  subMap: Map<string, Record<string, unknown>>
): PlatformSubscriptionInfo {
  const sub = subMap.get(businessId);
  if (!sub) return { status: "none" };
  return {
    status: sub.status as PlatformSubscriptionInfo["status"],
    trialEndsAt: sub.trialEndsAt as string | undefined,
    nextBillingDate: sub.nextBillingDate as string | undefined,
    lockedAt: sub.lockedAt as string | undefined,
  };
}

function buildBusinessRow(
  b: Record<string, unknown>,
  ownerMap: Map<string, { name: string; email: string }>,
  subMap: Map<string, Record<string, unknown>>
): PlatformBusinessRow {
  const owner = ownerMap.get(b.id as string);
  return {
    id: b.id as string,
    name: b.name as string,
    slug: b.slug as string,
    active: b.active !== false,
    templateSlug: String(b.templateSlug ?? ""),
    createdAt: b.created as string,
    ownerEmail: owner?.email ?? "—",
    ownerName: owner?.name ?? "—",
    mpConnected: Boolean(b.mpConnected),
    subscription: buildSubscriptionInfo(b.id as string, subMap),
  };
}

export async function getPlatformDashboardData(): Promise<PlatformDashboardData | null> {
  noStore();

  const { businesses, appUsers, bookings, ownerMap, subMap } = await fetchPlatformData();

  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const allSubs = Array.from(subMap.values());

  return {
    totalBusinesses: businesses.length,
    activeBusinesses: businesses.filter((b) => b.active !== false).length,
    totalUsers: appUsers.filter((u) => u.role !== "public_app").length,
    bookingsLast30d: bookings.length,
    newBusinessesThisWeek: businesses.filter((b) => (b.created as string) >= since7d).length,
    subscriptionActive: allSubs.filter((s) => s.status === "active").length,
    subscriptionTrial: allSubs.filter((s) => s.status === "trial").length,
    subscriptionSuspended: allSubs.filter((s) => s.status === "suspended").length,
    recentBusinesses: businesses.slice(0, 10).map((b) => buildBusinessRow(b, ownerMap, subMap)),
  };
}

export async function getPlatformBusinessesList(): Promise<PlatformBusinessRow[] | null> {
  noStore();

  const { businesses, ownerMap, subMap } = await fetchPlatformData();
  return businesses.map((b) => buildBusinessRow(b, ownerMap, subMap));
}

export async function getPlatformUsersList(): Promise<PlatformUserRow[] | null> {
  noStore();

  const client = createAdminClient();

  const [appUsersRes, businessesRes, authUsersRes] = await Promise.all([
    client.from("app_users").select("*").order("created", { ascending: false }),
    client.from("businesses").select("id, name, slug"),
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
        businessName: biz?.name ?? "—",
        businessSlug: biz?.slug ?? "—",
        role: String(u.role ?? "staff"),
        active: u.active !== false,
        verified: true,
        createdAt: u.created as string,
      };
    });
}

export async function togglePlatformBusinessActive(businessId: string, active: boolean) {
  const client = createAdminClient();
  const { error } = await client
    .from("businesses")
    .update({ active, updated: new Date().toISOString() })
    .eq("id", businessId);
  if (error) throw error;
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
