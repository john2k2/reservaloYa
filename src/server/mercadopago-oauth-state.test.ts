import { afterEach, describe, expect, it } from "vitest";

import {
  createMercadoPagoOAuthState,
  parseMercadoPagoOAuthState,
} from "@/server/mercadopago-oauth-state";

const originalSecret = process.env.MP_APP_SECRET;

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env.MP_APP_SECRET;
  } else {
    process.env.MP_APP_SECRET = originalSecret;
  }
});

describe("mercadopago oauth state", () => {
  it("creates and validates a signed state payload", () => {
    process.env.MP_APP_SECRET = "mp-oauth-secret";

    const state = createMercadoPagoOAuthState({
      businessSlug: "demo-barberia",
      businessId: "abcd1234business",
    });

    expect(
      parseMercadoPagoOAuthState(state)
    ).toMatchObject({
      businessSlug: "demo-barberia",
      businessId: "abcd1234business",
    });
  });

  it("rejects tampered states", () => {
    process.env.MP_APP_SECRET = "mp-oauth-secret";

    const state = createMercadoPagoOAuthState({
      businessSlug: "demo-barberia",
    });

    expect(parseMercadoPagoOAuthState(`${state}tampered`)).toBeNull();
  });
});
