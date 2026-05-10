import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { asErrorResponse, getClientIp, tooManyRequests } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const limiter = await checkRateLimit({
      key: `register:${getClientIp(req)}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!limiter.allowed) return tooManyRequests(limiter.retryAfterSeconds);

    const contentType = req.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? await req.json()
      : Object.fromEntries((await req.formData()).entries());
    const input = schema.parse(body);
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const count = await prisma.user.count();
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        role: count === 0 ? Role.ADMIN : Role.VIEWER,
      },
    });
    await createSession(user.id);
    if (contentType.includes("application/json")) {
      return NextResponse.json({ ok: true, role: user.role });
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (error) {
    return asErrorResponse(error);
  }
}
