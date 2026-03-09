export function isProductionEnvironment() {
  return process.env.NODE_ENV === "production";
}

export function isDemoModeEnabled() {
  return (
    process.env.RESERVAYA_ENABLE_DEMO_MODE === "true" ||
    !isProductionEnvironment()
  );
}

export function getPublicAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function isPocketBaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_POCKETBASE_URL);
}
