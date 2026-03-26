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
});
