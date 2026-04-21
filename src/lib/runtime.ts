export function isProductionEnvironment() {
  return process.env.NODE_ENV === "production";
}

export function isDemoModeEnabled() {
  return (
    process.env.RESERVAYA_ENABLE_DEMO_MODE === "true" ||
    !isProductionEnvironment()
  );
}

function normalizePublicUrl(value?: string) {
  const sanitized = value?.trim().replace(/\s+/g, "");

  if (!sanitized) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(sanitized)
    ? sanitized
    : `https://${sanitized}`;

  try {
    const url = new URL(withProtocol);
    const normalizedPath = url.pathname.replace(/\/+$/, "");

    url.pathname = normalizedPath || "/";
    url.search = "";
    url.hash = "";

    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function getPublicAppUrl() {
  return (
    normalizePublicUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizePublicUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizePublicUrl(process.env.VERCEL_URL) ??
    "http://localhost:3000"
  );
}

export function isPocketBaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_POCKETBASE_URL);
}
