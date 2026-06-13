/**
 * @fileoverview Unit tests for encryption utilities.
 * Validates AES-256-GCM encryption/decryption, server-side-only checks,
 * and key generation.
 */

import { encryptText, decryptText, generateEncryptionKey } from "./encryption";

describe("encryption", () => {
  const originalEnv = process.env;
  const testKey = generateEncryptionKey();

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, ENCRYPTION_KEY: testKey };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("encryptText & decryptText", () => {
    it("should encrypt and decrypt correctly", () => {
      const plaintext = "This is a highly sensitive journal entry.";
      const encrypted = encryptText(plaintext);

      expect(encrypted).not.toBe(plaintext);
      expect(encrypted).toContain(":"); // Format: iv:authTag:ciphertext

      const decrypted = decryptText(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should produce different ciphertexts for the same plaintext (random IV)", () => {
      const plaintext = "Identical text";
      const encrypted1 = encryptText(plaintext);
      const encrypted2 = encryptText(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
      expect(decryptText(encrypted1)).toBe(plaintext);
      expect(decryptText(encrypted2)).toBe(plaintext);
    });

    it("should throw if ENCRYPTION_KEY is missing", () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => encryptText("test")).toThrow("ENCRYPTION_KEY environment variable is not set");
      expect(() => decryptText("iv:tag:cipher")).toThrow("ENCRYPTION_KEY environment variable is not set");
    });

    it("should throw on invalid encrypted format", () => {
      expect(() => decryptText("invalid-format-without-colons")).toThrow();
    });

    it("should throw on tampered ciphertext", () => {
      const encrypted = encryptText("Sensitive data");
      const parts = encrypted.split(":");
      parts[2] = "tampered" + parts[2]; // tamper the ciphertext
      const tampered = parts.join(":");

      expect(() => decryptText(tampered)).toThrow(); // Should fail auth tag check
    });
  });

  describe("generateEncryptionKey", () => {
    it("should generate a 64-character hex string (32 bytes)", () => {
      const key = generateEncryptionKey();
      expect(typeof key).toBe("string");
      expect(key.length).toBe(64);
      expect(/^[0-9a-f]+$/i.test(key)).toBe(true);
    });
  });
});
