import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitStoreForTests } from "@/server/rate-limit";

const {
  redirectMock,
  isPocketBaseConfiguredMock,
  createPocketBaseServerClientMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  isPocketBaseConfiguredMock: vi.fn(() => false),
  createPocketBaseServerClientMock: vi.fn(),
}));

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
  isPocketBaseConfigured: isPocketBaseConfiguredMock,
}));

vi.mock("@/lib/pocketbase/server", () => ({
  createPocketBaseServerClient: createPocketBaseServerClientMock,
  persistPocketBaseAuth: vi.fn(),
}));

describe("admin login rate limit", () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
    redirectMock.mockClear();
    isPocketBaseConfiguredMock.mockReset();
    isPocketBaseConfiguredMock.mockReturnValue(false);
    createPocketBaseServerClientMock.mockReset();
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

  it("requests a password reset when PocketBase is configured", async () => {
    isPocketBaseConfiguredMock.mockReturnValue(true);
    const requestPasswordResetMock = vi.fn(async () => true);

    createPocketBaseServerClientMock.mockResolvedValue({
      collection: vi.fn(() => ({
        requestPasswordReset: requestPasswordResetMock,
      })),
    });

    const { forgotPasswordAction } = await import("./actions");
    const formData = new FormData();
    formData.set("email", "owner@example.com");

    await expect(forgotPasswordAction(formData)).rejects.toThrow("REDIRECT:");
    expect(requestPasswordResetMock).toHaveBeenCalledWith("owner@example.com");
    expect(decodeURIComponent(String(redirectMock.mock.calls.at(-1)?.[0] ?? ""))).toContain(
      "Si el correo existe"
    );
  });

  it("confirms a password reset token with the new password", async () => {
    isPocketBaseConfiguredMock.mockReturnValue(true);
    const confirmPasswordResetMock = vi.fn(async () => true);

    createPocketBaseServerClientMock.mockResolvedValue({
      collection: vi.fn(() => ({
        confirmPasswordReset: confirmPasswordResetMock,
      })),
    });

    const { resetPasswordAction } = await import("./actions");
    const formData = new FormData();
    formData.set("token", "reset_token_1234567890");
    formData.set("password", "NuevaClave123");
    formData.set("passwordConfirm", "NuevaClave123");

    await expect(resetPasswordAction(formData)).rejects.toThrow("REDIRECT:");
    expect(confirmPasswordResetMock).toHaveBeenCalledWith(
      "reset_token_1234567890",
      "NuevaClave123",
      "NuevaClave123"
    );
    expect(decodeURIComponent(String(redirectMock.mock.calls.at(-1)?.[0] ?? ""))).toContain(
      "Contrasena actualizada"
    );
  });
});
