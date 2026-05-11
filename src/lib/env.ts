import { z } from "zod"

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  // AES-256-GCM encryption key for config values at rest.
  // Must be at least 32 characters. Generate: openssl rand -hex 32
  CONFIG_ENCRYPTION_KEY: z.string().min(32),
})

type AppEnv = z.infer<typeof schema>

let cachedEnv: AppEnv | null = null

export function getEnv(): AppEnv {
  if (cachedEnv) return cachedEnv

  cachedEnv = schema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    CONFIG_ENCRYPTION_KEY: process.env.CONFIG_ENCRYPTION_KEY,
  })

  return cachedEnv
}
