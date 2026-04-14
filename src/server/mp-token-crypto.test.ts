import { afterEach, describe, expect, it, vi } from "vitest";

import { decryptMPToken, encryptMPToken } from "./mp-token-crypto";

const VALID_KEY_HEX = "a".repeat(64); // 32 bytes de ceros en hex

describe("encryptMPToken", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("devuelve el plaintext sin modificar si no hay clave configurada", () => {
    vi.stubEnv("MP_TOKEN_ENCRYPTION_KEY", "");
    expect(encryptMPToken("my-token")).toBe("my-token");
  });

  it("devuelve string vacío si el input está vacío", () => {
    vi.stubEnv("MP_TOKEN_ENCRYPTION_KEY", VALID_KEY_HEX);
    expect(encryptMPToken("")).toBe("");
  });

  it("encripta el token con el prefijo enc1:", () => {
    vi.stubEnv("MP_TOKEN_ENCRYPTION_KEY", VALID_KEY_HEX);
    const encrypted = encryptMPToken("my-secret-token");
    expect(encrypted).toMatch(/^enc1:/);
    expect(encrypted.split(":")).toHaveLength(4); // enc1 + iv + authTag + ciphertext
  });

  it("produce valores distintos cada vez (IV aleatorio)", () => {
    vi.stubEnv("MP_TOKEN_ENCRYPTION_KEY", VALID_KEY_HEX);
    const a = encryptMPToken("same-token");
    const b = encryptMPToken("same-token");
    expect(a).not.toBe(b);
  });

  it("devuelve plaintext si la clave tiene longitud incorrecta", () => {
    vi.stubEnv("MP_TOKEN_ENCRYPTION_KEY", "short-key");
    expect(encryptMPToken("my-token")).toBe("my-token");
  });
});

describe("decryptMPToken", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("devuelve null si el input es null", () => {
    expect(decryptMPToken(null)).toBeNull();
  });

  it("devuelve undefined si el input es undefined", () => {
    expect(decryptMPToken(undefined)).toBeUndefined();
  });

  it("devuelve el plaintext tal cual si no comienza con enc1:", () => {
    expect(decryptMPToken("my-plain-token")).toBe("my-plain-token");
  });

  it("desencripta correctamente un token encriptado", () => {
    vi.stubEnv("MP_TOKEN_ENCRYPTION_KEY", VALID_KEY_HEX);
    const original = "APP_USR-1234567890";
    const encrypted = encryptMPToken(original);
    expect(decryptMPToken(encrypted)).toBe(original);
  });

  it("devuelve null si hay un token encriptado pero no hay clave", () => {
    vi.stubEnv("MP_TOKEN_ENCRYPTION_KEY", VALID_KEY_HEX);
    const encrypted = encryptMPToken("my-token");
    vi.unstubAllEnvs();
    vi.stubEnv("MP_TOKEN_ENCRYPTION_KEY", "");
    expect(decryptMPToken(encrypted)).toBeNull();
  });

  it("devuelve null si el formato del token encriptado es inválido", () => {
    vi.stubEnv("MP_TOKEN_ENCRYPTION_KEY", VALID_KEY_HEX);
    expect(decryptMPToken("enc1:malformed")).toBeNull();
  });

  it("devuelve null si el ciphertext está corrupto", () => {
    vi.stubEnv("MP_TOKEN_ENCRYPTION_KEY", VALID_KEY_HEX);
    const encrypted = encryptMPToken("token-original");
    // Reemplazamos el ciphertext por basura
    const parts = encrypted.split(":");
    parts[3] = "deadbeef";
    expect(decryptMPToken(parts.join(":"))).toBeNull();
  });
});
