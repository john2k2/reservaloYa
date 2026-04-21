import { unstable_noStore as noStore } from "next/cache";

import { createAdminClient } from "@/lib/supabase/server";

export type PlatformSubscriptionInfo = {
  status: "trial" | "active" | "cancelled" | "suspended" | "none";
  trialEndsAt?: string;
  nextBillingDate?: string;
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

  const [businessesRes, appUsersRes, bookingsRes, authUsersRes] = await Promise.all([
    client.from("businesses").select("*").order("created", { ascending: false }),
    client.from("app_users").select("*"),
    client.from("bookings").select("id, created").gte("created", since30d),
    client.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const businesses = businessesRes.data ?? [];
  const appUsers = appUsersRes.data ?? [];
  const bookings = bookingsRes.data ?? [];
  const authUsers = authUsersRes.data?.users ?? [];

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

  return { businesses, appUsers, bookings, emailMap, ownerMap };
}

function buildBusinessRow(
  b: Record<string, unknown>,
  ownerMap: Map<string, { name: string; email: string }>
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
    subscription: { status: "none" as const },
  };
}

export async function getPlatformDashboardData(): Promise<PlatformDashboardData | null> {
  noStore();

  const { businesses, appUsers, bookings, ownerMap } = await fetchPlatformData();

  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  return {
    totalBusinesses: businesses.length,
    activeBusinesses: businesses.filter((b) => b.active !== false).length,
    totalUsers: appUsers.filter((u) => u.role !== "public_app").length,
    bookingsLast30d: bookings.length,
    newBusinessesThisWeek: businesses.filter((b) => (b.created as string) >= since7d).length,
    subscriptionActive: 0,
    subscriptionTrial: 0,
    subscriptionSuspended: 0,
    recentBusinesses: businesses.slice(0, 10).map((b) => buildBusinessRow(b, ownerMap)),
  };
}

export async function getPlatformBusinessesList(): Promise<PlatformBusinessRow[] | null> {
  noStore();

  const { businesses, ownerMap } = await fetchPlatformData();
  return businesses.map((b) => buildBusinessRow(b, ownerMap));
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
