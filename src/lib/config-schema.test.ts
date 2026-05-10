import { describe, expect, it } from "vitest";
import { normalizeTypedValue, scopeToService, serviceToScope } from "@/lib/config-schema";

describe("config schema helpers", () => {
  it("round-trips scope hierarchy", () => {
    const scope = { global: "global", org: "acme", project: "portal", environment: "prod" };
    const service = scopeToService(scope);
    expect(serviceToScope(service)).toEqual(scope);
  });

  it("normalizes primitive typed values", () => {
    expect(normalizeTypedValue("number", "42" as unknown as number)).toBe(42);
    expect(normalizeTypedValue("boolean", "true")).toBe(true);
    expect(normalizeTypedValue("string", 42 as unknown as string)).toBe("42");
  });

  it("normalizes json payload", () => {
    const json = normalizeTypedValue("json", '{"a":1}');
    expect(json).toEqual({ a: 1 });
  });
});
