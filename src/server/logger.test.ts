import { afterEach, describe, expect, it, vi } from "vitest";

const { mockCaptureException, mockCaptureMessage } = vi.hoisted(() => ({
  mockCaptureException: vi.fn(),
  mockCaptureMessage: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mockCaptureException,
  captureMessage: mockCaptureMessage,
}));

import { createLogger } from "@/server/logger";

describe("server logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockCaptureException.mockClear();
    mockCaptureMessage.mockClear();
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

  it("reports Error metadata to Sentry via captureException", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("boom");

    createLogger("Test Scope").error("failed", error);

    expect(mockCaptureException).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).toHaveBeenCalledWith(error, {
      tags: { scope: "Test Scope" },
      extra: { message: "failed" },
    });
    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });

  it("reports non-Error metadata to Sentry via captureMessage", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    createLogger("Test Scope").error("failed", { foo: "bar" });

    expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
    expect(mockCaptureMessage).toHaveBeenCalledWith("[Test Scope] failed", {
      level: "error",
      tags: { scope: "Test Scope" },
      extra: { meta: { foo: "bar" } },
    });
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it("does not report warn logs to Sentry", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    createLogger("Test Scope").warn("heads up", { foo: "bar" });

    expect(mockCaptureException).not.toHaveBeenCalled();
    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });

  it("sanitizes sensitive metadata before it reaches Sentry", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    createLogger("Test Scope").error("token=abc123 leaked", {
      email: "cliente@example.com",
      accessToken: "mp-token-real",
    });

    expect(mockCaptureMessage).toHaveBeenCalledWith(
      "[Test Scope] token=[REDACTED_SECRET] leaked",
      {
        level: "error",
        tags: { scope: "Test Scope" },
        extra: { meta: { email: "[REDACTED_EMAIL]", accessToken: "[REDACTED]" } },
      }
    );
  });
});
