import type { TransferClaimRow } from "@/server/billing-transfer-claims";

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

export type PaginationOptions = {
  page?: number;
  limit?: number;
};
