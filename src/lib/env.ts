import { z } from "zod";

/**
 * Validates and caches all required environment variables at startup.
 * Throws immediately on missing/invalid values so the app fails fast.
 */
const schema = z.object({
  DATABASE_URL: z.string().min(1),
  CONFIG_ENCRYPTION_KEY: z.string().min(32),
  SESSION_SECRET: z.string().min(32),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

type AppEnv = z.infer<typeof schema>;

let cachedEnv: AppEnv | null = null;

/**
 * Returns true when the Postgres URL authority contains characters that need
 * percent-encoding (spaces or literal `#`). Only re-encodes credentials if
 * they are not already encoded.
 */
function shouldEncodeCredentials(value: string): boolean {
  const authority = value.split("@")[0] ?? "";
  return authority.includes(" ") || authority.includes("#");
}

/**
 * Normalizes a raw Postgres connection string by percent-encoding any
 * reserved characters in the username or password.
 *
 * @example
 * normalizePostgresUrl("postgresql://app:pa ss@host/db") // "postgresql://app:pa%20ss@host/db"
 */
export function normalizePostgresUrl(value: string): string {
  if (!shouldEncodeCredentials(value)) return value;

  const schemeMatch = value.match(/^(postgres(?:ql)?:\/\/)(.+)$/i);
  if (!schemeMatch) return value;

  const [, scheme, remainder] = schemeMatch;
  const atIndex = remainder.lastIndexOf("@");
  if (atIndex <= 0) return value;

  const credentials = remainder.slice(0, atIndex);
  const hostAndPath = remainder.slice(atIndex + 1);
  const colonIndex = credentials.indexOf(":");
  if (colonIndex <= 0) return value;

  const rawUser = credentials.slice(0, colonIndex);
  const rawPass = credentials.slice(colonIndex + 1);
  const encodedUser = encodeURIComponent(decodeURIComponent(rawUser));
  const encodedPass = encodeURIComponent(decodeURIComponent(rawPass));
  const normalized = `${scheme}${encodedUser}:${encodedPass}@${hostAndPath}`;

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return value;
  }

  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) return value;

  parsed.username = encodedUser;
  parsed.password = encodedPass;
  return parsed.toString();
}

/**
 * Returns validated environment variables. Cached after first call.
 * Throws `ZodError` if any required variable is missing or malformed.
 */
export function getEnv(): AppEnv {
  if (cachedEnv) return cachedEnv;

  cachedEnv = schema.parse({
    DATABASE_URL: normalizePostgresUrl(process.env.DATABASE_URL ?? ""),
    CONFIG_ENCRYPTION_KEY: process.env.CONFIG_ENCRYPTION_KEY,
    SESSION_SECRET: process.env.SESSION_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  });

  return cachedEnv;
}

/** Reset the env cache (test helper only). */
export function _resetEnvCache(): void {
  cachedEnv = null;
}
