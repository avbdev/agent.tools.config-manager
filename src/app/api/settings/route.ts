import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageSecrets } from "@/lib/rbac";
import { encryptSecret } from "@/lib/crypto";
import { writeAudit } from "@/lib/audit";
import { asErrorResponse } from "@/lib/http";

const schema = z.object({
  service: z.string().min(1),
  key: z.string().min(1),
  value: z.string().min(1),
  isSecret: z.boolean().default(true),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.setting.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    data: settings.map((s) => ({
      id: s.id,
      service: s.service,
      key: s.key,
      isSecret: s.isSecret,
      value: s.isSecret ? "********" : s.valueCipher,
      updatedAt: s.updatedAt,
    })),
  });
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageSecrets(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const contentType = req.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? await req.json()
      : Object.fromEntries((await req.formData()).entries());
    if (typeof body.isSecret === "string") {
      body.isSecret = body.isSecret === "true";
    }
    const input = schema.parse(body);
    const valueCipher = input.isSecret ? encryptSecret(input.value) : input.value;

    const setting = await prisma.setting.upsert({
      where: {
        ownerId_service_key: {
          ownerId: user.id,
          service: input.service,
          key: input.key,
        },
      },
      update: {
        valueCipher,
        isSecret: input.isSecret,
      },
      create: {
        ownerId: user.id,
        service: input.service,
        key: input.key,
        valueCipher,
        isSecret: input.isSecret,
      },
    });

    await writeAudit(user.id, "setting.upsert", `${input.service}.${input.key}`);
    if (contentType.includes("application/json")) {
      return NextResponse.json({ id: setting.id, ok: true });
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (error) {
    return asErrorResponse(error);
  }
}
