export function isProductionEnvironment() {
  return process.env.NODE_ENV === "production";
}

export function getPublicAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
