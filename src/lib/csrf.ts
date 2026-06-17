import { createHmac, timingSafeEqual } from "node:crypto";

export const CSRF_TOKEN_HEADER = "X-CSRF-Token";

const CSRF_SECRET_ENV = "CSRF_SECRET";
const DEV_CSRF_SECRET = "reservaya-dev-csrf-secret";
const CSRF_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

function getCsrfSecret(): string {
  const secret = process.env[CSRF_SECRET_ENV]?.trim();

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV !== "production") {
    return DEV_CSRF_SECRET;
  }

  throw new Error(`Missing environment variable: ${CSRF_SECRET_ENV}`);
}

function signCsrfPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function generateCsrfToken(userId: string): string {
  const secret = getCsrfSecret();
  const exp = Date.now() + CSRF_TOKEN_TTL_MS;
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp }),
    "utf8"
  ).toString("base64url");
  const signature = signCsrfPayload(payload, secret);

  return `${payload}.${signature}`;
}

export function validateCsrfToken(
  token: string | null | undefined,
  userId: string
): boolean {
  if (!token || !userId) {
    return false;
  }

  const [payloadB64, signature] = token.split(".");

  if (!payloadB64 || !signature) {
    return false;
  }

  const secret = getCsrfSecret();
  const expectedSignature = signCsrfPayload(payloadB64, secret);
  const received = Buffer.from(signature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");

  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8")
    ) as { uid: string; exp: number };

    return payload.uid === userId && payload.exp > Date.now();
  } catch {
    return false;
  }
}
