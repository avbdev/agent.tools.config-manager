import crypto from "crypto";
import { getEnv } from "@/lib/env";

const ALGO = "aes-256-gcm" as const;
const SEPARATOR = "." as const;

/**
 * Derives a 32-byte key buffer from CONFIG_ENCRYPTION_KEY using SHA-256.
 * The resulting key never leaves this module.
 */
function deriveKey(): Buffer {
  const env = getEnv();
  return crypto.createHash("sha256").update(env.CONFIG_ENCRYPTION_KEY).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a dot-separated base64 string: `<iv>.<authTag>.<ciphertext>`
 *
 * @param plainText - The value to encrypt. Must not be empty.
 * @returns Dot-delimited base64 cipher string.
 */
export function encryptSecret(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, deriveKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(SEPARATOR);
}

/**
 * Decrypts a cipher string produced by `encryptSecret`.
 *
 * @param cipherText - Dot-delimited base64 cipher string.
 * @returns The original plaintext.
 * @throws If the ciphertext is malformed or authentication fails.
 */
export function decryptSecret(cipherText: string): string {
  const parts = cipherText.split(SEPARATOR);
  if (parts.length !== 3) {
    throw new Error("Invalid ciphertext format: expected <iv>.<tag>.<data>");
  }
  const [ivB64, tagB64, dataB64] = parts as [string, string, string];

  const decipher = crypto.createDecipheriv(ALGO, deriveKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/**
 * Returns true if the given string looks like an AES-GCM cipher blob
 * produced by `encryptSecret` (three dot-separated base64 segments).
 */
export function isCipherText(value: string): boolean {
  const parts = value.split(SEPARATOR);
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

/**
 * SHA-256 hashes a raw token string for safe DB storage.
 * Used for ApiToken hashing — the raw token is shown once, only the hash is persisted.
 *
 * @param raw - The raw token string.
 * @returns Hex-encoded SHA-256 digest.
 */
export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Generates a cryptographically random API token with a given prefix.
 *
 * @param prefix - Short prefix like "cm" for identification in UIs.
 * @returns Object with the full raw token and its prefix (first 8 chars after prefix_).
 */
export function generateApiToken(prefix: string): { raw: string; tokenPrefix: string } {
  const random = crypto.randomBytes(32).toString("base64url");
  const raw = `${prefix}_${random}`;
  const tokenPrefix = raw.slice(0, Math.min(10, raw.length));
  return { raw, tokenPrefix };
}
