import { unstable_noStore as noStore } from "next/cache";

import { isPocketBaseConfigured, isPocketBaseAdminConfigured } from "@/lib/pocketbase/config";
import { createPocketBaseAdminClient } from "@/lib/pocketbase/admin";
import type { BusinessRecord, BookingRecord, UserRecord } from "@/server/pocketbase-domain";

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

export type PlatformBusinessRow = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  templateSlug: string;
  createdAt: string;
  ownerEmail: string;
  ownerName: string;
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
  recentBusinesses: PlatformBusinessRow[];
};

export async function getPlatformDashboardData(): Promise<PlatformDashboardData | null> {
  noStore();

  if (!isPocketBaseConfigured()) return null;

  const pb = await getAdminClient();

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [businesses, users, recentBookings] = await Promise.all([
    pb.collection("businesses").getFullList<BusinessRecord>({ sort: "-id", requestKey: null }).catch(() => [] as BusinessRecord[]),
    pb.collection("users").getFullList<UserRecord>({ sort: "-created", requestKey: null }).catch(() => [] as UserRecord[]),
    pb.collection("bookings").getFullList<BookingRecord>({
      filter: pb.filter("created >= {:since}", { since: since30d }),
      requestKey: null,
    }).catch(() => [] as BookingRecord[]),
  ]);

  // Build owner map: businessId -> owner user
  const ownerMap = new Map<string, UserRecord>();
  for (const user of users) {
    if (user.role === "owner" && user.business) {
      const bizId = Array.isArray(user.business) ? user.business[0] : user.business;
      if (bizId) ownerMap.set(String(bizId), user);
    }
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
    };
  });

  return {
    totalBusinesses: businesses.length,
    activeBusinesses: businesses.filter((b) => b.active !== false).length,
    totalUsers: users.filter((u) => u.role !== "public_app").length,
    bookingsLast30d: recentBookings.length,
    newBusinessesThisWeek: businesses.filter((b) => b.created >= since7d).length,
    recentBusinesses,
  };
}

export async function getPlatformBusinessesList(): Promise<PlatformBusinessRow[] | null> {
  noStore();

  if (!isPocketBaseConfigured()) return null;

  const pb = await getAdminClient();

  const [businesses, users] = await Promise.all([
    pb.collection("businesses").getFullList<BusinessRecord>({ sort: "-id", requestKey: null }).catch(() => [] as BusinessRecord[]),
    pb.collection("users").getFullList<UserRecord>({
      filter: "role = 'owner'",
      sort: "email",
      requestKey: null,
    }).catch(() => [] as UserRecord[]),
  ]);

  const ownerMap = new Map<string, UserRecord>();
  for (const user of users) {
    const bizId = Array.isArray(user.business) ? user.business[0] : user.business;
    if (bizId) ownerMap.set(String(bizId), user);
  }

  return businesses.map((b) => {
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
