import Redis from "ioredis"

// Preserve a single client across hot-reloads in development.
const globalForRedis = globalThis as unknown as { redis?: Redis }

function createRedisClient(): Redis {
  const sentinelHosts = process.env.REDIS_SENTINEL_HOSTS

  if (sentinelHosts) {
    const sentinels = sentinelHosts.split(",").map((h) => {
      const [host, port] = h.trim().split(":")
      return { host: host ?? "localhost", port: parseInt(port ?? "26379", 10) }
    })
    return new Redis({
      sentinels,
      name: process.env.REDIS_SENTINEL_MASTER ?? "mymaster",
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true,
    })
  }

  // Fallback for dev / Vercel preview environments
  return new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
    lazyConnect: true,
  })
}

export const redis: Redis = globalForRedis.redis ?? createRedisClient()

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis
}
