import type { UserRole } from "@/types/domain";

export const ownerOnlyAdminRoutes = [
  "/admin/team",
  "/admin/onboarding",
  "/admin/settings",
] as const;

export function normalizeAdminRole(role?: string | null): UserRole {
  if (role === "owner" || role === "admin" || role === "staff") {
    return role;
  }

  return "staff";
}

export function canAccessAdminRoute(role: string | undefined, href: string) {
  const normalizedRole = normalizeAdminRole(role);

  if (ownerOnlyAdminRoutes.includes(href as (typeof ownerOnlyAdminRoutes)[number])) {
    return normalizedRole === "owner";
  }

  return true;
}

export function getAdminRoleLabel(role: string | undefined) {
  const normalizedRole = normalizeAdminRole(role);

  return normalizedRole === "owner"
    ? "Owner"
    : normalizedRole === "admin"
      ? "Admin"
      : "Staff";
}

export function getAdminRouteAccessError(href: string) {
  if (href === "/admin/team") {
    return "Solo el owner puede gestionar el equipo.";
  }

  if (href === "/admin/onboarding" || href === "/admin/settings") {
    return "Solo el owner puede cambiar la pagina y la configuracion del negocio.";
  }

  return "No tienes permisos para acceder a esa seccion.";
}
