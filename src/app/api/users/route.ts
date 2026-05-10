import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageUsers } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { writeAudit } from "@/lib/audit";
import { asErrorResponse } from "@/lib/http";

const schema = z.object({
  userId: z.string().min(1),
  role: z.enum([Role.ADMIN, Role.EDITOR, Role.VIEWER]),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageUsers(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ data: users });
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageUsers(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const input = schema.parse(await req.json());
    await prisma.user.update({ where: { id: input.userId }, data: { role: input.role } });
    await writeAudit(user.id, "user.role.update", `${input.userId}:${input.role}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return asErrorResponse(error);
  }
}
