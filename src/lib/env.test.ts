import { describe, expect, it, beforeEach } from "vitest";
import { normalizePostgresUrl, _resetEnvCache } from "@/lib/env";

describe("normalizePostgresUrl", () => {
  it("keeps already valid URLs unchanged", () => {
    const value = "postgresql://app:pass%40word@db.example.com:5432/configdb?sslmode=require";
    expect(normalizePostgresUrl(value)).toBe(value);
  });

  it("encodes raw credentials with reserved characters", () => {
    const value = "postgresql://app:pa ss#word@db.example.com:5432/configdb?sslmode=require";
    const normalized = normalizePostgresUrl(value);
    expect(normalized).toContain("app:pa%20ss%23word@");
    expect(() => new URL(normalized)).not.toThrow();
  });

  it("returns the original value for non-postgres URLs", () => {
    const value = "mysql://user:pass@host/db";
    expect(normalizePostgresUrl(value)).toBe(value);
  });

  it("handles postgres:// scheme (no 'ql' suffix)", () => {
    const value = "postgres://user:p ss@host/db";
    const normalized = normalizePostgresUrl(value);
    expect(normalized).toContain("user:p%20ss@host");
  });
});

describe("getEnv", () => {
  beforeEach(() => {
    _resetEnvCache();
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/test";
    process.env.CONFIG_ENCRYPTION_KEY = "test-key-for-local-dev-only-01234567";
    process.env.SESSION_SECRET = "test-session-secret-for-local-dev-0123456789";
  });

  it("returns validated env object", async () => {
    const { getEnv } = await import("@/lib/env");
    const env = getEnv();
    expect(env.DATABASE_URL).toBeTruthy();
    expect(env.CONFIG_ENCRYPTION_KEY.length).toBeGreaterThanOrEqual(32);
    expect(env.SESSION_SECRET.length).toBeGreaterThanOrEqual(32);
  });

  it("throws when CONFIG_ENCRYPTION_KEY is too short", async () => {
    _resetEnvCache();
    process.env.CONFIG_ENCRYPTION_KEY = "short";
    const { getEnv } = await import("@/lib/env");
    expect(() => getEnv()).toThrow();
  });
});
