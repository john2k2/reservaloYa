import { createAdminClient } from "@/lib/supabase/server";
import {
  getBillingTransferDetails,
  hasBillingTransferDetails,
} from "@/server/billing-transfer";
import {
  getPolarServer,
  isPolarConfigured,
  isPolarWebhookConfigured,
} from "@/server/polar-config";
import type { PlatformHealthCheck, PlatformJobRunRow } from "./types";

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
