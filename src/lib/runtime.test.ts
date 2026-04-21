import { afterEach, describe, expect, it, vi } from "vitest";

import { getPublicAppUrl, isProductionEnvironment } from "./runtime";

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
