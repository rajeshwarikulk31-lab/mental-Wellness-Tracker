/**
 * @fileoverview AES-256-GCM encryption for journal entries at rest.
 * Server-side only — throws if called from client-side code.
 * Uses ENCRYPTION_KEY from environment variables.
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const ENCODING: BufferEncoding = "base64";
const SEPARATOR = ":";

/**
 * Retrieves the encryption key from environment variables.
 * @throws Error if ENCRYPTION_KEY is not set or is invalid length
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set. " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  const keyBuffer = Buffer.from(keyHex, "hex");
  if (keyBuffer.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
  }
  return keyBuffer;
}

/**
 * Encrypts plaintext using AES-256-GCM.
 * Returns base64-encoded string: iv:authTag:ciphertext
 * @param plaintext - Text to encrypt
 * @returns Encrypted string with IV and auth tag prepended
 */
export function encryptText(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", ENCODING);
  encrypted += cipher.final(ENCODING);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString(ENCODING),
    authTag.toString(ENCODING),
    encrypted,
  ].join(SEPARATOR);
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * Expects format: iv:authTag:ciphertext (base64 encoded).
 * @param encryptedData - The encrypted string to decrypt
 * @returns Decrypted plaintext
 */
export function decryptText(encryptedData: string): string {
  const key = getEncryptionKey();
  const parts = encryptedData.split(SEPARATOR);

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format — expected iv:authTag:ciphertext");
  }

  const [ivB64, authTagB64, ciphertext] = parts;
  const iv = Buffer.from(ivB64, ENCODING);
  const authTag = Buffer.from(authTagB64, ENCODING);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, ENCODING, "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Generates a random 32-byte hex encryption key for initial setup.
 * @returns 64-character hex string suitable for ENCRYPTION_KEY env var
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}
