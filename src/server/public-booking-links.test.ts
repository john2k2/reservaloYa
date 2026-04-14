import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildAbsoluteManageBookingUrl,
  buildAbsoluteReviewUrl,
  buildManageBookingHref,
  buildReviewHref,
  canGenerateBookingManageLinks,
  createBookingManageToken,
  isValidBookingManageToken,
} from "./public-booking-links";

const originalEnv = {
  BOOKING_LINK_SECRET: process.env.BOOKING_LINK_SECRET,
  NEXT_PUBLIC_POCKETBASE_URL: process.env.NEXT_PUBLIC_POCKETBASE_URL,
  RESERVAYA_ENABLE_DEMO_MODE: process.env.RESERVAYA_ENABLE_DEMO_MODE,
};

function restoreEnvValue(key: keyof typeof originalEnv, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

afterEach(() => {
  restoreEnvValue("BOOKING_LINK_SECRET", originalEnv.BOOKING_LINK_SECRET);
  restoreEnvValue("NEXT_PUBLIC_POCKETBASE_URL", originalEnv.NEXT_PUBLIC_POCKETBASE_URL);
  restoreEnvValue("RESERVAYA_ENABLE_DEMO_MODE", originalEnv.RESERVAYA_ENABLE_DEMO_MODE);
});

describe("public booking link secret handling", () => {
  it("uses demo fallback secret in local runtime", () => {
    delete process.env.BOOKING_LINK_SECRET;
    delete process.env.NEXT_PUBLIC_POCKETBASE_URL;
    process.env.RESERVAYA_ENABLE_DEMO_MODE = "false";

    expect(canGenerateBookingManageLinks()).toBe(true);

    const token = createBookingManageToken("demo-barberia", "booking-1");
    expect(isValidBookingManageToken({ slug: "demo-barberia", bookingId: "booking-1", token })).toBe(
      true
    );
  });

  it("requires explicit secret outside local/demo runtime", () => {
    delete process.env.BOOKING_LINK_SECRET;
    process.env.NEXT_PUBLIC_POCKETBASE_URL = "http://127.0.0.1:8090";
    process.env.RESERVAYA_ENABLE_DEMO_MODE = "false";

    expect(canGenerateBookingManageLinks()).toBe(false);
    expect(() => createBookingManageToken("demo-barberia", "booking-1")).toThrow(
      "Missing environment variable: BOOKING_LINK_SECRET (required outside local/demo runtime)"
    );
  });

  it("uses configured secret in production-like runtime", () => {
    process.env.BOOKING_LINK_SECRET = "super-secret";
    process.env.NEXT_PUBLIC_POCKETBASE_URL = "http://127.0.0.1:8090";
    process.env.RESERVAYA_ENABLE_DEMO_MODE = "false";

    expect(canGenerateBookingManageLinks()).toBe(true);

    const token = createBookingManageToken("demo-barberia", "booking-1");
    expect(isValidBookingManageToken({ slug: "demo-barberia", bookingId: "booking-1", token })).toBe(
      true
    );
  });
});

describe("isValidBookingManageToken — edge cases", () => {
  afterEach(() => {
    restoreEnvValue("BOOKING_LINK_SECRET", originalEnv.BOOKING_LINK_SECRET);
    restoreEnvValue("NEXT_PUBLIC_POCKETBASE_URL", originalEnv.NEXT_PUBLIC_POCKETBASE_URL);
    restoreEnvValue("RESERVAYA_ENABLE_DEMO_MODE", originalEnv.RESERVAYA_ENABLE_DEMO_MODE);
  });

  it("devuelve false si no se provee token", () => {
    delete process.env.BOOKING_LINK_SECRET;
    delete process.env.NEXT_PUBLIC_POCKETBASE_URL;
    expect(isValidBookingManageToken({ slug: "demo-barberia", bookingId: "b-1", token: undefined })).toBe(false);
  });

  it("devuelve false si el token está malformado", () => {
    delete process.env.BOOKING_LINK_SECRET;
    delete process.env.NEXT_PUBLIC_POCKETBASE_URL;
    expect(isValidBookingManageToken({ slug: "demo-barberia", bookingId: "b-1", token: "not-a-valid-token" })).toBe(false);
  });

  it("devuelve false si el slug del token no coincide", () => {
    delete process.env.BOOKING_LINK_SECRET;
    delete process.env.NEXT_PUBLIC_POCKETBASE_URL;
    const token = createBookingManageToken("otro-negocio", "b-1");
    expect(isValidBookingManageToken({ slug: "demo-barberia", bookingId: "b-1", token })).toBe(false);
  });

  it("devuelve false si el bookingId del token no coincide", () => {
    delete process.env.BOOKING_LINK_SECRET;
    delete process.env.NEXT_PUBLIC_POCKETBASE_URL;
    const token = createBookingManageToken("demo-barberia", "b-1");
    expect(isValidBookingManageToken({ slug: "demo-barberia", bookingId: "b-otro", token })).toBe(false);
  });

  it("devuelve false si la firma es inválida", () => {
    delete process.env.BOOKING_LINK_SECRET;
    delete process.env.NEXT_PUBLIC_POCKETBASE_URL;
    const token = createBookingManageToken("demo-barberia", "b-1");
    const [payload] = token.split(".");
    const tampered = `${payload}.invalidsignature`;
    expect(isValidBookingManageToken({ slug: "demo-barberia", bookingId: "b-1", token: tampered })).toBe(false);
  });
});

describe("buildManageBookingHref / buildAbsoluteManageBookingUrl", () => {
  afterEach(() => {
    restoreEnvValue("BOOKING_LINK_SECRET", originalEnv.BOOKING_LINK_SECRET);
    restoreEnvValue("NEXT_PUBLIC_POCKETBASE_URL", originalEnv.NEXT_PUBLIC_POCKETBASE_URL);
    restoreEnvValue("RESERVAYA_ENABLE_DEMO_MODE", originalEnv.RESERVAYA_ENABLE_DEMO_MODE);
  });

  it("genera el href relativo de gestión de turno", () => {
    delete process.env.BOOKING_LINK_SECRET;
    delete process.env.NEXT_PUBLIC_POCKETBASE_URL;
    const href = buildManageBookingHref("demo-barberia", "b-1");
    expect(href).toMatch(/^\/demo-barberia\/mi-turno\?booking=b-1&token=/);
  });

  it("devuelve null si no se puede generar el link", () => {
    delete process.env.BOOKING_LINK_SECRET;
    process.env.NEXT_PUBLIC_POCKETBASE_URL = "http://127.0.0.1:8090";
    process.env.RESERVAYA_ENABLE_DEMO_MODE = "false";
    expect(buildManageBookingHref("demo-barberia", "b-1")).toBeNull();
  });

  it("genera la URL absoluta de gestión de turno", () => {
    delete process.env.BOOKING_LINK_SECRET;
    delete process.env.NEXT_PUBLIC_POCKETBASE_URL;
    const url = buildAbsoluteManageBookingUrl("demo-barberia", "b-1");
    expect(url).toMatch(/\/demo-barberia\/mi-turno\?booking=b-1&token=/);
  });

  it("devuelve null en URL absoluta si no hay secret", () => {
    delete process.env.BOOKING_LINK_SECRET;
    process.env.NEXT_PUBLIC_POCKETBASE_URL = "http://127.0.0.1:8090";
    process.env.RESERVAYA_ENABLE_DEMO_MODE = "false";
    expect(buildAbsoluteManageBookingUrl("demo-barberia", "b-1")).toBeNull();
  });
});

describe("buildReviewHref / buildAbsoluteReviewUrl", () => {
  afterEach(() => {
    restoreEnvValue("BOOKING_LINK_SECRET", originalEnv.BOOKING_LINK_SECRET);
    restoreEnvValue("NEXT_PUBLIC_POCKETBASE_URL", originalEnv.NEXT_PUBLIC_POCKETBASE_URL);
    restoreEnvValue("RESERVAYA_ENABLE_DEMO_MODE", originalEnv.RESERVAYA_ENABLE_DEMO_MODE);
  });

  it("genera el href de reseña", () => {
    delete process.env.BOOKING_LINK_SECRET;
    delete process.env.NEXT_PUBLIC_POCKETBASE_URL;
    const href = buildReviewHref("demo-barberia", "b-1");
    expect(href).toMatch(/^\/demo-barberia\/resena\?booking=b-1&token=/);
  });

  it("devuelve null para reseña si no hay secret", () => {
    delete process.env.BOOKING_LINK_SECRET;
    process.env.NEXT_PUBLIC_POCKETBASE_URL = "http://127.0.0.1:8090";
    process.env.RESERVAYA_ENABLE_DEMO_MODE = "false";
    expect(buildReviewHref("demo-barberia", "b-1")).toBeNull();
  });

  it("genera URL absoluta de reseña", () => {
    delete process.env.BOOKING_LINK_SECRET;
    delete process.env.NEXT_PUBLIC_POCKETBASE_URL;
    const url = buildAbsoluteReviewUrl("demo-barberia", "b-1");
    expect(url).toMatch(/\/demo-barberia\/resena\?booking=b-1&token=/);
  });

  it("devuelve null en URL absoluta de reseña si no hay secret", () => {
    delete process.env.BOOKING_LINK_SECRET;
    process.env.NEXT_PUBLIC_POCKETBASE_URL = "http://127.0.0.1:8090";
    process.env.RESERVAYA_ENABLE_DEMO_MODE = "false";
    expect(buildAbsoluteReviewUrl("demo-barberia", "b-1")).toBeNull();
  });
});
