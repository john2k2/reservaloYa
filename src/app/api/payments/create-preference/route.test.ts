import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getAuthenticatedSupabaseUserMock,
} = vi.hoisted(() => ({
  getAuthenticatedSupabaseUserMock: vi.fn(),
}));

const { getBlueDollarRateMock } = vi.hoisted(() => ({
  getBlueDollarRateMock: vi.fn(),
}));

const { createSubscriptionPreferenceMock, isMercadoPagoConfiguredMock } = vi.hoisted(() => ({
  createSubscriptionPreferenceMock: vi.fn(),
  isMercadoPagoConfiguredMock: vi.fn(),
}));

const { createSupabaseSubscriptionPaymentAttemptMock } = vi.hoisted(() => ({
  createSupabaseSubscriptionPaymentAttemptMock: vi.fn(),
}));

const { validateCsrfTokenMock } = vi.hoisted(() => ({
  validateCsrfTokenMock: vi.fn(),
}));

vi.mock("@/server/supabase-auth", () => ({
  getAuthenticatedSupabaseUser: getAuthenticatedSupabaseUserMock,
}));

vi.mock("@/lib/dollar-rate", () => ({
  getBlueDollarRate: getBlueDollarRateMock,
}));

vi.mock("@/server/mercadopago", () => ({
  createSubscriptionPreference: createSubscriptionPreferenceMock,
  isMercadoPagoConfigured: isMercadoPagoConfiguredMock,
}));

vi.mock("@/server/supabase-store", () => ({
  createSupabaseSubscriptionPaymentAttempt: createSupabaseSubscriptionPaymentAttemptMock,
}));

vi.mock("@/lib/csrf", () => ({
  CSRF_TOKEN_HEADER: "X-CSRF-Token",
  validateCsrfToken: validateCsrfTokenMock,
}));

function createPostRequest(token?: string) {
  const headers: Record<string, string> = {};
  if (token) {
    headers["X-CSRF-Token"] = token;
  }

  return new Request("http://localhost/api/payments/create-preference", {
    method: "POST",
    headers,
  });
}

describe("create preference route", () => {
  beforeEach(() => {
    vi.resetModules();
    getAuthenticatedSupabaseUserMock.mockReset();
    getBlueDollarRateMock.mockReset();
    createSubscriptionPreferenceMock.mockReset();
    isMercadoPagoConfiguredMock.mockReset();
    createSupabaseSubscriptionPaymentAttemptMock.mockReset();
    validateCsrfTokenMock.mockReset();

    validateCsrfTokenMock.mockReturnValue(true);
    isMercadoPagoConfiguredMock.mockReturnValue(true);
    createSupabaseSubscriptionPaymentAttemptMock.mockResolvedValue({ id: "attempt-1" });
  });

  it("returns 401 when there is no authenticated user", async () => {
    getAuthenticatedSupabaseUserMock.mockResolvedValue(null);
    const { POST } = await import("./route");

    const response = await POST(createPostRequest("valid-token"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ ok: false, error: "unauthorized" });
  });

  it("returns 401 when user has no linked business", async () => {
    getAuthenticatedSupabaseUserMock.mockResolvedValue({
      id: "u1",
      email: "user@demo.com",
      role: "owner",
    });
    const { POST } = await import("./route");

    const response = await POST(createPostRequest("valid-token"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ ok: false, error: "unauthorized" });
  });

  it("returns 403 when csrf token is invalid", async () => {
    validateCsrfTokenMock.mockReturnValue(false);
    getAuthenticatedSupabaseUserMock.mockResolvedValue({
      id: "u1",
      email: "owner@demo.com",
      role: "owner",
      businessId: "biz-1",
    });
    const { POST } = await import("./route");

    const response = await POST(createPostRequest("bad-token"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ ok: false, error: "invalid_csrf" });
  });

  it("returns 503 when MP is not configured", async () => {
    getAuthenticatedSupabaseUserMock.mockResolvedValue({
      id: "u1",
      email: "owner@demo.com",
      role: "owner",
      businessId: "biz-1",
    });
    isMercadoPagoConfiguredMock.mockReturnValue(false);
    const { POST } = await import("./route");

    const response = await POST(createPostRequest("valid-token"));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({ ok: false, error: "mp_not_configured" });
  });

  it("creates a subscription preference and returns checkout url", async () => {
    getAuthenticatedSupabaseUserMock.mockResolvedValue({
      id: "u1",
      email: "owner@demo.com",
      role: "owner",
      businessId: "biz-1",
    });
    getBlueDollarRateMock.mockResolvedValue(1200);
    createSubscriptionPreferenceMock.mockResolvedValue({
      ok: true,
      preferenceId: "pref-123",
      checkoutUrl: "https://mp.test/checkout/123",
    });
    const { POST } = await import("./route");

    const response = await POST(createPostRequest("valid-token"));
    const body = await response.json();

    expect(createSubscriptionPreferenceMock).toHaveBeenCalledWith({
      businessId: "biz-1",
      priceAmount: 22 * 1200,
    });
    expect(createSupabaseSubscriptionPaymentAttemptMock).toHaveBeenCalledWith({
      businessId: "biz-1",
      preferenceId: "pref-123",
      amountArs: 22 * 1200,
      currency: "ARS",
      blueRate: 1200,
      status: "pending",
    });
    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      checkoutUrl: "https://mp.test/checkout/123",
    });
  });

  it("returns 500 when the payment attempt cannot be stored", async () => {
    getAuthenticatedSupabaseUserMock.mockResolvedValue({
      id: "u1",
      email: "owner@demo.com",
      role: "owner",
      businessId: "biz-1",
    });
    getBlueDollarRateMock.mockResolvedValue(1200);
    createSubscriptionPreferenceMock.mockResolvedValue({
      ok: true,
      preferenceId: "pref-123",
      checkoutUrl: "https://mp.test/checkout/123",
    });
    createSupabaseSubscriptionPaymentAttemptMock.mockRejectedValue(new Error("db down"));
    const { POST } = await import("./route");

    const response = await POST(createPostRequest("valid-token"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ ok: false, error: "attempt_failed" });
  });

  it("returns 500 when preference creation fails", async () => {
    getAuthenticatedSupabaseUserMock.mockResolvedValue({
      id: "u1",
      email: "owner@demo.com",
      role: "owner",
      businessId: "biz-1",
    });
    getBlueDollarRateMock.mockResolvedValue(1200);
    createSubscriptionPreferenceMock.mockResolvedValue({
      ok: false,
      error: "MP error",
    });
    const { POST } = await import("./route");

    const response = await POST(createPostRequest("valid-token"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ ok: false, error: "preference_failed" });
  });
});
