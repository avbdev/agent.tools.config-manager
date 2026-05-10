import { describe, expect, it } from "vitest";
import { normalizePostgresUrl } from "@/lib/env";

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
});
