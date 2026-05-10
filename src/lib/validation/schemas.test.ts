import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  elevateSchema,
  createConfigSchema,
  listConfigsQuerySchema,
  bulkDeleteSchema,
  createSecretSchema,
  updateSecretSchema,
  listSecretsQuerySchema,
} from "@/lib/validation";

// ---------------------------------------------------------------------------
// Auth schemas
// ---------------------------------------------------------------------------

describe("registerSchema", () => {
  const valid = { name: "Alice", email: "alice@example.com", password: "Secure1pass" };

  it("accepts valid input", () => expect(() => registerSchema.parse(valid)).not.toThrow());

  it("rejects missing name", () =>
    expect(() => registerSchema.parse({ ...valid, name: "" })).toThrow());

  it("rejects invalid email", () =>
    expect(() => registerSchema.parse({ ...valid, email: "not-an-email" })).toThrow());

  it("rejects weak password (no uppercase)", () =>
    expect(() => registerSchema.parse({ ...valid, password: "alllowercase1" })).toThrow());

  it("rejects weak password (no number)", () =>
    expect(() => registerSchema.parse({ ...valid, password: "NoNumbers" })).toThrow());

  it("rejects short password", () =>
    expect(() => registerSchema.parse({ ...valid, password: "Ab1" })).toThrow());
});

describe("loginSchema", () => {
  it("accepts valid credentials", () =>
    expect(() => loginSchema.parse({ email: "a@b.com", password: "anypassword" })).not.toThrow());

  it("rejects invalid email", () =>
    expect(() => loginSchema.parse({ email: "bad", password: "pw" })).toThrow());
});

describe("elevateSchema", () => {
  it("accepts non-empty password", () =>
    expect(() => elevateSchema.parse({ password: "mypassword" })).not.toThrow());

  it("rejects empty password", () =>
    expect(() => elevateSchema.parse({ password: "" })).toThrow());
});

// ---------------------------------------------------------------------------
// Config schemas
// ---------------------------------------------------------------------------

describe("createConfigSchema", () => {
  const valid = {
    projectId: "clxxxxxxxxxxxxxxxxxx00001",
    envId: "clxxxxxxxxxxxxxxxxxx00002",
    key: "API_KEY",
    valueType: "STRING",
    rawValue: "hello",
    isSecret: false,
  };

  it("accepts valid input", () => expect(() => createConfigSchema.parse(valid)).not.toThrow());

  it("rejects invalid key format (spaces)", () =>
    expect(() => createConfigSchema.parse({ ...valid, key: "KEY WITH SPACE" })).toThrow());

  it("rejects invalid valueType", () =>
    expect(() => createConfigSchema.parse({ ...valid, valueType: "INVALID" })).toThrow());

  it("defaults tags to empty array", () => {
    const result = createConfigSchema.parse(valid);
    expect(result.tags).toEqual([]);
  });
});

describe("listConfigsQuerySchema", () => {
  it("coerces skip and take to numbers", () => {
    const result = listConfigsQuerySchema.parse({
      projectId: "clxxxxxxxxxxxxxxxxxx00001",
      skip: "10",
      take: "25",
    });
    expect(result.skip).toBe(10);
    expect(result.take).toBe(25);
  });

  it("coerces isSecret string to boolean", () => {
    const result = listConfigsQuerySchema.parse({
      projectId: "clxxxxxxxxxxxxxxxxxx00001",
      isSecret: "true",
    });
    expect(result.isSecret).toBe(true);
  });
});

describe("bulkDeleteSchema", () => {
  it("rejects empty ids array", () =>
    expect(() =>
      bulkDeleteSchema.parse({
        ids: [],
        projectId: "clxxxxxxxxxxxxxxxxxx00001",
      }),
    ).toThrow());
});

// ---------------------------------------------------------------------------
// Secret schemas
// ---------------------------------------------------------------------------

describe("createSecretSchema", () => {
  const valid = {
    projectId: "clxxxxxxxxxxxxxxxxxx00001",
    envId: "clxxxxxxxxxxxxxxxxxx00002",
    name: "Stripe secret key",
    key: "STRIPE_SECRET_KEY",
    rawValue: "sk_live_abc123",
  };

  it("accepts valid input", () => expect(() => createSecretSchema.parse(valid)).not.toThrow());

  it("rejects lowercase key", () =>
    expect(() => createSecretSchema.parse({ ...valid, key: "stripe_secret" })).toThrow());

  it("rejects empty rawValue", () =>
    expect(() => createSecretSchema.parse({ ...valid, rawValue: "" })).toThrow());
});

describe("updateSecretSchema", () => {
  it("accepts partial updates", () => {
    expect(() =>
      updateSecretSchema.parse({
        id: "clxxxxxxxxxxxxxxxxxx00001",
        name: "New name",
      }),
    ).not.toThrow();
  });
});

describe("listSecretsQuerySchema", () => {
  it("defaults skip and take", () => {
    const result = listSecretsQuerySchema.parse({ projectId: "clxxxxxxxxxxxxxxxxxx00001" });
    expect(result.skip).toBe(0);
    expect(result.take).toBe(50);
  });
});
