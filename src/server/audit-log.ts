import { createAdminClient } from "@/lib/supabase/server";

export type AuditAction =
  | "booking.created"
  | "booking.updated"
  | "booking.cancelled"
  | "service.created"
  | "service.updated"
  | "service.deactivated"
  | "availability.updated"
  | "blocked_slot.created"
  | "blocked_slot.removed"
  | "team.staff_created"
  | "team.staff_status_changed"
  | "platform.business_activated"
  | "platform.business_deactivated"
  | "platform.trial_enabled"
  | "platform.trial_extended"
  | "platform.subscription_cancelled"
  | "platform.subscription_unlocked"
  | "platform.impersonation_link_created";

export type AuditActor = {
  userId: string;
  userEmail: string;
  businessId: string;
};

export async function writeAuditLog(
  actor: AuditActor,
  action: AuditAction,
  entityId: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const client = createAdminClient();
    await client.from("audit_logs").insert({
      business_id: actor.businessId,
      user_id: actor.userId,
      user_email: actor.userEmail,
      action,
      entity_id: entityId,
      metadata,
    });
  } catch {
    // El audit log nunca debe romper el flujo principal
  }
}
