import { redirect } from "next/navigation";

import {
  canAccessAdminRoute,
  getAdminRouteAccessError,
  normalizeAdminRole,
} from "@/lib/admin-permissions";
import { getAdminShellData } from "@/server/queries/admin";

export async function requireAdminRouteAccess(route: string) {
  const shellData = await getAdminShellData();

  if (!shellData) {
    redirect("/login?error=Inicia sesión para continuar.");
  }

  if (!canAccessAdminRoute(shellData.userRole, route)) {
    redirect(`/admin/dashboard?error=${encodeURIComponent(getAdminRouteAccessError(route))}`);
  }

  if (shellData.subscriptionExpired && route !== "/admin/subscription") {
    redirect("/admin/subscription");
  }

  return {
    ...shellData,
    userRole: normalizeAdminRole(shellData.userRole),
  };
}
