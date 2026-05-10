import { checkRateLimit } from "@/lib/rate-limit";
import { tooManyRequests } from "@/lib/http";
import { getClientIp } from "@/lib/http";
import type { NextResponse } from "next/server";

export type RateLimitConfig = {
  /** Rate limit identifier prefix, e.g. "api:secrets". IP is appended. */
  keyPrefix: string;
  /** Max requests per window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
};

type Handler = (req: Request) => Promise<NextResponse>;

/**
 * Rate-limiting middleware factory.
 * Applies a sliding-window rate limit keyed by `<prefix>:<clientIP>`.
 *
 * @example
 * export const POST = withRateLimit(
 *   { keyPrefix: "api:secrets.reveal", limit: 10, windowMs: 60_000 },
 *   withAuth(async (req, user) => { ... })
 * );
 */
export function withRateLimit(config: RateLimitConfig, handler: Handler): Handler {
  return async (req: Request): Promise<NextResponse> => {
    const ip = getClientIp(req);
    const result = await checkRateLimit({
      key: `${config.keyPrefix}:${ip}`,
      limit: config.limit,
      windowMs: config.windowMs,
    });

    if (!result.allowed) {
      return tooManyRequests(result.retryAfterSeconds);
    }

    return handler(req);
  };
}
