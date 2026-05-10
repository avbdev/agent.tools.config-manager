import { NextResponse } from "next/server";
import { createSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { asErrorResponse, getClientIp, tooManyRequests } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";
import { writeAudit } from "@/lib/audit";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const ip = getClientIp(req);
    const limiter = await checkRateLimit({
      key: `login:${ip}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!limiter.allowed) return tooManyRequests(limiter.retryAfterSeconds);

    const contentType = req.headers.get("content-type") ?? "";
    const raw = contentType.includes("application/json")
      ? await req.json()
      : Object.fromEntries((await req.formData()).entries());

    const input = loginSchema.parse(raw);

    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await createSession(user.id);
    await writeAudit(
      { actorId: user.id, actorEmail: user.email, ipAddress: ip },
      { action: "auth.login", resource: `user:${user.id}`, resourceType: "User" },
    );

    if (contentType.includes("application/json")) {
      return NextResponse.json({ ok: true, role: user.role });
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (error) {
    return asErrorResponse(error);
  }
}
