import { afterEach, describe, expect, it } from "vitest";

import {
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
