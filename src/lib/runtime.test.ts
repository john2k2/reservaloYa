import { afterEach, describe, expect, it, vi } from "vitest";

import { getPublicAppUrl, isDemoModeEnabled, isPocketBaseConfigured, isProductionEnvironment } from "./runtime";

describe("isProductionEnvironment", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("devuelve true en producción", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isProductionEnvironment()).toBe(true);
  });

  it("devuelve false en otros entornos", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(isProductionEnvironment()).toBe(false);
  });
});

describe("isDemoModeEnabled", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("activa el demo mode si RESERVAYA_ENABLE_DEMO_MODE=true", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESERVAYA_ENABLE_DEMO_MODE", "true");
    expect(isDemoModeEnabled()).toBe(true);
  });

  it("activa el demo mode si no está en producción", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("RESERVAYA_ENABLE_DEMO_MODE", "false");
    expect(isDemoModeEnabled()).toBe(true);
  });

  it("desactiva el demo mode en producción sin la variable", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESERVAYA_ENABLE_DEMO_MODE", "false");
    expect(isDemoModeEnabled()).toBe(false);
  });
});

describe("getPublicAppUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("devuelve la URL de la variable de entorno si está configurada", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://reservaya.ar");
    expect(getPublicAppUrl()).toBe("https://reservaya.ar");
  });

  it("devuelve localhost como fallback si no está configurada", () => {
    // Usamos delete porque ?? solo aplica el fallback cuando el valor es undefined
    const original = process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    try {
      expect(getPublicAppUrl()).toBe("http://localhost:3000");
    } finally {
      if (original !== undefined) process.env.NEXT_PUBLIC_APP_URL = original;
    }
  });
});

describe("isPocketBaseConfigured (lib/runtime)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("devuelve true si NEXT_PUBLIC_POCKETBASE_URL tiene valor", () => {
    vi.stubEnv("NEXT_PUBLIC_POCKETBASE_URL", "http://127.0.0.1:8090");
    expect(isPocketBaseConfigured()).toBe(true);
  });

  it("devuelve false si NEXT_PUBLIC_POCKETBASE_URL está vacía", () => {
    vi.stubEnv("NEXT_PUBLIC_POCKETBASE_URL", "");
    expect(isPocketBaseConfigured()).toBe(false);
  });
});
