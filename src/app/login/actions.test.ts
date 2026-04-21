import { beforeEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitStoreForTests } from "@/server/rate-limit";

const {
  redirectMock,
  unstableRethrowMock,
  signInSupabaseUserMock,
  createSupabaseOwnerAccountMock,
  resetSupabaseUserPasswordMock,
  updateSupabaseUserPasswordMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  unstableRethrowMock: vi.fn((error: unknown) => {
    if (error instanceof Error && error.message.startsWith("REDIRECT:")) {
      throw error;
    }
  }),
  signInSupabaseUserMock: vi.fn(),
  createSupabaseOwnerAccountMock: vi.fn(),
  resetSupabaseUserPasswordMock: vi.fn(),
  updateSupabaseUserPasswordMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  unstable_rethrow: unstableRethrowMock,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ "x-forwarded-for": "198.51.100.10" })),
}));

vi.mock("@/server/supabase-auth", () => ({
  signInSupabaseUser: signInSupabaseUserMock,
  createSupabaseOwnerAccount: createSupabaseOwnerAccountMock,
  resetSupabaseUserPassword: resetSupabaseUserPasswordMock,
  updateSupabaseUserPassword: updateSupabaseUserPasswordMock,
}));

describe("loginAction", () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
    redirectMock.mockClear();
    unstableRethrowMock.mockClear();
    signInSupabaseUserMock.mockReset();
  });

  it("rejects login with missing email or password", async () => {
    const { loginAction } = await import("./actions");

    const formData = new FormData();
    formData.set("email", "");
    formData.set("password", "password123");

    await expect(loginAction(formData)).rejects.toThrow("REDIRECT:");
    expect(redirectMock).toHaveBeenCalled();
    expect(redirectMock.mock.calls.at(-1)?.[0]).toContain("error=");
    expect(signInSupabaseUserMock).not.toHaveBeenCalled();
  });

  it("rejects login with invalid email format", async () => {
    const { loginAction } = await import("./actions");

    const formData = new FormData();
    formData.set("email", "not-an-email");
    formData.set("password", "password123");

    await expect(loginAction(formData)).rejects.toThrow("REDIRECT:");
    expect(redirectMock).toHaveBeenCalled();
    expect(redirectMock.mock.calls.at(-1)?.[0]).toContain("error=");
  });

  it("redirects to dashboard on successful login", async () => {
    signInSupabaseUserMock.mockResolvedValue({ id: "user_1", email: "owner@example.com" });

    const { loginAction } = await import("./actions");

    const formData = new FormData();
    formData.set("email", "owner@example.com");
    formData.set("password", "password123");

    await expect(loginAction(formData)).rejects.toThrow("REDIRECT:/admin/dashboard");
    expect(signInSupabaseUserMock).toHaveBeenCalledWith("owner@example.com", "password123");
  });

  it("shows error message on auth failure", async () => {
    signInSupabaseUserMock.mockRejectedValue(new Error("Invalid login credentials"));

    const { loginAction } = await import("./actions");

    const formData = new FormData();
    formData.set("email", "owner@example.com");
    formData.set("password", "wrongpassword");

    await expect(loginAction(formData)).rejects.toThrow("REDIRECT:");
    expect(redirectMock).toHaveBeenCalled();
    expect(redirectMock.mock.calls.at(-1)?.[0]).toContain("error=");
  });

  it("blocks repeated login attempts after max retries", async () => {
    signInSupabaseUserMock.mockRejectedValue(new Error("Invalid credentials"));

    const { loginAction } = await import("./actions");

    const errors: string[] = [];
    for (let i = 0; i < 6; i++) {
      const formData = new FormData();
      formData.set("email", "owner@example.com");
      formData.set("password", "wrongpassword");

      try {
        await loginAction(formData);
      } catch (e) {
        errors.push(String(e));
      }
    }

    expect(errors.length).toBe(6);
    const lastError = errors[errors.length - 1];
    expect(lastError).toContain("Demasiados");
  });
});

describe("signupAction", () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
    redirectMock.mockClear();
    createSupabaseOwnerAccountMock.mockReset();
    signInSupabaseUserMock.mockReset();
  });

  it("rejects signup with missing required fields", async () => {
    const { signupAction } = await import("./actions");

    const formData = new FormData();
    formData.set("ownerName", "");
    formData.set("businessName", "Mi Negocio");
    formData.set("businessSlug", "mi-negocio");
    formData.set("templateSlug", "demo-barberia");
    formData.set("phone", "1122334455");
    formData.set("address", "Calle 123");
    formData.set("email", "owner@example.com");
    formData.set("password", "password123");

    await expect(signupAction(formData)).rejects.toThrow("REDIRECT:");
    expect(redirectMock).toHaveBeenCalled();
    expect(redirectMock.mock.calls.at(-1)?.[0]).toContain("error=");
  });

  it("rejects signup with password shorter than 8 characters", async () => {
    const { signupAction } = await import("./actions");

    const formData = new FormData();
    formData.set("ownerName", "Juan");
    formData.set("businessName", "Mi Negocio");
    formData.set("businessSlug", "mi-negocio");
    formData.set("templateSlug", "demo-barberia");
    formData.set("phone", "1122334455");
    formData.set("address", "Calle 123");
    formData.set("email", "owner@example.com");
    formData.set("password", "short");

    await expect(signupAction(formData)).rejects.toThrow("REDIRECT:");
    expect(redirectMock).toHaveBeenCalled();
    expect(redirectMock.mock.calls.at(-1)?.[0]).toContain("error=");
    expect(redirectMock.mock.calls.at(-1)?.[0]).toContain("contrasena");
  });

  it("creates account and redirects to onboarding on success", async () => {
    createSupabaseOwnerAccountMock.mockResolvedValue({ id: "user_1", email: "owner@example.com" });
    signInSupabaseUserMock.mockResolvedValue({ id: "user_1", email: "owner@example.com" });

    const { signupAction } = await import("./actions");

    const formData = new FormData();
    formData.set("ownerName", "Juan");
    formData.set("businessName", "Mi Barberia");
    formData.set("businessSlug", "mi-barberia");
    formData.set("templateSlug", "demo-barberia");
    formData.set("phone", "1122334455");
    formData.set("address", "Calle 123");
    formData.set("email", "owner@example.com");
    formData.set("password", "password123");

    await expect(signupAction(formData)).rejects.toThrow("REDIRECT:");
    expect(redirectMock).toHaveBeenCalled();
    const redirectCall = redirectMock.mock.calls.at(-1)?.[0] ?? "";
    expect(redirectCall).toContain("onboarding");
    expect(redirectCall).toContain("created%3Dmi-barberia");
    expect(createSupabaseOwnerAccountMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerName: "Juan",
        email: "owner@example.com",
        businessName: "Mi Barberia",
        businessSlug: "mi-barberia",
      })
    );
  });

  it("shows error message on account creation failure", async () => {
    createSupabaseOwnerAccountMock.mockRejectedValue(new Error("El correo ya esta registrado"));

    const { signupAction } = await import("./actions");

    const formData = new FormData();
    formData.set("ownerName", "Juan");
    formData.set("businessName", "Mi Barberia");
    formData.set("businessSlug", "mi-barberia");
    formData.set("templateSlug", "demo-barberia");
    formData.set("phone", "1122334455");
    formData.set("address", "Calle 123");
    formData.set("email", "owner@example.com");
    formData.set("password", "password123");

    await expect(signupAction(formData)).rejects.toThrow("REDIRECT:");
    expect(redirectMock).toHaveBeenCalled();
    expect(redirectMock.mock.calls.at(-1)?.[0]).toContain("error=");
  });

  it("blocks repeated signup attempts after max retries", async () => {
    createSupabaseOwnerAccountMock.mockRejectedValue(new Error("Error"));

    const { signupAction } = await import("./actions");

    const errors: string[] = [];
    for (let i = 0; i < 4; i++) {
      const formData = new FormData();
      formData.set("ownerName", "Juan");
      formData.set("businessName", "Mi Barberia");
      formData.set("businessSlug", `mi-barberia-${i}`);
      formData.set("templateSlug", "demo-barberia");
      formData.set("phone", "1122334455");
      formData.set("address", "Calle 123");
      formData.set("email", `owner${i}@example.com`);
      formData.set("password", "password123");

      try {
        await signupAction(formData);
      } catch (e) {
        errors.push(String(e));
      }
    }

    expect(errors.length).toBe(4);
    expect(errors[errors.length - 1]).toContain("Demasiados");
  });
});

describe("forgotPasswordAction", () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
    redirectMock.mockClear();
    resetSupabaseUserPasswordMock.mockReset();
  });

  it("redirects missing email error", async () => {
    const { forgotPasswordAction } = await import("./actions");

    const formData = new FormData();
    formData.set("email", "");

    await expect(forgotPasswordAction(formData)).rejects.toThrow("REDIRECT:");
    expect(redirectMock).toHaveBeenCalled();
    expect(redirectMock.mock.calls.at(-1)?.[0]).toContain("error=");
  });

  it("always redirects success for security (does not reveal if email exists)", async () => {
    resetSupabaseUserPasswordMock.mockResolvedValue(undefined);

    const { forgotPasswordAction } = await import("./actions");

    const formData = new FormData();
    formData.set("email", "nonexistent@example.com");

    await expect(forgotPasswordAction(formData)).rejects.toThrow("REDIRECT:");
    expect(redirectMock).toHaveBeenCalled();
    expect(redirectMock.mock.calls.at(-1)?.[0]).toContain("success=");
    expect(resetSupabaseUserPasswordMock).toHaveBeenCalledWith("nonexistent@example.com");
  });

  it("shows error on reset password failure", async () => {
    resetSupabaseUserPasswordMock.mockRejectedValue(new Error("Email not found"));

    const { forgotPasswordAction } = await import("./actions");

    const formData = new FormData();
    formData.set("email", "owner@example.com");

    await expect(forgotPasswordAction(formData)).rejects.toThrow("REDIRECT:");
    expect(redirectMock).toHaveBeenCalled();
    expect(redirectMock.mock.calls.at(-1)?.[0]).toContain("error=");
  });

  it("blocks repeated password reset requests after max retries", async () => {
    resetSupabaseUserPasswordMock.mockResolvedValue(undefined);

    const { forgotPasswordAction } = await import("./actions");

    const errors: string[] = [];
    for (let i = 0; i < 4; i++) {
      const formData = new FormData();
      formData.set("email", "owner@example.com");

      try {
        await forgotPasswordAction(formData);
      } catch (e) {
        errors.push(String(e));
      }
    }

    expect(errors.length).toBe(4);
    expect(errors[errors.length - 1]).toContain("Demasiados");
  });
});

describe("resetPasswordAction", () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
    redirectMock.mockClear();
    updateSupabaseUserPasswordMock.mockReset();
  });

  it("returns error when token is missing", async () => {
    const { resetPasswordAction } = await import("./actions");

    const formData = new FormData();
    formData.set("token", "");
    formData.set("password", "password123");
    formData.set("passwordConfirm", "password123");

    const result = await resetPasswordAction(null, formData);
    expect(result).toMatchObject({ error: expect.stringContaining("Token") });
    expect(updateSupabaseUserPasswordMock).not.toHaveBeenCalled();
  });

  it("returns error when passwords do not match", async () => {
    const { resetPasswordAction } = await import("./actions");

    const formData = new FormData();
    formData.set("token", "valid_token");
    formData.set("password", "password123");
    formData.set("passwordConfirm", "password456");

    const result = await resetPasswordAction(null, formData);
    expect(result).toMatchObject({ error: expect.stringContaining("coinciden") });
    expect(updateSupabaseUserPasswordMock).not.toHaveBeenCalled();
  });

  it("returns error when password is too short", async () => {
    const { resetPasswordAction } = await import("./actions");

    const formData = new FormData();
    formData.set("token", "valid_token");
    formData.set("password", "short");
    formData.set("passwordConfirm", "short");

    const result = await resetPasswordAction(null, formData);
    expect(result).toMatchObject({ error: expect.stringContaining("8 caracteres") });
    expect(updateSupabaseUserPasswordMock).not.toHaveBeenCalled();
  });

  it("redirects to login on successful password reset", async () => {
    updateSupabaseUserPasswordMock.mockResolvedValue(undefined);
    const { resetPasswordAction } = await import("./actions");

    const formData = new FormData();
    formData.set("token", "valid_reset_token");
    formData.set("password", "NewPassword123");
    formData.set("passwordConfirm", "NewPassword123");

    await expect(resetPasswordAction(null, formData)).rejects.toThrow("REDIRECT:");
    expect(updateSupabaseUserPasswordMock).toHaveBeenCalledWith("valid_reset_token", "NewPassword123");
    expect(redirectMock.mock.calls.at(-1)?.[0]).toContain("/login?success=");
  });

  it("returns error when Supabase call fails", async () => {
    updateSupabaseUserPasswordMock.mockRejectedValue(new Error("Token inválido o expirado."));
    const { resetPasswordAction } = await import("./actions");

    const formData = new FormData();
    formData.set("token", "expired_token");
    formData.set("password", "NewPassword123");
    formData.set("passwordConfirm", "NewPassword123");

    const result = await resetPasswordAction(null, formData);
    expect(result).toMatchObject({ error: expect.stringContaining("Token") });
  });

  it("returns rate limit error after max retries", async () => {
    updateSupabaseUserPasswordMock.mockResolvedValue(undefined);
    const { resetPasswordAction } = await import("./actions");

    const results: Array<{ error: string }> = [];
    for (let i = 0; i < 6; i++) {
      const formData = new FormData();
      formData.set("token", "reset_token");
      formData.set("password", "password123");
      formData.set("passwordConfirm", "password123");

      try {
        const result = await resetPasswordAction(null, formData);
        if (result) results.push(result);
      } catch {
        // success redirects throw
      }
    }

    expect(results.length).toBeGreaterThan(0);
    expect(results.at(-1)?.error).toContain("Demasiados");
  });
});

describe("resendVerificationAction", () => {
  it("redirects to admin dashboard", async () => {
    const { resendVerificationAction } = await import("./actions");

    await expect(resendVerificationAction()).rejects.toThrow("REDIRECT:/admin/dashboard");
  });
});

describe("confirmEmailVerificationAction", () => {
  it("redirects to login", async () => {
    const { confirmEmailVerificationAction } = await import("./actions");

    await expect(confirmEmailVerificationAction("verify_token")).rejects.toThrow("REDIRECT:/login");
  });
});
