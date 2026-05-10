import { describe, it, expect, beforeEach } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/crypto";

describe("crypto", () => {
  beforeEach(() => {
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/postgres";
    process.env.CONFIG_ENCRYPTION_KEY = "test-key-for-local-dev-only-0123456789";
    process.env.SESSION_SECRET = "test-session-secret-for-local-dev-0123456789";
  });

  it("encrypts and decrypts a secret", () => {
    const cipher = encryptSecret("super-secret");
    expect(cipher).not.toContain("super-secret");
    expect(decryptSecret(cipher)).toBe("super-secret");
  });
});
