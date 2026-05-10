import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  CONFIG_ENCRYPTION_KEY: z.string().min(32),
  SESSION_SECRET: z.string().min(32),
});

type AppEnv = z.infer<typeof schema>;

let cachedEnv: AppEnv | null = null;

function shouldEncodeCredentials(value: string): boolean {
  const authority = value.split("@")[0] ?? "";
  return authority.includes(" ") || authority.includes("#");
}

export function normalizePostgresUrl(value: string): string {
  if (!shouldEncodeCredentials(value)) {
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
  const normalized = `${scheme}${encodedUser}:${encodedPass}@${hostAndPath}`;

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return value;
  }

  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    return value;
  }

  parsed.username = encodedUser;
  parsed.password = encodedPass;
  return parsed.toString();
}

export function getEnv(): AppEnv {
  if (cachedEnv) return cachedEnv;

  cachedEnv = schema.parse({
    DATABASE_URL: normalizePostgresUrl(process.env.DATABASE_URL ?? ""),
    CONFIG_ENCRYPTION_KEY: process.env.CONFIG_ENCRYPTION_KEY,
    SESSION_SECRET: process.env.SESSION_SECRET,
  });

  return cachedEnv;
}
