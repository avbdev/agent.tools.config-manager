import { prisma } from "@/lib/prisma";

export type RateLimitInput = {
  /** Unique key identifying the rate-limit bucket (e.g. `login:1.2.3.4`) */
  key: string;
  /** Maximum allowed requests per window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Sliding-window rate limiter backed by PostgreSQL.
 *
 * Uses an atomic upsert to increment the request count within the current
 * time window. Safe under concurrent requests due to the unique constraint
 * on `(key, windowStart)`.
 *
 * @param input - Rate-limit configuration for this bucket.
 * @returns Result indicating whether the request is allowed.
 */
export async function checkRateLimit({
  key,
  limit,
  windowMs,
}: RateLimitInput): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStartMs = Math.floor(now / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs);

  const record = await prisma.rateLimit.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart, count: 1 },
    update: { count: { increment: 1 } },
  });

  const allowed = record.count <= limit;
  const remaining = Math.max(0, limit - record.count);
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((windowStartMs + windowMs - now) / 1000),
  );

  return { allowed, remaining, retryAfterSeconds };
}
