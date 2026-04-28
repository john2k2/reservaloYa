import { afterEach, describe, expect, it, vi } from "vitest";

import { buildImpersonationRedirectTo } from "./platform-impersonation";

describe("buildImpersonationRedirectTo", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("apunta el magic link al callback de auth y al dashboard admin", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://reservaya.ar");

    expect(buildImpersonationRedirectTo()).toBe(
      "https://reservaya.ar/auth/callback?next=%2Fadmin%2Fdashboard"
    );
  });

  it("sanitiza next antes de construir redirectTo", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://reservaya.ar");

    expect(buildImpersonationRedirectTo("https://evil.test")).toBe(
      "https://reservaya.ar/auth/callback?next=%2Fadmin%2Fdashboard"
    );
  });
});
