import { getPublicAppUrl } from "@/lib/runtime";
import { sanitizeAuthCallbackNextPath } from "@/server/auth-callback";

export function buildImpersonationRedirectTo(next = "/admin/dashboard") {
  const callbackUrl = new URL("/auth/callback", getPublicAppUrl());
  callbackUrl.searchParams.set("next", sanitizeAuthCallbackNextPath(next));
  return callbackUrl.toString();
}
