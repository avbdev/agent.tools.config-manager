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
  const normalized = normalizePostgresUrl(value);
  let parsed;
  try {
    parsed = new URL(normalized);
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

  const rawAuthority = normalized.split("@")[0] ?? "";
  if (rawAuthority.includes("#") || rawAuthority.includes(" ")) {
    throw new Error(`${name} likely contains unencoded credentials (space/#). URL-encode username/password.`);
  }
}

function normalizePostgresUrl(value) {
  const authority = value.split("@")[0] ?? "";
  if (!authority.includes(" ") && !authority.includes("#")) {
    return value;
  }

  const schemeMatch = value.match(/^(postgres(?:ql)?:\/\/)(.+)$/i);
  if (!schemeMatch) {
    return value;
  }

  const [, scheme, remainder] = schemeMatch;
  const atIndex = remainder.lastIndexOf("@");
  if (atIndex <= 0) {
    return value;
  }

  const credentials = remainder.slice(0, atIndex);
  const hostAndPath = remainder.slice(atIndex + 1);
  const colonIndex = credentials.indexOf(":");
  if (colonIndex <= 0) {
    return value;
  }

  const rawUser = credentials.slice(0, colonIndex);
  const rawPass = credentials.slice(colonIndex + 1);
  const encodedUser = encodeURIComponent(decodeURIComponent(rawUser));
  const encodedPass = encodeURIComponent(decodeURIComponent(rawPass));
  return `${scheme}${encodedUser}:${encodedPass}@${hostAndPath}`;
}

validatePostgresUrl("DATABASE_URL", process.env.DATABASE_URL);

if (process.env.DIRECT_URL) {
  validatePostgresUrl("DIRECT_URL", process.env.DIRECT_URL);
}

process.stdout.write("Environment preflight passed\n");
