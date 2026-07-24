import { timingSafeEqual } from "node:crypto";

function timingSafeEqualString(candidate: string, expected: string): boolean {
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);

  if (candidateBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(candidateBuffer, expectedBuffer);
}

export function isAuthorized(request: Request) {
  const secret = process.env.BOOKING_JOBS_SECRET;
  const cronSecret = process.env.CRON_SECRET;
  const expectedSecrets = [secret, cronSecret].filter((value): value is string => Boolean(value));

  if (expectedSecrets.length === 0) {
    return process.env.NODE_ENV !== "production";
  }

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const headerSecret = request.headers.get("x-booking-jobs-secret");
  const matchesExpectedSecret = (candidate: string | null | undefined) =>
    candidate ? expectedSecrets.some((expected) => timingSafeEqualString(candidate, expected)) : false;

  return matchesExpectedSecret(bearer) || matchesExpectedSecret(headerSecret);
}
