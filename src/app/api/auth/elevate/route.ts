import { NextResponse } from "next/server";
import { getCurrentUser, verifyPassword, elevateSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { asErrorResponse, getClientIp, tooManyRequests, unauthorized } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import { elevateSchema } from "@/lib/validation";
import { writeAudit } from "@/lib/audit";

/**
 * Re-authentication endpoint.
 *
 * The client submits the user's current password to elevate the session.
 * Elevation grants a 10-minute window for sensitive operations (secret reveals).
 *
 * Rate-limited strictly: 5 attempts per 15-minute window per IP.
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const ip = getClientIp(req);
    const limiter = await checkRateLimit({
      key: `elevate:${ip}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (!limiter.allowed) return tooManyRequests(limiter.retryAfterSeconds);

    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const input = elevateSchema.parse(await req.json());

    // Re-verify password from DB (getCurrentUser only checks the session)
    const freshUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    const valid = await verifyPassword(input.password, freshUser.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await elevateSession();
    await writeAudit(
      { actorId: user.id, actorEmail: user.email, ipAddress: ip },
      { action: "auth.elevate", resource: `user:${user.id}`, resourceType: "User" },
    );

    return NextResponse.json({ ok: true, elevated: true });
  } catch (error) {
    return asErrorResponse(error);
  }
}
