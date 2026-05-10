import { prisma } from "@/lib/prisma";

type RateLimitInput = {
  key: string;
  limit: number;
  windowMs: number;
};

export async function checkRateLimit({ key, limit, windowMs }: RateLimitInput) {
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
  const retryAfterSeconds = Math.max(1, Math.ceil((windowStartMs + windowMs - now) / 1000));

  return { allowed, remaining, retryAfterSeconds };
}
