type LogLevel = "info" | "warn" | "error";

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const BEARER_TOKEN_PATTERN = /(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi;
const QUERY_SECRET_PATTERN = /((?:access[_-]?token|refresh[_-]?token|token|secret|password|api[_-]?key)=)[^&\s]+/gi;
const PHONE_CANDIDATE_PATTERN = /(?<![\w])\+?\d[\d\s().-]{7,}\d(?![\w])/g;
const SENSITIVE_KEY_PATTERN = /(authorization|password|secret|token|api[_-]?key|access[_-]?key|refresh[_-]?token|auth[_-]?token|client[_-]?secret)/i;

function sanitizeString(value: string) {
  return value
    .replace(EMAIL_PATTERN, "[REDACTED_EMAIL]")
    .replace(BEARER_TOKEN_PATTERN, "$1[REDACTED_TOKEN]")
    .replace(QUERY_SECRET_PATTERN, "$1[REDACTED_SECRET]")
    .replace(PHONE_CANDIDATE_PATTERN, (match) => {
      const digits = match.replace(/\D/g, "");
      return digits.length >= 9 ? "[REDACTED_PHONE]" : match;
    });
}

function sanitizeLogValue(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === "string") return sanitizeString(value);
  if (typeof value !== "object" || value === null) return value;

  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (value instanceof Error) {
    return {
      name: value.name,
      message: sanitizeString(value.message),
      stack: value.stack ? sanitizeString(value.stack) : undefined,
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogValue(item, seen));
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? "[REDACTED]" : sanitizeLogValue(entry, seen),
    ])
  );
}

function normalizeMeta(meta: unknown): unknown {
  return sanitizeLogValue(meta);
}

function shouldSkipLog(level: LogLevel) {
  return level === "info" && process.env.NODE_ENV === "test" && process.env.LOG_INFO_IN_TESTS !== "true";
}

function writeLog(level: LogLevel, scope: string, message: string, meta?: unknown) {
  if (shouldSkipLog(level)) {
    return;
  }

  const prefix = sanitizeString(`[${scope}] ${message}`);
  const payload = meta === undefined ? undefined : normalizeMeta(meta);

  if (level === "info") {
    if (payload === undefined) {
      console.info(prefix);
      return;
    }

    console.info(prefix, payload);
    return;
  }

  if (level === "warn") {
    if (payload === undefined) {
      console.warn(prefix);
      return;
    }

    console.warn(prefix, payload);
    return;
  }

  if (payload === undefined) {
    console.error(prefix);
    return;
  }

  console.error(prefix, payload);
}

export function createLogger(scope: string) {
  return {
    info(message: string, meta?: unknown) {
      writeLog("info", scope, message, meta);
    },
    warn(message: string, meta?: unknown) {
      writeLog("warn", scope, message, meta);
    },
    error(message: string, meta?: unknown) {
      writeLog("error", scope, message, meta);
    },
  };
}
