import { createAdminClient } from "@/lib/supabase/server";
import type { NotificationHistoryRow } from "./types";

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
