import { reportClientIssue, serializeClientError } from "@/lib/monitoring/client";

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
