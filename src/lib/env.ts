import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  CONFIG_ENCRYPTION_KEY: z.string().min(32),
  SESSION_SECRET: z.string().min(32),
});

type AppEnv = z.infer<typeof schema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) return cachedEnv;

  cachedEnv = schema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    CONFIG_ENCRYPTION_KEY: process.env.CONFIG_ENCRYPTION_KEY,
    SESSION_SECRET: process.env.SESSION_SECRET,
  });

  return cachedEnv;
}
