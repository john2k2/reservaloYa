import { isDemoBusiness } from "@/constants/demo";
import { createAdminClient } from "@/lib/supabase/server";
import type { PaginationOptions, PlatformBusinessRow, PlatformSubscriptionInfo } from "./types";

const DEFAULT_PLATFORM_PAGE = 1;
const DEFAULT_PLATFORM_LIMIT = 50;

export function resolvePaginationRange(pagination?: PaginationOptions, defaultLimit = DEFAULT_PLATFORM_LIMIT) {
  const page = Math.max(1, pagination?.page ?? DEFAULT_PLATFORM_PAGE);
  const limit = Math.max(1, pagination?.limit ?? defaultLimit);
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return { from, to };
}

export async function fetchPlatformData(options?: { page?: number; limit?: number; all?: boolean }) {
  const client = createAdminClient();
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  let businessesQuery = client.from("businesses").select("*").order("created", { ascending: false });

  if (!options?.all) {
    const { from, to } = resolvePaginationRange(options, DEFAULT_PLATFORM_LIMIT);
    businessesQuery = businessesQuery.range(from, to);
  }

  const [businessesRes, appUsersRes, bookingsRes, authUsersRes, subsRes, servicesRes, availabilityRes, notificationsRes] = await Promise.all([
    businessesQuery,
    client.from("app_users").select("*").limit(1000),
    client.from("bookings").select("id, created").gte("created", since30d).limit(1000),
    client.auth.admin.listUsers({ perPage: 1000 }),
    client.from("subscriptions").select("*").limit(1000),
    client.from("services").select("id, business_id").limit(1000),
    client.from("availability_rules").select("id, business_id, active").limit(1000),
    client.from("communication_events").select("id, business_id, created").gte("created", since30d).limit(1000),
  ]);

  // Las demos son vitrina pública: no entran al panel operativo.
  const businesses = (businessesRes.data ?? []).filter(
    (b) => !isDemoBusiness(String(b.slug ?? ""))
  );
  const liveBusinessIds = new Set(businesses.map((b) => b.id as string));
  const appUsers = (appUsersRes.data ?? []).filter(
    (u) => !u.business_id || liveBusinessIds.has(u.business_id as string)
  );
  const bookings = (bookingsRes.data ?? []).filter((booking) => {
    const bizId = (booking as { business_id?: string }).business_id;
    return !bizId || liveBusinessIds.has(bizId);
  });
  const authUsers = authUsersRes.data?.users ?? [];
  const subscriptions = (subsRes.data ?? []).filter((s) =>
    liveBusinessIds.has(s.businessId as string)
  );
  const services = (servicesRes.data ?? []).filter((s) =>
    liveBusinessIds.has(s.business_id as string)
  );
  const availabilityRules = (availabilityRes.data ?? []).filter((r) =>
    liveBusinessIds.has(r.business_id as string)
  );
  const notifications = (notificationsRes.data ?? []).filter((n) =>
    liveBusinessIds.has(n.business_id as string)
  );

  const emailMap = new Map(authUsers.map((u) => [u.id, u.email ?? ""]));

  const ownerMap = new Map<string, { name: string; email: string }>();
  const ownerCountMap = new Map<string, number>();
  for (const user of appUsers) {
    if (user.role === "owner" && user.business_id) {
      ownerCountMap.set(user.business_id, (ownerCountMap.get(user.business_id) ?? 0) + 1);
      // Preferir el primer owner activo; si hay varios, el mapa queda con el último — se corrige abajo.
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

  return {
    businesses,
    appUsers,
    bookings,
    emailMap,
    ownerMap,
    ownerCountMap,
    subMap,
    serviceCountMap,
    availabilityMap,
    notifMap,
  };
}

export function buildSubscriptionInfo(
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

export function buildBusinessRow(
  b: Record<string, unknown>,
  ownerMap: Map<string, { name: string; email: string }>,
  subMap: Map<string, Record<string, unknown>>,
  serviceCountMap: Map<string, number> = new Map(),
  availabilityMap: Map<string, number> = new Map(),
  notifMap: Map<string, number> = new Map(),
  ownerCountMap: Map<string, number> = new Map()
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
    servicesCount: serviceCountMap.get(b.id as string) ?? 0,
    activeAvailabilityRules: availabilityMap.get(b.id as string) ?? 0,
    notificationsSent30d: notifMap.get(b.id as string) ?? 0,
    ownerCount: ownerCountMap.get(b.id as string) ?? 0,
  };
}
