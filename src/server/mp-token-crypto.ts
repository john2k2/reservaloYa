/**
 * Encriptación de tokens OAuth de MercadoPago en reposo.
 *
 * Usa AES-256-GCM (authenticated encryption) con Node.js crypto nativo.
 * La clave se configura con la variable de entorno MP_TOKEN_ENCRYPTION_KEY
 * (hex de 64 caracteres = 32 bytes).
 *
 * Formato del token encriptado: `enc1:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>`
 *
 * Si MP_TOKEN_ENCRYPTION_KEY no está configurada, los tokens se guardan en
 * plaintext con una advertencia (compatibilidad hacia atrás / dev local).
 *
 * Si el valor leído NO comienza con `enc1:`, se trata como plaintext — esto
 * permite migrar tokens existentes sin romper el sistema.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { createLogger } from "@/server/logger";

const logger = createLogger("MP Token Crypto");

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // 96 bits — recomendado para GCM
const ENC_PREFIX = "enc1:";

function getEncryptionKey(): Buffer | null {
  const keyHex = process.env.MP_TOKEN_ENCRYPTION_KEY?.trim();

  if (!keyHex) {
    return null;
  }

  if (keyHex.length !== 64) {
    logger.error(
      "MP_TOKEN_ENCRYPTION_KEY debe tener exactamente 64 caracteres hex (32 bytes). Tokens en plaintext."
    );
    return null;
  }

  return Buffer.from(keyHex, "hex");
}

/**
 * Encripta un token OAuth para guardar en la base de datos.
 * Si no hay clave configurada, devuelve el valor original con advertencia.
 */
export function encryptMPToken(plaintext: string): string {
  if (!plaintext) return plaintext;

  const key = getEncryptionKey();

  if (!key) {
    logger.warn(
      "MP_TOKEN_ENCRYPTION_KEY no configurada: token de MercadoPago guardado en plaintext. " +
        "Generá una clave con: openssl rand -hex 32"
    );
    return plaintext;
  }

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${ENC_PREFIX}${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

/**
 * Desencripta un token OAuth leído de la base de datos.
 * Si el valor no está encriptado (plaintext o vacío), lo devuelve tal cual.
 */
export function decryptMPToken(value: string | null | undefined): string | null | undefined {
  if (!value) return value;

  if (!value.startsWith(ENC_PREFIX)) {
    // Token en plaintext — backward compat o dev local sin clave
    return value;
  }

  const key = getEncryptionKey();

  if (!key) {
    logger.error(
      "Token encriptado encontrado pero MP_TOKEN_ENCRYPTION_KEY no está configurada. " +
        "No se puede desencriptar."
    );
    return null;
  }

  const rest = value.slice(ENC_PREFIX.length);
  const parts = rest.split(":");

  if (parts.length !== 3) {
    logger.error("Formato de token encriptado inválido.");
    return null;
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;

  try {
    const iv = Buffer.from(ivHex!, "hex");
    const authTag = Buffer.from(authTagHex!, "hex");
    const ciphertext = Buffer.from(ciphertextHex!, "hex");

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return decipher.update(ciphertext).toString("utf8") + decipher.final("utf8");
  } catch {
    logger.error("Error desencriptando token de MercadoPago. El token puede estar corrupto.");
    return null;
  }
}
