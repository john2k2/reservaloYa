import PocketBase from "pocketbase";

import { getPocketBaseUrl } from "@/lib/pocketbase/config";

export const pocketBaseAuthCookieName = "pb_auth";

export function createPocketBaseClient() {
  const client = new PocketBase(getPocketBaseUrl());

  client.autoCancellation(false);

  return client;
}

export function getCookieHeader(cookies: Array<{ name: string; value: string }>) {
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

export function parsePocketBaseAuthCookie(serializedCookie: string) {
  const [nameValue, ...attributes] = serializedCookie.split(";").map((part) => part.trim());
  const separatorIndex = nameValue.indexOf("=");
  const name = nameValue.slice(0, separatorIndex);
  const value = nameValue.slice(separatorIndex + 1);
  const parsedAttributes = new Map<string, string | true>();

  for (const attribute of attributes) {
    const [rawKey, rawValue] = attribute.split("=");
    parsedAttributes.set(rawKey.toLowerCase(), rawValue ?? true);
  }

  const expiresValue = parsedAttributes.get("expires");
  const sameSiteValue = parsedAttributes.get("samesite");

  return {
    name,
    value,
    options: {
      httpOnly: parsedAttributes.has("httponly"),
      secure: parsedAttributes.has("secure"),
      path:
        typeof parsedAttributes.get("path") === "string"
          ? String(parsedAttributes.get("path"))
          : "/",
      sameSite:
        typeof sameSiteValue === "string"
          ? sameSiteValue.toLowerCase()
          : undefined,
      expires:
        typeof expiresValue === "string" ? new Date(expiresValue) : undefined,
    },
  };
}
