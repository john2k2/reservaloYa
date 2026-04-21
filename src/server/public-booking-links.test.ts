import { afterEach, describe, expect, it } from "vitest";

import {
  buildAbsoluteBookingConfirmationUrl,
  buildBookingConfirmationHref,
  buildAbsoluteManageBookingUrl,
  buildAbsoluteReviewUrl,
  createBookingConfirmationToken,
  buildManageBookingHref,
  buildReviewHref,
  canGenerateBookingManageLinks,
  createBookingManageToken,
  isValidBookingConfirmationToken,
  isValidBookingManageToken,
} from "./public-booking-links";

const originalEnv = {
  BOOKING_LINK_SECRET: process.env.BOOKING_LINK_SECRET,
  NODE_ENV: process.env.NODE_ENV,
};

const writableEnv = process.env as Record<string, string | undefined>;

function restoreEnvValue(key: keyof typeof originalEnv, value: string | undefined) {
  if (value === undefined) {
    delete writableEnv[key];
    return;
  }

  writableEnv[key] = value;
}

function setEnvValue(key: keyof typeof originalEnv, value: string) {
  writableEnv[key] = value;
}

afterEach(() => {
  restoreEnvValue("BOOKING_LINK_SECRET", originalEnv.BOOKING_LINK_SECRET);
  restoreEnvValue("NODE_ENV", originalEnv.NODE_ENV);
});

describe("public booking link secret handling", () => {
  it("uses development fallback secret outside production", () => {
    delete process.env.BOOKING_LINK_SECRET;
    setEnvValue("NODE_ENV", "development");

    expect(canGenerateBookingManageLinks()).toBe(true);

    const token = createBookingManageToken("demo-barberia", "booking-1");
    expect(isValidBookingManageToken({ slug: "demo-barberia", bookingId: "booking-1", token })).toBe(
      true
    );
  });

  it("requires explicit secret in production runtime", () => {
    delete process.env.BOOKING_LINK_SECRET;
    setEnvValue("NODE_ENV", "production");

    expect(canGenerateBookingManageLinks()).toBe(false);
    expect(() => createBookingManageToken("demo-barberia", "booking-1")).toThrow(
      "Missing environment variable: BOOKING_LINK_SECRET (required in production runtime)"
    );
  });

  it("uses configured secret in production-like runtime", () => {
    process.env.BOOKING_LINK_SECRET = "super-secret";
    setEnvValue("NODE_ENV", "production");

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
    restoreEnvValue("NODE_ENV", originalEnv.NODE_ENV);
  });

  it("devuelve false si no se provee token", () => {
    delete process.env.BOOKING_LINK_SECRET;
    setEnvValue("NODE_ENV", "production");
    expect(isValidBookingManageToken({ slug: "demo-barberia", bookingId: "b-1", token: undefined })).toBe(false);
  });

  it("devuelve false si el token está malformado", () => {
    delete process.env.BOOKING_LINK_SECRET;
    setEnvValue("NODE_ENV", "production");
    expect(isValidBookingManageToken({ slug: "demo-barberia", bookingId: "b-1", token: "not-a-valid-token" })).toBe(false);
  });

  it("devuelve false si el slug del token no coincide", () => {
    delete process.env.BOOKING_LINK_SECRET;
    setEnvValue("NODE_ENV", "development");
    const token = createBookingManageToken("otro-negocio", "b-1");
    expect(isValidBookingManageToken({ slug: "demo-barberia", bookingId: "b-1", token })).toBe(false);
  });

  it("devuelve false si el bookingId del token no coincide", () => {
    delete process.env.BOOKING_LINK_SECRET;
    setEnvValue("NODE_ENV", "development");
    const token = createBookingManageToken("demo-barberia", "b-1");
    expect(isValidBookingManageToken({ slug: "demo-barberia", bookingId: "b-otro", token })).toBe(false);
  });

  it("devuelve false si la firma es inválida", () => {
    delete process.env.BOOKING_LINK_SECRET;
    setEnvValue("NODE_ENV", "development");
    const token = createBookingManageToken("demo-barberia", "b-1");
    const [payload] = token.split(".");
    const tampered = `${payload}.invalidsignature`;
    expect(isValidBookingManageToken({ slug: "demo-barberia", bookingId: "b-1", token: tampered })).toBe(false);
  });
});

describe("buildBookingConfirmationHref / buildAbsoluteBookingConfirmationUrl", () => {
  afterEach(() => {
    restoreEnvValue("BOOKING_LINK_SECRET", originalEnv.BOOKING_LINK_SECRET);
    restoreEnvValue("NODE_ENV", originalEnv.NODE_ENV);
  });

  it("genera el href relativo de confirmación", () => {
    delete process.env.BOOKING_LINK_SECRET;
    setEnvValue("NODE_ENV", "development");
    const href = buildBookingConfirmationHref("demo-barberia", "b-1");
    expect(href).toMatch(/^\/demo-barberia\/confirmacion\?booking=b-1&token=/);
  });

  it("genera URL absoluta de confirmación", () => {
    delete process.env.BOOKING_LINK_SECRET;
    setEnvValue("NODE_ENV", "development");
    const url = buildAbsoluteBookingConfirmationUrl("demo-barberia", "b-1");
    expect(url).toMatch(/\/demo-barberia\/confirmacion\?booking=b-1&token=/);
  });

  it("acepta token de confirmación para abrir la confirmación", () => {
    delete process.env.BOOKING_LINK_SECRET;
    setEnvValue("NODE_ENV", "development");
    const token = createBookingConfirmationToken("demo-barberia", "b-1");
    expect(
      isValidBookingConfirmationToken({ slug: "demo-barberia", bookingId: "b-1", token })
    ).toBe(true);
  });

  it("no acepta token de confirmación como token de gestión", () => {
    delete process.env.BOOKING_LINK_SECRET;
    setEnvValue("NODE_ENV", "development");
    const token = createBookingConfirmationToken("demo-barberia", "b-1");
    expect(isValidBookingManageToken({ slug: "demo-barberia", bookingId: "b-1", token })).toBe(false);
  });
});

describe("buildManageBookingHref / buildAbsoluteManageBookingUrl", () => {
  afterEach(() => {
    restoreEnvValue("BOOKING_LINK_SECRET", originalEnv.BOOKING_LINK_SECRET);
    restoreEnvValue("NODE_ENV", originalEnv.NODE_ENV);
  });

  it("genera el href relativo de gestión de turno", () => {
    delete process.env.BOOKING_LINK_SECRET;
    setEnvValue("NODE_ENV", "development");
    const href = buildManageBookingHref("demo-barberia", "b-1");
    expect(href).toMatch(/^\/demo-barberia\/mi-turno\?booking=b-1&token=/);
  });

  it("devuelve null si no se puede generar el link", () => {
    delete process.env.BOOKING_LINK_SECRET;
    setEnvValue("NODE_ENV", "production");
    expect(buildManageBookingHref("demo-barberia", "b-1")).toBeNull();
  });

  it("genera la URL absoluta de gestión de turno", () => {
    delete process.env.BOOKING_LINK_SECRET;
    setEnvValue("NODE_ENV", "development");
    const url = buildAbsoluteManageBookingUrl("demo-barberia", "b-1");
    expect(url).toMatch(/\/demo-barberia\/mi-turno\?booking=b-1&token=/);
  });

  it("devuelve null en URL absoluta si no hay secret", () => {
    delete process.env.BOOKING_LINK_SECRET;
    setEnvValue("NODE_ENV", "production");
    expect(buildAbsoluteManageBookingUrl("demo-barberia", "b-1")).toBeNull();
  });
});

describe("buildReviewHref / buildAbsoluteReviewUrl", () => {
  afterEach(() => {
    restoreEnvValue("BOOKING_LINK_SECRET", originalEnv.BOOKING_LINK_SECRET);
    restoreEnvValue("NODE_ENV", originalEnv.NODE_ENV);
  });

  it("genera el href de reseña", () => {
    delete process.env.BOOKING_LINK_SECRET;
    setEnvValue("NODE_ENV", "development");
    const href = buildReviewHref("demo-barberia", "b-1");
    expect(href).toMatch(/^\/demo-barberia\/resena\?booking=b-1&token=/);
  });

  it("devuelve null para reseña si no hay secret", () => {
    delete process.env.BOOKING_LINK_SECRET;
    setEnvValue("NODE_ENV", "production");
    expect(buildReviewHref("demo-barberia", "b-1")).toBeNull();
  });

  it("genera URL absoluta de reseña", () => {
    delete process.env.BOOKING_LINK_SECRET;
    setEnvValue("NODE_ENV", "development");
    const url = buildAbsoluteReviewUrl("demo-barberia", "b-1");
    expect(url).toMatch(/\/demo-barberia\/resena\?booking=b-1&token=/);
  });

  it("devuelve null en URL absoluta de reseña si no hay secret", () => {
    delete process.env.BOOKING_LINK_SECRET;
    setEnvValue("NODE_ENV", "production");
    expect(buildAbsoluteReviewUrl("demo-barberia", "b-1")).toBeNull();
  });
});
