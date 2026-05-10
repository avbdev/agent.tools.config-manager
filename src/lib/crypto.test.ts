import { describe, it, expect, beforeEach } from "vitest";
import { _resetEnvCache } from "@/lib/env";
import { encryptSecret, decryptSecret, isCipherText, hashToken, generateApiToken } from "@/lib/crypto";

describe("crypto", () => {
  beforeEach(() => {
    _resetEnvCache();
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/postgres";
    process.env.CONFIG_ENCRYPTION_KEY = "test-key-for-local-dev-only-01234567";
    process.env.SESSION_SECRET = "test-session-secret-for-local-dev-0123456789";
  });

  describe("encryptSecret / decryptSecret", () => {
    it("encrypts a plaintext value into a non-readable ciphertext", () => {
      const cipher = encryptSecret("super-secret");
      expect(cipher).not.toContain("super-secret");
    });

    it("round-trips: decrypt(encrypt(x)) === x", () => {
      const plain = "my-api-key-12345";
      expect(decryptSecret(encryptSecret(plain))).toBe(plain);
    });

    it("produces different ciphertexts for the same plaintext (random IV)", () => {
      const a = encryptSecret("same");
      const b = encryptSecret("same");
      expect(a).not.toBe(b);
    });

    it("decrypts correctly after multiple round-trips", () => {
      const plain = JSON.stringify({ nested: { key: "value" }, arr: [1, 2, 3] });
      expect(decryptSecret(encryptSecret(plain))).toBe(plain);
    });

    it("throws on a tampered ciphertext", () => {
      const cipher = encryptSecret("value");
      const tampered = cipher.slice(0, -3) + "xxx";
      expect(() => decryptSecret(tampered)).toThrow();
    });

    it("throws on malformed ciphertext (wrong number of parts)", () => {
      expect(() => decryptSecret("only.two")).toThrow("Invalid ciphertext format");
    });
  });

  describe("isCipherText", () => {
    it("returns true for a valid cipher blob", () => {
      const cipher = encryptSecret("test");
      expect(isCipherText(cipher)).toBe(true);
    });

    it("returns false for a plaintext string", () => {
      expect(isCipherText("plain-text-value")).toBe(false);
    });
  });

  describe("hashToken", () => {
    it("produces a hex string", () => {
      expect(hashToken("raw-token")).toMatch(/^[0-9a-f]{64}$/);
    });

    it("is deterministic for the same input", () => {
      expect(hashToken("abc")).toBe(hashToken("abc"));
    });

    it("produces different hashes for different inputs", () => {
      expect(hashToken("abc")).not.toBe(hashToken("xyz"));
    });
  });

  describe("generateApiToken", () => {
    it("returns a token and prefix", () => {
      const { raw, tokenPrefix } = generateApiToken("cm");
      expect(raw).toContain("cm_");
      expect(tokenPrefix.length).toBeGreaterThan(0);
    });

    it("produces unique tokens on each call", () => {
      const a = generateApiToken("cm");
      const b = generateApiToken("cm");
      expect(a.raw).not.toBe(b.raw);
    });
  });
});
