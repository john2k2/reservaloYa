import { unstable_noStore as noStore } from "next/cache";

import { isDemoBusiness } from "@/constants/demo";
import { createAdminClient } from "@/lib/supabase/server";
import { getBlueDollarRate } from "@/lib/dollar-rate";
import {
  listTransferClaims,
  type TransferClaimRow,
} from "@/server/billing-transfer-claims";
import {
  SUBSCRIPTION_CARD_USD_PRICE,
  SUBSCRIPTION_USD_PRICE,
} from "@/server/payments-domain";
import { buildBusinessRow, fetchPlatformData } from "./data";
import { getPlatformHealthChecks } from "./health";
import type { PlatformDashboardData, PlatformPaymentRow } from "./types";

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
