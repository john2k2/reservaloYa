import { createHmac, timingSafeEqual } from "node:crypto";

import { getPublicAppUrl } from "@/lib/runtime";
import { isPocketBaseConfigured } from "@/lib/pocketbase/config";

type BookingManageTokenPayload = {
  slug: string;
  bookingId: string;
  exp: number;
};

const DEV_BOOKING_LINK_SECRET = "reservaya-demo-booking-link-secret";
const DEFAULT_BOOKING_LINK_TTL_DAYS = 30;
const MISSING_BOOKING_LINK_SECRET_ERROR =
  "Missing environment variable: BOOKING_LINK_SECRET (required outside local/demo runtime)";

function requiresConfiguredBookingLinkSecret() {
  return isPocketBaseConfigured() && process.env.RESERVAYA_ENABLE_DEMO_MODE !== "true";
}

function getBookingLinkSecret() {
  if (process.env.BOOKING_LINK_SECRET) {
    return process.env.BOOKING_LINK_SECRET;
  }

  if (requiresConfiguredBookingLinkSecret()) {
    return null;
  }

  return DEV_BOOKING_LINK_SECRET;
}

function getRequiredBookingLinkSecret() {
  const secret = getBookingLinkSecret();

  if (!secret) {
    throw new Error(MISSING_BOOKING_LINK_SECRET_ERROR);
  }

  return secret;
}

function getBookingLinkTtlMs() {
  const ttlDays = Number(process.env.BOOKING_LINK_TTL_DAYS ?? DEFAULT_BOOKING_LINK_TTL_DAYS);
  const safeTtlDays = Number.isFinite(ttlDays) && ttlDays > 0 ? ttlDays : DEFAULT_BOOKING_LINK_TTL_DAYS;
  return safeTtlDays * 24 * 60 * 60 * 1000;
}

function encodePayload(payload: BookingManageTokenPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function signPayload(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

function decodePayload(token: string) {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as BookingManageTokenPayload;

    return {
      encodedPayload,
      signature,
      payload,
    };
  } catch {
    return null;
  }
}

export function canGenerateBookingManageLinks() {
  return Boolean(getBookingLinkSecret());
}

export function createBookingManageToken(slug: string, bookingId: string) {
  const secret = getRequiredBookingLinkSecret();

  const encodedPayload = encodePayload({
    slug,
    bookingId,
    exp: Date.now() + getBookingLinkTtlMs(),
  });

  return `${encodedPayload}.${signPayload(encodedPayload, secret)}`;
}

export function buildManageBookingHref(slug: string, bookingId: string) {
  if (!canGenerateBookingManageLinks()) {
    return null;
  }

  const token = createBookingManageToken(slug, bookingId);
  return `/${slug}/mi-turno?booking=${bookingId}&token=${token}`;
}

export function buildAbsoluteManageBookingUrl(slug: string, bookingId: string) {
  const href = buildManageBookingHref(slug, bookingId);

  if (!href) {
    return null;
  }

  return `${getPublicAppUrl()}${href}`;
}

export function isValidBookingManageToken(input: {
  slug: string;
  bookingId?: string;
  token?: string;
}) {
  const secret = getBookingLinkSecret();

  if (!secret || !input.bookingId || !input.token) {
    return false;
  }

  const decoded = decodePayload(input.token);

  if (!decoded) {
    return false;
  }

  const expectedSignature = signPayload(decoded.encodedPayload, secret);
  const received = Buffer.from(decoded.signature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");

  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return false;
  }

  return (
    decoded.payload.slug === input.slug &&
    decoded.payload.bookingId === input.bookingId &&
    decoded.payload.exp > Date.now()
  );
}
