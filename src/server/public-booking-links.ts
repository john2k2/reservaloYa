import { createHmac } from "node:crypto";

function getBookingLinkSecret() {
  return (
    process.env.BOOKING_LINK_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "reservaya-demo-booking-link-secret"
  );
}

export function createBookingManageToken(slug: string, bookingId: string) {
  return createHmac("sha256", getBookingLinkSecret())
    .update(`${slug}:${bookingId}`)
    .digest("hex");
}

export function isValidBookingManageToken(input: {
  slug: string;
  bookingId?: string;
  token?: string;
}) {
  if (!input.bookingId || !input.token) {
    return false;
  }

  return createBookingManageToken(input.slug, input.bookingId) === input.token;
}

export function getPublicAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
