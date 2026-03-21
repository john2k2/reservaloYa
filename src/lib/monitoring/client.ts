"use client";

export type ClientMonitoringPayload = {
  source: "window-error" | "unhandledrejection" | "global-error-boundary";
  message: string;
  stack?: string;
  pathname?: string;
  userAgent?: string;
  timestamp?: string;
};

const endpoint = "/api/monitoring/errors";
const recentPayloads = new Map<string, number>();
const recentPayloadWindowMs = 30_000;

function buildFingerprint(payload: ClientMonitoringPayload) {
  return [payload.source, payload.message, payload.pathname ?? "", payload.stack ?? ""].join("::");
}

function shouldSendPayload(payload: ClientMonitoringPayload) {
  const fingerprint = buildFingerprint(payload);
  const now = Date.now();

  for (const [key, sentAt] of recentPayloads.entries()) {
    if (sentAt <= now - recentPayloadWindowMs) {
      recentPayloads.delete(key);
    }
  }

  const lastSentAt = recentPayloads.get(fingerprint);

  if (lastSentAt && lastSentAt > now - recentPayloadWindowMs) {
    return false;
  }

  recentPayloads.set(fingerprint, now);
  return true;
}

export function reportClientIssue(payload: ClientMonitoringPayload) {
  if (typeof window === "undefined" || !shouldSendPayload(payload)) {
    return;
  }

  const body = JSON.stringify({
    ...payload,
    pathname: payload.pathname ?? window.location.pathname,
    userAgent: payload.userAgent ?? window.navigator.userAgent,
    timestamp: payload.timestamp ?? new Date().toISOString(),
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(endpoint, blob);
      return;
    }
  } catch {
    // Ignore beacon failures and fall back to fetch.
  }

  void fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export function serializeClientError(error: unknown) {
  const fallbackStack = (() => {
    try {
      return typeof error === "undefined" ? undefined : JSON.stringify(error);
    } catch {
      return undefined;
    }
  })();

  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === "string") {
    return {
      message: error,
    };
  }

  return {
    message: "Unexpected client error",
    stack: fallbackStack,
  };
}
