import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { asErrorResponse, getClientIp, tooManyRequests } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const limiter = await checkRateLimit({
      key: `login:${getClientIp(req)}`,
      limit: 20,
      windowMs: 15 * 60 * 1000,
    });
    if (!limiter.allowed) return tooManyRequests(limiter.retryAfterSeconds);

    const contentType = req.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? await req.json()
      : Object.fromEntries((await req.formData()).entries());
    const input = schema.parse(body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await createSession(user.id);
    if (contentType.includes("application/json")) {
      return NextResponse.json({ ok: true, role: user.role });
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (error) {
    return asErrorResponse(error);
  }
}
