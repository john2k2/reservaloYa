import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const REQUIRED_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
};

describe("env validation", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    for (const [key, value] of Object.entries(REQUIRED_ENV)) {
      vi.stubEnv(key, value);
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("exposes parsed environment variables when they are valid", async () => {
    const { env, getRequiredEnv } = await import("./env");

    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe(REQUIRED_ENV.NEXT_PUBLIC_SUPABASE_URL);
    expect(getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL")).toBe(REQUIRED_ENV.NEXT_PUBLIC_SUPABASE_URL);
  });

  it("throws on startup when required variables are missing and validation is not skipped", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("SKIP_ENV_VALIDATION", "false");

    for (const key of Object.keys(REQUIRED_ENV)) {
      delete process.env[key];
    }

    await expect(import("./env")).rejects.toThrow(/Invalid environment variables/i);
  });

  it("soft-fails in production when required variables are missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SKIP_ENV_VALIDATION", "false");

    for (const key of Object.keys(REQUIRED_ENV)) {
      delete process.env[key];
    }

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { env } = await import("./env");

    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Invalid environment variables")
    );

    consoleSpy.mockRestore();
  });

  it("allows tests to skip validation via SKIP_ENV_VALIDATION", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SKIP_ENV_VALIDATION", "true");

    for (const key of Object.keys(REQUIRED_ENV)) {
      delete process.env[key];
    }

    const { env } = await import("./env");

    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined();
    expect(() => env).not.toThrow();
  });
});
