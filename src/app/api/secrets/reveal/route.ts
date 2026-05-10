import { NextResponse } from "next/server";
import { withElevation } from "@/lib/middleware";
import { asErrorResponse, getClientIp, getUserAgent, tooManyRequests } from "@/lib/http";
import { secretRepository } from "@/lib/repositories";
import { revealSecretSchema } from "@/lib/validation";
import { writeAudit } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import type { SessionUser } from "@/lib/auth";

/**
 * POST /api/secrets/reveal
 *
 * Reveals the plaintext value of a secret.
 *
 * SECURITY REQUIREMENTS (all must be satisfied):
 * 1. Valid session (enforced by `withElevation`)
 * 2. Elevated session claim — re-authenticated within 10 minutes (enforced by `withElevation`)
 * 3. Strict per-user rate limit: 10 reveals per minute
 * 4. Immutable `SecretRevealLog` entry written atomically inside the repository
 * 5. `AuditLog` entry written after reveal
 *
 * The plaintext value is returned ONLY in the response body of this endpoint
 * and must NEVER appear in logs, error messages, or audit diffs.
 */
export const POST = withElevation(async (req: Request, user: SessionUser): Promise<NextResponse> => {
  try {
    const ip = getClientIp(req);

    // Per-user rate limit — separate from IP rate limit
    const limiter = await checkRateLimit({
      key: `secret.reveal:${user.id}`,
      limit: 10,
      windowMs: 60 * 1000,
    });
    if (!limiter.allowed) return tooManyRequests(limiter.retryAfterSeconds);

    const body = await req.json();
    const input = revealSecretSchema.parse(body);

    // revealValue writes the SecretRevealLog atomically
    const plaintext = await secretRepository.revealValue(
      input.id,
      user.id,
      ip,
      getUserAgent(req),
    );

    // Separate AuditLog entry for the higher-level audit trail
    await writeAudit(
      { actorId: user.id, actorEmail: user.email, ipAddress: ip },
      {
        action: "secret.reveal",
        resource: `secret:${input.id}`,
        resourceType: "Secret",
        // SECURITY: diff must NEVER include the plaintext value
        diff: { secretId: input.id },
      },
    );

    return NextResponse.json({ value: plaintext });
  } catch (error) {
    return asErrorResponse(error);
  }
});
