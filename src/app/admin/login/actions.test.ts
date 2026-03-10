import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitStoreForTests } from "@/server/rate-limit";

const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-forwarded-for": "198.51.100.10" })),
}));

vi.mock("@/lib/runtime", () => ({
  isDemoModeEnabled: vi.fn(() => false),
}));

vi.mock("@/lib/pocketbase/config", () => ({
  isPocketBaseConfigured: vi.fn(() => false),
}));

describe("admin login rate limit", () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
    redirectMock.mockClear();
  });

  it("blocks repeated login attempts with a rate-limit message", async () => {
    const { loginAction } = await import("./actions");
    const formData = new FormData();
    formData.set("email", "owner@example.com");
    formData.set("password", "wrong-password");

    const redirectedUrls: string[] = [];

    for (let index = 0; index < 6; index += 1) {
      try {
        await loginAction(formData);
      } catch (error) {
        redirectedUrls.push(String((error as Error).message).replace("REDIRECT:", ""));
      }
    }

    expect(decodeURIComponent(redirectedUrls[4] ?? "")).toContain("acceso admin esta deshabilitado");
    expect(decodeURIComponent(redirectedUrls[5] ?? "")).toContain("Demasiados intentos de login");
  });
});
