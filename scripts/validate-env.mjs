#!/usr/bin/env node

const required = ["DATABASE_URL", "CONFIG_ENCRYPTION_KEY", "SESSION_SECRET"];

for (const key of required) {
  if (!process.env[key] || process.env[key].trim().length === 0) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

if (process.env.CONFIG_ENCRYPTION_KEY.length < 32) {
  throw new Error("CONFIG_ENCRYPTION_KEY must be at least 32 characters");
}

if (process.env.SESSION_SECRET.length < 32) {
  throw new Error("SESSION_SECRET must be at least 32 characters");
}

function validatePostgresUrl(name, value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} is not a valid URL`);
  }

  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new Error(`${name} must use postgres:// or postgresql://`);
  }

  if (!parsed.hostname) {
    throw new Error(`${name} must include a host`);
  }

  if (parsed.username.length === 0) {
    throw new Error(`${name} must include a username`);
  }

  if (parsed.password.length === 0) {
    throw new Error(`${name} must include a password`);
  }

  if (parsed.port && Number.isNaN(Number(parsed.port))) {
    throw new Error(`${name} has invalid port`);
  }

  const rawAuthority = value.split("@")[0] ?? "";
  if (rawAuthority.includes("#") || rawAuthority.includes(" ")) {
    throw new Error(`${name} likely contains unencoded credentials (space/#). URL-encode username/password.`);
  }
}

validatePostgresUrl("DATABASE_URL", process.env.DATABASE_URL);

if (process.env.DIRECT_URL) {
  validatePostgresUrl("DIRECT_URL", process.env.DIRECT_URL);
}

process.stdout.write("Environment preflight passed\n");
