import { afterEach, describe, expect, it } from "vitest";

import { generateCsrfToken, validateCsrfToken } from "./csrf";

describe("csrf tokens", () => {
  const originalEnv = process.env.CSRF_SECRET;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.CSRF_SECRET;
    } else {
      process.env.CSRF_SECRET = originalEnv;
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
});
