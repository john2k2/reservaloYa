import { unstable_noStore as noStore } from "next/cache";
import { randomBytes } from "node:crypto";

import { demoPresets, isDemoBusiness } from "@/constants/demo";
import { createAdminClient } from "@/lib/supabase/server";
import { getBlueDollarRate } from "@/lib/dollar-rate";
import {
  getBillingTransferDetails,
  hasBillingTransferDetails,
} from "@/server/billing-transfer";
import {
  listTransferClaims,
  type TransferClaimRow,
} from "@/server/billing-transfer-claims";
import {
  SUBSCRIPTION_CARD_USD_PRICE,
  SUBSCRIPTION_USD_PRICE,
} from "@/server/payments-domain";
import {
  getPolarServer,
  isPolarConfigured,
  isPolarWebhookConfigured,
} from "@/server/polar-config";
import { buildImpersonationRedirectTo } from "@/server/platform-impersonation";

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
  servicesCount: number;
  activeAvailabilityRules: number;
  notificationsSent30d: number;
  ownerCount: number;
};

export type PlatformUserRow = {
  id: string;
  name: string;
  email: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  role: string;
  active: boolean;
  verified: boolean;
  createdAt: string;
};

export type PlatformPaymentRow = {
  id: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  method: "transfer" | "polar" | "unknown";
  amountLabel: string;
  occurredAt: string;
  note: string;
  receiptUrl?: string | null;
};

export type PlatformHealthCheck = {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
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
  mrr: number;
  trialsExpiringSoon: PlatformBusinessRow[];
  /** Cola única: comprobantes pendientes de revisar. */
  pendingTransferClaims: TransferClaimRow[];
  /** Historial unificado: transferencias aprobadas + Polar (sin demos). */
  recentPayments: PlatformPaymentRow[];
  health: PlatformHealthCheck[];
  dormantBusinesses: PlatformBusinessRow[];
  recentBusinesses: PlatformBusinessRow[];
};

type PaginationOptions = {
  page?: number;
  limit?: number;
};

const DEFAULT_PLATFORM_PAGE = 1;
const DEFAULT_PLATFORM_LIMIT = 50;

function resolvePaginationRange(pagination?: PaginationOptions, defaultLimit = DEFAULT_PLATFORM_LIMIT) {
  const page = Math.max(1, pagination?.page ?? DEFAULT_PLATFORM_PAGE);
  const limit = Math.max(1, pagination?.limit ?? defaultLimit);
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return { from, to };
}

async function fetchPlatformData(options?: { page?: number; limit?: number; all?: boolean }) {
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

export async function getPlatformDashboardData(): Promise<PlatformDashboardData | null> {
  noStore();

  const {
    businesses,
    appUsers,
    bookings,
    ownerMap,
    ownerCountMap,
    subMap,
    serviceCountMap,
    availabilityMap,
    notifMap,
  } = await fetchPlatformData({ all: true });

  const toRow = (b: Record<string, unknown>) =>
    buildBusinessRow(b, ownerMap, subMap, serviceCountMap, availabilityMap, notifMap, ownerCountMap);

  const now = new Date();
  const nowIso = now.toISOString();
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const allSubs = Array.from(subMap.values());
  const subscriptionActiveCount = allSubs.filter((s) => s.status === "active").length;
  const priceUsd = Number(process.env.SUBSCRIPTION_PRICE_USD ?? SUBSCRIPTION_USD_PRICE);
  const blueRate = priceUsd > 0 ? (await getBlueDollarRate() ?? 0) : 0;
  const pricePerMonth = Math.round(priceUsd * blueRate);

  const trialsExpiringSoon = businesses
    .filter((b) => {
      const sub = subMap.get(b.id as string);
      if (!sub || sub.status !== "trial") return false;
      const endsAt = sub.trialEndsAt as string | undefined;
      return !!endsAt && endsAt > nowIso && endsAt <= in7d;
    })
    .map(toRow);

  const dormantBusinesses = businesses
    .filter((b) => {
      if ((b.created as string) > since7d) return false;
      return (serviceCountMap.get(b.id as string) ?? 0) === 0 || (availabilityMap.get(b.id as string) ?? 0) === 0;
    })
    .map(toRow);

  const [pendingTransferClaims, recentPayments, health] = await Promise.all([
    listTransferClaims({ status: "pending", limit: 30 })
      .then((claims) => claims.filter((c) => !isDemoBusiness(c.businessSlug)))
      .catch(() => [] as TransferClaimRow[]),
    getPlatformRecentPayments(businesses as Record<string, unknown>[]),
    getPlatformHealthChecks(),
  ]);

  return {
    totalBusinesses: businesses.length,
    activeBusinesses: businesses.filter((b) => b.active !== false).length,
    totalUsers: appUsers.filter((u) => u.role !== "public_app").length,
    bookingsLast30d: bookings.length,
    newBusinessesThisWeek: businesses.filter((b) => (b.created as string) >= since7d).length,
    subscriptionActive: subscriptionActiveCount,
    subscriptionTrial: allSubs.filter((s) => s.status === "trial").length,
    // Incluye cancelados: el KPI de churn debe reflejar ambos estados.
    subscriptionSuspended: allSubs.filter(
      (s) => s.status === "suspended" || s.status === "cancelled"
    ).length,
    mrr: subscriptionActiveCount * pricePerMonth,
    trialsExpiringSoon,
    pendingTransferClaims,
    recentPayments,
    health,
    dormantBusinesses,
    recentBusinesses: businesses.slice(0, 10).map(toRow),
  };
}

async function getPlatformRecentPayments(
  businesses: Record<string, unknown>[]
): Promise<PlatformPaymentRow[]> {
  const client = createAdminClient();
  const bizById = new Map(businesses.map((b) => [b.id as string, b]));
  const liveIds = new Set(bizById.keys());
  const rows: PlatformPaymentRow[] = [];
  const claimCoveredBizDates = new Set<string>();

  const approvedClaims = (
    await listTransferClaims({ status: "approved", limit: 20 }).catch(
      () => [] as TransferClaimRow[]
    )
  ).filter((c) => liveIds.has(c.businessId) && !isDemoBusiness(c.businessSlug));

  for (const claim of approvedClaims) {
    const day = claim.reviewedAt?.slice(0, 10) ?? claim.createdAt.slice(0, 10);
    claimCoveredBizDates.add(`${claim.businessId}:${day}`);
    rows.push({
      id: `claim-${claim.id}`,
      businessId: claim.businessId,
      businessName: claim.businessName,
      businessSlug: claim.businessSlug,
      method: "transfer",
      amountLabel:
        claim.amountArs != null
          ? `$${Math.round(claim.amountArs).toLocaleString("es-AR")} ARS`
          : `USD ${SUBSCRIPTION_USD_PRICE} (transferencia)`,
      occurredAt: claim.reviewedAt ?? claim.createdAt,
      note: claim.note ?? "Comprobante aprobado",
      receiptUrl: claim.receiptUrl,
    });
  }

  const { data: auditRows } = await client
    .from("audit_logs")
    .select("id, business_id, action, created, metadata")
    .eq("action", "platform.subscription_paid")
    .order("created", { ascending: false })
    .limit(30);

  for (const row of auditRows ?? []) {
    const businessId = String(row.business_id ?? "");
    if (!liveIds.has(businessId)) continue;
    const biz = bizById.get(businessId);
    const slug = String(biz?.slug ?? "");
    if (isDemoBusiness(slug)) continue;

    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    // Evita duplicar: el claim aprobado ya representa ese cobro.
    if (metadata.method === "transfer_claim" || metadata.claimId) continue;
    const day = String(row.created ?? "").slice(0, 10);
    if (claimCoveredBizDates.has(`${businessId}:${day}`)) continue;

    rows.push({
      id: String(row.id),
      businessId,
      businessName: String(biz?.name ?? "Negocio"),
      businessSlug: slug,
      method: "transfer",
      amountLabel: `USD ${SUBSCRIPTION_USD_PRICE} (transferencia)`,
      occurredAt: String(row.created ?? ""),
      note: "Marcado pagado manualmente",
    });
  }

  const { data: polarSubs } = await client
    .from("subscriptions")
    .select("id, businessId, status, nextBillingDate, polarSubscriptionId, updated")
    .not("polarSubscriptionId", "is", null)
    .order("updated", { ascending: false })
    .limit(20);

  for (const sub of polarSubs ?? []) {
    const businessId = String(sub.businessId ?? "");
    if (!liveIds.has(businessId)) continue;
    const biz = bizById.get(businessId);
    const slug = String(biz?.slug ?? "");
    if (isDemoBusiness(slug)) continue;
    rows.push({
      id: `polar-${sub.id}`,
      businessId,
      businessName: String(biz?.name ?? "Negocio"),
      businessSlug: slug,
      method: "polar",
      amountLabel: `USD ${SUBSCRIPTION_CARD_USD_PRICE} (${String(sub.status)})`,
      occurredAt: String(sub.updated ?? sub.nextBillingDate ?? ""),
      note: sub.polarSubscriptionId
        ? `Polar ${String(sub.polarSubscriptionId).slice(0, 8)}…`
        : "Polar",
    });
  }

  return rows
    .filter((r) => r.occurredAt)
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1))
    .slice(0, 20);
}

export async function getPlatformHealthChecks(): Promise<PlatformHealthCheck[]> {
  const client = createAdminClient();
  const transfer = getBillingTransferDetails();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count: failedNotifs } = await client
    .from("communication_events")
    .select("id", { count: "exact", head: true })
    .eq("status", "failed")
    .gte("created", since24h);

  const { data: lastReminder } = await client
    .from("communication_events")
    .select("created")
    .eq("kind", "reminder")
    .order("created", { ascending: false })
    .limit(1)
    .maybeSingle();

  const polarOk = isPolarConfigured() && isPolarWebhookConfigured();
  const transferOk = hasBillingTransferDetails(transfer);

  return [
    {
      key: "polar",
      label: "Polar",
      ok: polarOk,
      detail: polarOk
        ? `Configurado (${getPolarServer()})`
        : "Falta token, product id o webhook secret",
    },
    {
      key: "transfer",
      label: "Transferencia",
      ok: transferOk,
      detail: transferOk
        ? `Alias ${transfer.alias ?? "—"}`
        : "Faltan BILLING_TRANSFER_ALIAS / CBU",
    },
    {
      key: "notifications",
      label: "Notificaciones 24h",
      ok: (failedNotifs ?? 0) === 0,
      detail:
        (failedNotifs ?? 0) === 0
          ? "Sin fallos recientes"
          : `${failedNotifs} fallos en las últimas 24h`,
    },
    {
      key: "reminders",
      label: "Último reminder",
      ok: Boolean(lastReminder?.created),
      detail: lastReminder?.created
        ? new Date(String(lastReminder.created)).toLocaleString("es-AR")
        : "Sin reminders registrados",
    },
  ];
}

export type PlatformJobRunRow = {
  id: string;
  jobName: string;
  status: "running" | "completed" | "failed";
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
  /** "running" hace más de 1h sin finished_at: probablemente murió a mitad de camino. */
  stuck: boolean;
};

const JOB_RUN_STUCK_THRESHOLD_MS = 60 * 60 * 1000;

export async function getPlatformJobRuns(limit = 50): Promise<PlatformJobRunRow[]> {
  const client = createAdminClient();
  const { data, error } = await client
    .from("job_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  const now = Date.now();
  return data.map((row) => {
    const startedAt = String(row.started_at);
    const status = row.status as PlatformJobRunRow["status"];
    const stuck =
      status === "running" && now - new Date(startedAt).getTime() > JOB_RUN_STUCK_THRESHOLD_MS;
    return {
      id: String(row.id),
      jobName: String(row.job_name),
      status,
      startedAt,
      finishedAt: row.finished_at ? String(row.finished_at) : null,
      error: row.error ? String(row.error) : null,
      stuck,
    };
  });
}

export async function getPlatformJobFailureCount(): Promise<number> {
  const client = createAdminClient();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await client
    .from("job_runs")
    .select("id", { count: "exact", head: true })
    .eq("status", "failed")
    .gte("started_at", since24h);

  if (error) return 0;
  return count ?? 0;
}

export async function getPlatformBusinessesList(pagination?: PaginationOptions): Promise<PlatformBusinessRow[] | null> {
  noStore();

  const client = createAdminClient();
  const { from, to } = resolvePaginationRange(pagination, DEFAULT_PLATFORM_LIMIT);

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

export async function getPlatformUsersList(pagination?: PaginationOptions): Promise<PlatformUserRow[] | null> {
  noStore();

  const client = createAdminClient();
  const { from, to } = resolvePaginationRange(pagination, DEFAULT_PLATFORM_LIMIT);

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

export async function togglePlatformBusinessActive(businessId: string, active: boolean) {
  const client = createAdminClient();
  const { error } = await client
    .from("businesses")
    .update({ active, updated: new Date().toISOString() })
    .eq("id", businessId);
  if (error) throw error;
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

export type NotificationHistoryRow = {
  id: string;
  channel: string;
  kind: string;
  status: string;
  recipient: string;
  subject: string;
  note: string;
  createdAt: string;
};

export async function getBusinessNotificationHistory(slug: string): Promise<NotificationHistoryRow[]> {
  const client = createAdminClient();

  const { data: business } = await client
    .from("businesses")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!business) throw new Error("Negocio no encontrado");

  const { data, error } = await client
    .from("communication_events")
    .select("id, channel, kind, status, recipient, subject, note, created")
    .eq("business_id", business.id)
    .order("created", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => ({
    id: r.id,
    channel: String(r.channel ?? ""),
    kind: String(r.kind ?? ""),
    status: String(r.status ?? ""),
    recipient: String(r.recipient ?? ""),
    subject: String(r.subject ?? ""),
    note: String(r.note ?? ""),
    createdAt: String(r.created ?? ""),
  }));
}
