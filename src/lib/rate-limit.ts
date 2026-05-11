import { redis } from "@/lib/redis"
import { NextResponse } from "next/server"

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

/**
 * Sliding window rate limiter backed by Redis ZADD / ZREMRANGEBYSCORE / ZCARD.
 *
 * The sorted set stores one member per request (timestamped score + random
 * suffix for uniqueness) and the window is evicted on each call before
 * counting. The pipeline executes atomically enough for typical rate-limiting
 * accuracy; use a Lua script if you need hard atomicity guarantees.
 *
 * @param key      Unique key for this limit bucket (e.g. `auth:1.2.3.4`)
 * @param max      Maximum number of requests allowed inside the window
 * @param windowMs Window duration in milliseconds
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now()
  const windowStart = now - windowMs
  const redisKey = `rl:${key}`

  try {
    const pipeline = redis.pipeline()
    // Remove entries older than the sliding window start
    pipeline.zremrangebyscore(redisKey, 0, windowStart)
    // Record the current request (score = timestamp, member = timestamp+random)
    pipeline.zadd(redisKey, now, `${now}-${Math.random()}`)
    // Count total members in the window
    pipeline.zcard(redisKey)
    // Expire the key after one full window so Redis reclaims memory automatically
    pipeline.pexpire(redisKey, windowMs)

    const results = await pipeline.exec()

    const count = (results?.[2]?.[1] as number) ?? 0
    const allowed = count <= max
    const resetAt = new Date(now + windowMs)

    return { allowed, remaining: Math.max(0, max - count), resetAt }
  } catch {
    // Redis unavailable — fail open so legitimate requests are never blocked
    // by an infrastructure outage. Log this in production observability.
    return { allowed: true, remaining: max, resetAt: new Date(now + windowMs) }
  }
}

export function tooManyRequestsResponse(resetAt: Date): NextResponse {
  return NextResponse.json(
    { error: "Too many requests" },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((resetAt.getTime() - Date.now()) / 1000)),
      },
    },
  )
}
