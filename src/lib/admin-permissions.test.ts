import { describe, expect, it } from "vitest";

import {
  canAccessAdminRoute,
  getAdminRoleLabel,
  getAdminRouteAccessError,
  normalizeAdminRole,
} from "@/lib/admin-permissions";

describe("admin permissions", () => {
  it("limits owner-only sections for staff users", () => {
    expect(canAccessAdminRoute("staff", "/admin/team")).toBe(false);
    expect(canAccessAdminRoute("staff", "/admin/onboarding")).toBe(false);
    expect(canAccessAdminRoute("staff", "/admin/bookings")).toBe(true);
  });

  it("lets owners access all current admin sections", () => {
    expect(canAccessAdminRoute("owner", "/admin/team")).toBe(true);
    expect(canAccessAdminRoute("owner", "/admin/onboarding")).toBe(true);
    expect(canAccessAdminRoute("owner", "/admin/bookings")).toBe(true);
  });

  it("normalizes unknown roles to staff-safe behavior", () => {
    expect(normalizeAdminRole(undefined)).toBe("staff");
    expect(normalizeAdminRole("mystery-role")).toBe("staff");
    expect(getAdminRoleLabel("mystery-role")).toBe("Staff");
  });

  it("returns clear access errors for protected sections", () => {
    expect(getAdminRouteAccessError("/admin/team")).toContain("equipo");
    expect(getAdminRouteAccessError("/admin/onboarding")).toContain("página");
  });
});
