type LogLevel = "info" | "warn" | "error";

function normalizeMeta(meta: unknown): unknown {
  if (meta instanceof Error) {
    return {
      name: meta.name,
      message: meta.message,
      stack: meta.stack,
    };
  }

  return meta;
}

function shouldSkipLog(level: LogLevel) {
  return level === "info" && process.env.NODE_ENV === "test" && process.env.LOG_INFO_IN_TESTS !== "true";
}

function writeLog(level: LogLevel, scope: string, message: string, meta?: unknown) {
  if (shouldSkipLog(level)) {
    return;
  }

  const prefix = `[${scope}] ${message}`;
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
