import { createHmac, timingSafeEqual } from "node:crypto";

type MPOAuthStatePayload = {
  businessSlug: string;
  businessId?: string;
  userEmail: string;
  nonce: string;
  exp: number;
};

function getMPOAuthStateSecret() {
  const secret = process.env.MP_APP_SECRET?.trim();

  if (!secret) {
    throw new Error("Missing environment variable: MP_APP_SECRET");
  }

  return secret;
}

function signPayload(encodedPayload: string, secret: string) {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function createMercadoPagoOAuthState(input: {
  businessSlug: string;
  businessId?: string;
  userEmail: string;
  nonce: string;
}) {
  const secret = getMPOAuthStateSecret();
  const payload: MPOAuthStatePayload = {
    businessSlug: input.businessSlug,
    businessId: input.businessId,
    userEmail: input.userEmail,
    nonce: input.nonce,
    exp: Date.now() + 10 * 60 * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encodedPayload}.${signPayload(encodedPayload, secret)}`;
}

export function parseMercadoPagoOAuthState(state: string) {
  const secret = getMPOAuthStateSecret();
  const [encodedPayload, signature] = state.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload, secret);
  const received = Buffer.from(signature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");

  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as MPOAuthStatePayload;

    if (
      !payload.businessSlug ||
      !payload.userEmail ||
      !payload.nonce ||
      !payload.exp ||
      payload.exp < Date.now()
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
