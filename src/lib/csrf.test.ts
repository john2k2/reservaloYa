import { afterEach, describe, expect, it } from "vitest";

import { generateCsrfToken, validateCsrfToken } from "./csrf";

const writableEnv = process.env as Record<string, string | undefined>;

describe("csrf tokens", () => {
  const originalEnv = process.env.CSRF_SECRET;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAllowDevSecrets = process.env.ALLOW_DEV_SECRETS;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete writableEnv.CSRF_SECRET;
    } else {
      writableEnv.CSRF_SECRET = originalEnv;
    }

    if (originalNodeEnv === undefined) {
      delete writableEnv.NODE_ENV;
    } else {
      writableEnv.NODE_ENV = originalNodeEnv;
    }

    if (originalAllowDevSecrets === undefined) {
      delete writableEnv.ALLOW_DEV_SECRETS;
    } else {
      writableEnv.ALLOW_DEV_SECRETS = originalAllowDevSecrets;
    }
  });

  it("generates a token that validates for the same user", () => {
    process.env.CSRF_SECRET = "test-secret";
    const token = generateCsrfToken("user-1");

    expect(validateCsrfToken(token, "user-1")).toBe(true);
  });

  it("rejects a token for a different user", () => {
    process.env.CSRF_SECRET = "test-secret";
    const token = generateCsrfToken("user-1");

    expect(validateCsrfToken(token, "user-2")).toBe(false);
  });

  it("rejects a token signed with a different secret", () => {
    process.env.CSRF_SECRET = "test-secret";
    const token = generateCsrfToken("user-1");

    process.env.CSRF_SECRET = "other-secret";
    expect(validateCsrfToken(token, "user-1")).toBe(false);
  });

  it("rejects a malformed token", () => {
    process.env.CSRF_SECRET = "test-secret";

    expect(validateCsrfToken("not-a-token", "user-1")).toBe(false);
    expect(validateCsrfToken(null, "user-1")).toBe(false);
    expect(validateCsrfToken("token-without-signature", "user-1")).toBe(false);
  });

  it("uses development fallback secret outside production when explicitly allowed", () => {
    delete process.env.CSRF_SECRET;
    writableEnv.NODE_ENV = "development";
    writableEnv.ALLOW_DEV_SECRETS = "1";

    const token = generateCsrfToken("user-1");
    expect(validateCsrfToken(token, "user-1")).toBe(true);
  });

  it("throws outside production when dev fallback is not allowed", () => {
    delete process.env.CSRF_SECRET;
    writableEnv.NODE_ENV = "development";
    delete writableEnv.ALLOW_DEV_SECRETS;

    expect(() => generateCsrfToken("user-1")).toThrow(
      "Missing environment variable: CSRF_SECRET"
    );
  });
});
