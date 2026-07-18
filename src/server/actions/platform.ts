"use server";

import { revalidatePath } from "next/cache";

import { writeAuditLog, type AuditAction } from "@/server/audit-log";
import { getAuthenticatedPlatformAdmin } from "@/server/platform-auth";
import {
  approveTransferClaim,
  rejectTransferClaim,
} from "@/server/billing-transfer-claims";
import {
  togglePlatformBusinessActive,
  togglePlatformUserActive,
  consolidateBusinessOwners,
  enableTrial,
  extendTrial,
  cancelSubscription,
  unlockBusinessSubscription,
  markSubscriptionPaid,
  generateImpersonationToken,
} from "@/server/queries/platform";

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

export async function markSubscriptionPaidAction(businessId: string) {
  const user = await getAuthenticatedPlatformAdmin();
  if (!user) throw new Error("No autorizado");

  await markSubscriptionPaid(businessId);
  await writePlatformAuditLog(user, businessId, "platform.subscription_paid");
  revalidatePath("/platform/businesses");
  revalidatePath("/platform/dashboard");
}

export async function impersonateBusinessOwnerAction(businessId: string): Promise<string> {
  const user = await getAuthenticatedPlatformAdmin();
  if (!user) throw new Error("No autorizado");

  const token = await generateImpersonationToken(businessId);
  await writePlatformAuditLog(user, businessId, "platform.impersonation_link_created");
  return token;
}

export async function toggleUserActiveAction(userId: string, active: boolean, businessId: string) {
  const user = await getAuthenticatedPlatformAdmin();
  if (!user) throw new Error("No autorizado");
  if (userId === user.id) throw new Error("No podés desactivarte a vos mismo");

  await togglePlatformUserActive(userId, active);
  await writePlatformAuditLog(
    user,
    businessId || user.id,
    active ? "platform.user_activated" : "platform.user_deactivated",
    { userId, active }
  );
  revalidatePath("/platform/users");
  revalidatePath("/platform/businesses");
}

export async function consolidateOwnersAction(businessId: string, preferredOwnerEmail?: string) {
  const user = await getAuthenticatedPlatformAdmin();
  if (!user) throw new Error("No autorizado");

  const result = await consolidateBusinessOwners(businessId, preferredOwnerEmail);
  await writePlatformAuditLog(user, businessId, "platform.owners_consolidated", result);
  revalidatePath("/platform/users");
  revalidatePath("/platform/businesses");
  revalidatePath("/platform/dashboard");
  return result;
}

export async function approveTransferClaimAction(claimId: string, businessId: string) {
  const user = await getAuthenticatedPlatformAdmin();
  if (!user) throw new Error("No autorizado");

  await approveTransferClaim({ claimId, reviewerId: user.id });
  await writePlatformAuditLog(user, businessId, "platform.subscription_paid", {
    method: "transfer_claim",
    claimId,
  });
  revalidatePath("/platform/dashboard");
  revalidatePath("/platform/businesses");
}

export async function rejectTransferClaimAction(
  claimId: string,
  businessId: string,
  note?: string
) {
  const user = await getAuthenticatedPlatformAdmin();
  if (!user) throw new Error("No autorizado");

  await rejectTransferClaim({ claimId, reviewerId: user.id, note });
  await writePlatformAuditLog(user, businessId, "platform.transfer_claim_rejected", {
    claimId,
    note: note ?? null,
  });
  revalidatePath("/platform/dashboard");
  revalidatePath("/platform/businesses");
}
