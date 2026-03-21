const DEFAULT_TRACES_SAMPLE_RATE = process.env.NODE_ENV === "development" ? 1 : 0.1;
const DEFAULT_REPLAYS_SESSION_SAMPLE_RATE = process.env.NODE_ENV === "development" ? 1 : 0.1;
const DEFAULT_REPLAYS_ON_ERROR_SAMPLE_RATE = 1;

function parseSampleRate(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return Math.min(1, Math.max(0, parsedValue));
}

export function getSharedSentryOptions(dsn: string | undefined) {
  return {
    dsn,
    enabled: Boolean(dsn),
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: parseSampleRate(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
      DEFAULT_TRACES_SAMPLE_RATE,
    ),
  };
}

export function getReplaySampleRates() {
  return {
    replaysSessionSampleRate: parseSampleRate(
      process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE,
      DEFAULT_REPLAYS_SESSION_SAMPLE_RATE,
    ),
    replaysOnErrorSampleRate: parseSampleRate(
      process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE,
      DEFAULT_REPLAYS_ON_ERROR_SAMPLE_RATE,
    ),
  };
}
