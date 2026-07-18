import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/supabase-auth", () => ({
  getAuthenticatedSupabaseUser: vi.fn(),
}));

describe("POST /api/payments/create-preference", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 410 because MercadoPago subscription billing is disabled", async () => {
    const { POST } = await import("./route");
    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body).toEqual({
      ok: false,
      error: "mp_subscription_disabled",
      message:
        "MercadoPago ya no está disponible para suscripciones. Usá transferencia o tarjeta (Polar).",
    });
  });
});
