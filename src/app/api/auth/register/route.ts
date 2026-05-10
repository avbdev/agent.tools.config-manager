import { NextResponse } from "next/server";
import { hashPassword, createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { asErrorResponse, getClientIp, tooManyRequests } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validation";
import { writeAudit } from "@/lib/audit";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const limiter = await checkRateLimit({
      key: `register:${getClientIp(req)}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (!limiter.allowed) return tooManyRequests(limiter.retryAfterSeconds);

    const contentType = req.headers.get("content-type") ?? "";
    const raw = contentType.includes("application/json")
      ? await req.json()
      : Object.fromEntries((await req.formData()).entries());

    const input = registerSchema.parse(raw);

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const count = await prisma.user.count();
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        role: count === 0 ? "ADMIN" : "VIEWER",
      },
    });

    await createSession(user.id);
    await writeAudit(
      { actorId: user.id, actorEmail: user.email, ipAddress: getClientIp(req) },
      { action: "auth.register", resource: `user:${user.id}`, resourceType: "User" },
    );

    if (contentType.includes("application/json")) {
      return NextResponse.json({ ok: true, role: user.role });
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (error) {
    return asErrorResponse(error);
  }
}
