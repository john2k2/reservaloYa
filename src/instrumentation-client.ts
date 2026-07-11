import * as Sentry from "@sentry/nextjs";

import { reportClientIssue, serializeClientError } from "@/lib/monitoring/client";
import { getSharedSentryOptions } from "@/lib/monitoring/sentry";

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

function shouldEnableSessionReplay() {
  if (typeof window === "undefined") {
    return false;
  }

  const pathname = window.location.pathname;
  return pathname.startsWith("/admin") || pathname.startsWith("/platform");
}

const integrations = shouldEnableSessionReplay()
  ? [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ]
  : [];

Sentry.init({
  ...getSharedSentryOptions(sentryDsn),
  replaysSessionSampleRate: shouldEnableSessionReplay()
    ? parseSampleRate(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE, 0.1)
    : 0,
  replaysOnErrorSampleRate: parseSampleRate(
    process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
    1,
  ),
  integrations,
});

function parseSampleRate(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(1, Math.max(0, parsed));
}

function registerWindowErrorMonitoring() {
  if (typeof window === "undefined") {
    return;
  }

  window.addEventListener("error", (event) => {
    const errorDetails = serializeClientError(event.error ?? event.message);
    const locationSuffix = event.filename
      ? ` (${event.filename}:${event.lineno}:${event.colno})`
      : "";

    reportClientIssue({
      source: "window-error",
      message: `${errorDetails.message}${locationSuffix}`,
      stack: errorDetails.stack,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const errorDetails = serializeClientError(event.reason);

    reportClientIssue({
      source: "unhandledrejection",
      message: errorDetails.message,
      stack: errorDetails.stack,
    });
  });
}

registerWindowErrorMonitoring();

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
