"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedPlatformAdmin } from "@/server/platform-auth";
import { togglePlatformBusinessActive } from "@/server/queries/platform";

export async function toggleBusinessActiveAction(businessId: string, active: boolean) {
  const user = await getAuthenticatedPlatformAdmin();
  if (!user) throw new Error("No autorizado");

  await togglePlatformBusinessActive(businessId, active);
  revalidatePath("/platform/businesses");
  revalidatePath("/platform/dashboard");
}
