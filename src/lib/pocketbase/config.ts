import { isProductionEnvironment } from "@/lib/runtime";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function getPocketBaseUrl() {
  return getRequiredEnv("NEXT_PUBLIC_POCKETBASE_URL");
}

export function isPocketBaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_POCKETBASE_URL);
}

export function isPocketBaseAdminConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_POCKETBASE_URL &&
      process.env.POCKETBASE_ADMIN_EMAIL &&
      process.env.POCKETBASE_ADMIN_PASSWORD
  );
}

export function getPocketBaseAdminEmail() {
  return getRequiredEnv("POCKETBASE_ADMIN_EMAIL");
}

export function getPocketBaseAdminPassword() {
  return getRequiredEnv("POCKETBASE_ADMIN_PASSWORD");
}

export function getPocketBaseAuthCookieOptions(expires?: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProductionEnvironment(),
    path: "/",
    expires,
  };
}
