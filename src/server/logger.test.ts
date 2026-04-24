import { afterEach, describe, expect, it, vi } from "vitest";

import { createLogger } from "@/server/logger";

describe("server logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.LOG_INFO_IN_TESTS;
  });

  it("skips info logs during tests by default", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    createLogger("Test Scope").info("hello");

    expect(infoSpy).not.toHaveBeenCalled();
  });

  it("prints info logs during tests when explicitly enabled", () => {
    process.env.LOG_INFO_IN_TESTS = "true";
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    createLogger("Test Scope").info("hello", { ok: true });

    expect(infoSpy).toHaveBeenCalledWith("[Test Scope] hello", { ok: true });
  });

  it("normalizes Error metadata for error logs", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("boom");

    createLogger("Test Scope").error("failed", error);

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0]?.[0]).toBe("[Test Scope] failed");
    expect(errorSpy.mock.calls[0]?.[1]).toMatchObject({
      name: "Error",
      message: "boom",
    });
  });

  it("sanitizes sensitive strings and metadata", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    createLogger("Test Scope").warn("token=abc123 para juan@example.com", {
      email: "cliente@example.com",
      phone: "+54 11 5555-0101",
      accessToken: "mp-token-real",
      nested: {
        authorization: "Bearer super-secret-token",
        note: "Llamar al 1155550101",
      },
    });

    expect(warnSpy).toHaveBeenCalledWith(
      "[Test Scope] token=[REDACTED_SECRET] para [REDACTED_EMAIL]",
      {
        email: "[REDACTED_EMAIL]",
        phone: "[REDACTED_PHONE]",
        accessToken: "[REDACTED]",
        nested: {
          authorization: "[REDACTED]",
          note: "Llamar al [REDACTED_PHONE]",
        },
      }
    );
  });
});
