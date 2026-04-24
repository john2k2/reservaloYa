"use server";

import { revalidatePath } from "next/cache";

import { writeAuditLog, type AuditAction } from "@/server/audit-log";
import { getAuthenticatedPlatformAdmin } from "@/server/platform-auth";
import { togglePlatformBusinessActive, enableTrial, extendTrial, cancelSubscription, unlockBusinessSubscription, generateImpersonationLink } from "@/server/queries/platform";

type PlatformAdminUser = NonNullable<Awaited<ReturnType<typeof getAuthenticatedPlatformAdmin>>>;

async function writePlatformAuditLog(
  user: PlatformAdminUser,
  businessId: string,
  action: AuditAction,
  metadata: Record<string, unknown> = {}
) {
  try {
    await writeAuditLog(
      { userId: user.id, userEmail: user.email, businessId },
      action,
      businessId,
      metadata
    );
  } catch {
    // La auditoria platform no debe bloquear operaciones administrativas sensibles.
  }
}

export async function toggleBusinessActiveAction(businessId: string, active: boolean) {
  const user = await getAuthenticatedPlatformAdmin();
  if (!user) throw new Error("No autorizado");

  await togglePlatformBusinessActive(businessId, active);
  await writePlatformAuditLog(
    user,
    businessId,
    active ? "platform.business_activated" : "platform.business_deactivated",
    { active }
  );
  revalidatePath("/platform/businesses");
  revalidatePath("/platform/dashboard");
}

export async function enableTrialAction(businessId: string, days: number) {
  const user = await getAuthenticatedPlatformAdmin();
  if (!user) throw new Error("No autorizado");

  await enableTrial(businessId, days);
  await writePlatformAuditLog(user, businessId, "platform.trial_enabled", { days });
  revalidatePath("/platform/businesses");
  revalidatePath("/platform/dashboard");
}

export async function extendTrialAction(businessId: string, days: number) {
  const user = await getAuthenticatedPlatformAdmin();
  if (!user) throw new Error("No autorizado");

  await extendTrial(businessId, days);
  await writePlatformAuditLog(user, businessId, "platform.trial_extended", { days });
  revalidatePath("/platform/businesses");
  revalidatePath("/platform/dashboard");
}

export async function cancelSubscriptionAction(businessId: string) {
  const user = await getAuthenticatedPlatformAdmin();
  if (!user) throw new Error("No autorizado");

  await cancelSubscription(businessId);
  await writePlatformAuditLog(user, businessId, "platform.subscription_cancelled");
  revalidatePath("/platform/businesses");
  revalidatePath("/platform/dashboard");
}

export async function unlockSubscriptionAction(businessId: string) {
  const user = await getAuthenticatedPlatformAdmin();
  if (!user) throw new Error("No autorizado");

  await unlockBusinessSubscription(businessId);
  await writePlatformAuditLog(user, businessId, "platform.subscription_unlocked");
  revalidatePath("/platform/businesses");
  revalidatePath("/platform/dashboard");
}

export async function impersonateBusinessOwnerAction(businessId: string): Promise<string> {
  const user = await getAuthenticatedPlatformAdmin();
  if (!user) throw new Error("No autorizado");

  const link = await generateImpersonationLink(businessId);
  await writePlatformAuditLog(user, businessId, "platform.impersonation_link_created");
  return link;
}
