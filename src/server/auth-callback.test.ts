import { describe, expect, it } from "vitest";

import { sanitizeAuthCallbackNextPath } from "./auth-callback";

describe("sanitizeAuthCallbackNextPath", () => {
  it("permite rutas internas seguras con query y hash", () => {
    expect(sanitizeAuthCallbackNextPath("/admin/dashboard?tab=agenda#hoy")).toBe(
      "/admin/dashboard?tab=agenda#hoy"
    );
  });

  it("rechaza URLs externas y protocol-relative", () => {
    expect(sanitizeAuthCallbackNextPath("https://evil.test/admin")).toBe("/admin/dashboard");
    expect(sanitizeAuthCallbackNextPath("//evil.test/admin")).toBe("/admin/dashboard");
  });

  it("usa el dashboard admin como fallback", () => {
    expect(sanitizeAuthCallbackNextPath(null)).toBe("/admin/dashboard");
    expect(sanitizeAuthCallbackNextPath("dashboard")).toBe("/admin/dashboard");
  });
});
