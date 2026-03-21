import * as Sentry from "@sentry/nextjs";

import { reportClientIssue, serializeClientError } from "@/lib/monitoring/client";
import {
  getReplaySampleRates,
  getSharedSentryOptions,
} from "@/lib/monitoring/sentry";

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  ...getSharedSentryOptions(sentryDsn),
  ...getReplaySampleRates(),
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});

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
