import { unstable_noStore as noStore } from "next/cache";

import { isPocketBaseConfigured, isPocketBaseAdminConfigured } from "@/lib/pocketbase/config";
import { createPocketBaseAdminClient } from "@/lib/pocketbase/admin";
import type { BusinessRecord, BookingRecord, UserRecord, SubscriptionRecord } from "@/server/pocketbase-domain";

async function getAdminClient() {
  if (!isPocketBaseAdminConfigured()) {
    throw new Error(
      "Faltan variables de entorno: POCKETBASE_ADMIN_EMAIL y/o POCKETBASE_ADMIN_PASSWORD"
    );
  }
  try {
    return await createPocketBaseAdminClient();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Error autenticando cliente admin de PocketBase: ${msg}`);
  }
}

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
  // Revenue/subscription breakdown
  subscriptionActive: number;
  subscriptionTrial: number;
  subscriptionSuspended: number;
  recentBusinesses: PlatformBusinessRow[];
};

export async function getPlatformDashboardData(): Promise<PlatformDashboardData | null> {
  noStore();

  if (!isPocketBaseConfigured()) return null;

  const pb = await getAdminClient();

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [businesses, users, recentBookings, subscriptions] = await Promise.all([
    pb.collection("businesses").getFullList<BusinessRecord>({ sort: "-id", requestKey: null }).catch(() => [] as BusinessRecord[]),
    pb.collection("users").getFullList<UserRecord>({ sort: "-created", requestKey: null }).catch(() => [] as UserRecord[]),
    pb.collection("bookings").getFullList<BookingRecord>({
      filter: pb.filter("created >= {:since}", { since: since30d }),
      requestKey: null,
    }).catch(() => [] as BookingRecord[]),
    pb.collection("subscriptions").getFullList<SubscriptionRecord>({ requestKey: null }).catch(() => [] as SubscriptionRecord[]),
  ]);

  // Build owner map: businessId -> owner user
  const ownerMap = new Map<string, UserRecord>();
  for (const user of users) {
    if (user.role === "owner" && user.business) {
      const bizId = Array.isArray(user.business) ? user.business[0] : user.business;
      if (bizId) ownerMap.set(String(bizId), user);
    }
  }

  // Build subscription map: businessId -> subscription
  const subMap = new Map<string, SubscriptionRecord>();
  for (const sub of subscriptions) {
    subMap.set(sub.businessId, sub);
  }

  function buildSubscriptionInfo(businessId: string): PlatformSubscriptionInfo {
    const sub = subMap.get(businessId);
    if (!sub) return { status: "none" };
    return {
      status: sub.status,
      trialEndsAt: sub.trialEndsAt,
      nextBillingDate: sub.nextBillingDate,
      lockedAt: sub.lockedAt,
    };
  }

  const recentBusinesses: PlatformBusinessRow[] = businesses.slice(0, 10).map((b) => {
    const owner = ownerMap.get(b.id);
    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      active: b.active !== false,
      templateSlug: b.templateSlug ?? "",
      createdAt: b.created,
      ownerEmail: owner?.email ?? "—",
      ownerName: String(owner?.name ?? owner?.email ?? "—"),
      mpConnected: Boolean(b.mpConnected),
      subscription: buildSubscriptionInfo(b.id),
    };
  });

  // Subscription counts
  const subActive = subscriptions.filter((s) => s.status === "active").length;
  const subTrial = subscriptions.filter((s) => s.status === "trial").length;
  const subSuspended = subscriptions.filter((s) => s.status === "suspended" || s.status === "cancelled").length;

  return {
    totalBusinesses: businesses.length,
    activeBusinesses: businesses.filter((b) => b.active !== false).length,
    totalUsers: users.filter((u) => u.role !== "public_app").length,
    bookingsLast30d: recentBookings.length,
    newBusinessesThisWeek: businesses.filter((b) => b.created >= since7d).length,
    subscriptionActive: subActive,
    subscriptionTrial: subTrial,
    subscriptionSuspended: subSuspended,
    recentBusinesses,
  };
}

export async function getPlatformBusinessesList(): Promise<PlatformBusinessRow[] | null> {
  noStore();

  if (!isPocketBaseConfigured()) return null;

  const pb = await getAdminClient();

  const [businesses, users, subscriptions] = await Promise.all([
    pb.collection("businesses").getFullList<BusinessRecord>({ sort: "-id", requestKey: null }).catch(() => [] as BusinessRecord[]),
    pb.collection("users").getFullList<UserRecord>({
      filter: "role = 'owner'",
      sort: "email",
      requestKey: null,
    }).catch(() => [] as UserRecord[]),
    pb.collection("subscriptions").getFullList<SubscriptionRecord>({ requestKey: null }).catch(() => [] as SubscriptionRecord[]),
  ]);

  const ownerMap = new Map<string, UserRecord>();
  for (const user of users) {
    const bizId = Array.isArray(user.business) ? user.business[0] : user.business;
    if (bizId) ownerMap.set(String(bizId), user);
  }

  const subMap = new Map<string, SubscriptionRecord>();
  for (const sub of subscriptions) {
    subMap.set(sub.businessId, sub);
  }

  return businesses.map((b) => {
    const owner = ownerMap.get(b.id);
    const sub = subMap.get(b.id);
    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      active: b.active !== false,
      templateSlug: b.templateSlug ?? "",
      createdAt: b.created,
      ownerEmail: owner?.email ?? "—",
      ownerName: String(owner?.name ?? owner?.email ?? "—"),
      mpConnected: Boolean(b.mpConnected),
      subscription: sub
        ? { status: sub.status, trialEndsAt: sub.trialEndsAt, nextBillingDate: sub.nextBillingDate, lockedAt: sub.lockedAt }
        : { status: "none" as const },
    };
  });
}

export async function getPlatformUsersList(): Promise<PlatformUserRow[] | null> {
  noStore();

  if (!isPocketBaseConfigured()) return null;

  const pb = await getAdminClient();

  const [users, businesses] = await Promise.all([
    pb.collection("users").getFullList<UserRecord>({
      filter: "role != 'public_app'",
      sort: "-created",
      requestKey: null,
    }),
    pb.collection("businesses").getFullList<BusinessRecord>({ requestKey: null }),
  ]);

  const businessMap = new Map<string, BusinessRecord>();
  for (const b of businesses) businessMap.set(b.id, b);

  return users.map((u) => {
    const bizId = String(Array.isArray(u.business) ? u.business[0] : u.business ?? "");
    const biz = businessMap.get(bizId);
    return {
      id: u.id,
      name: String(u.name ?? u.email ?? "—"),
      email: u.email,
      businessName: biz?.name ?? "—",
      businessSlug: biz?.slug ?? "—",
      role: String(u.role ?? "staff"),
      active: u.active !== false,
      verified: Boolean(u.verified),
      createdAt: u.created,
    };
  });
}

export async function togglePlatformBusinessActive(
  businessId: string,
  active: boolean
): Promise<void> {
  const pb = await getAdminClient();
  await pb.collection("businesses").update(businessId, { active });
}

export async function enableTrial(businessId: string, days: number): Promise<void> {
  const pb = await getAdminClient();
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

  try {
    const subs = await pb.collection("subscriptions").getFullList({
      filter: pb.filter("businessId = {:businessId}", { businessId }),
    });

    if (subs.length > 0) {
      await pb.collection("subscriptions").update(subs[0].id, {
        status: "trial",
        trialStartedAt: now.toISOString(),
        trialEndsAt,
        lockedAt: null,
      });
    } else {
      await pb.collection("subscriptions").create({
        businessId,
        status: "trial",
        trialStartedAt: now.toISOString(),
        trialEndsAt,
        lockedAt: null,
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Error habilitando trial: ${msg}`);
  }
}

export async function extendTrial(businessId: string, days: number): Promise<void> {
  const pb = await getAdminClient();

  try {
    const subs = await pb.collection("subscriptions").getFullList({
      filter: pb.filter("businessId = {:businessId}", { businessId }),
    });

    if (subs.length === 0) {
      throw new Error("No existe suscripción para este negocio");
    }

    const sub = subs[0];
    const currentEndsAt = sub.trialEndsAt ? new Date(sub.trialEndsAt) : new Date();
    const newEndsAt = new Date(currentEndsAt.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

    await pb.collection("subscriptions").update(sub.id, { trialEndsAt: newEndsAt });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Error extendiendo trial: ${msg}`);
  }
}

export async function cancelSubscription(businessId: string): Promise<void> {
  const pb = await getAdminClient();

  try {
    const subs = await pb.collection("subscriptions").getFullList({
      filter: pb.filter("businessId = {:businessId}", { businessId }),
    });

    if (subs.length === 0) {
      throw new Error("No existe suscripción para este negocio");
    }

    const sub = subs[0];
    const update: Record<string, unknown> = { status: "cancelled" };
    if (!sub.lockedAt) {
      update.lockedAt = new Date().toISOString();
    }
    await pb.collection("subscriptions").update(sub.id, update);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Error cancelando suscripción: ${msg}`);
  }
}

export async function unlockBusinessSubscription(businessId: string): Promise<void> {
  const pb = await getAdminClient();

  try {
    const subs = await pb.collection("subscriptions").getFullList({
      filter: pb.filter("businessId = {:businessId}", { businessId }),
    });

    if (subs.length === 0) return;
    await pb.collection("subscriptions").update(subs[0].id, { lockedAt: null });
  } catch {
    // Silently fail
  }
}
