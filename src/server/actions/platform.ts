"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedPlatformAdmin } from "@/server/platform-auth";
import { togglePlatformBusinessActive, enableTrial, extendTrial, cancelSubscription, unlockBusinessSubscription } from "@/server/queries/platform";

export async function toggleBusinessActiveAction(businessId: string, active: boolean) {
  const user = await getAuthenticatedPlatformAdmin();
  if (!user) throw new Error("No autorizado");

  await togglePlatformBusinessActive(businessId, active);
  revalidatePath("/platform/businesses");
  revalidatePath("/platform/dashboard");
}

export async function enableTrialAction(businessId: string, days: number) {
  const user = await getAuthenticatedPlatformAdmin();
  if (!user) throw new Error("No autorizado");

  await enableTrial(businessId, days);
  revalidatePath("/platform/businesses");
  revalidatePath("/platform/dashboard");
}

export async function extendTrialAction(businessId: string, days: number) {
  const user = await getAuthenticatedPlatformAdmin();
  if (!user) throw new Error("No autorizado");

  await extendTrial(businessId, days);
  revalidatePath("/platform/businesses");
  revalidatePath("/platform/dashboard");
}

export async function cancelSubscriptionAction(businessId: string) {
  const user = await getAuthenticatedPlatformAdmin();
  if (!user) throw new Error("No autorizado");

  await cancelSubscription(businessId);
  revalidatePath("/platform/businesses");
  revalidatePath("/platform/dashboard");
}

export async function unlockSubscriptionAction(businessId: string) {
  const user = await getAuthenticatedPlatformAdmin();
  if (!user) throw new Error("No autorizado");

  await unlockBusinessSubscription(businessId);
  revalidatePath("/platform/businesses");
  revalidatePath("/platform/dashboard");
}
