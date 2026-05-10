import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageUsers } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { asErrorResponse, forbidden, unauthorized } from "@/lib/http";

const schema = z.object({
  userId: z.string().cuid(),
  role: z.enum(["SUPERADMIN", "ADMIN", "EDITOR", "VIEWER"]),
});

/**
 * GET /api/users — list all users (ADMIN only).
 */
export async function GET(): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!canManageUsers(user.role)) return forbidden();

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ data: users });
}

/**
 * PATCH /api/users — update a user's role (ADMIN only).
 */
export async function PATCH(req: Request): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    if (!canManageUsers(user.role)) return forbidden();

    const input = schema.parse(await req.json());
    await prisma.user.update({
      where: { id: input.userId },
      data: { role: input.role },
    });

    await writeAudit(
      { actorId: user.id, actorEmail: user.email },
      {
        action: "user.role.update",
        resource: `user:${input.userId}`,
        resourceType: "User",
        diff: { newRole: input.role },
      },
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return asErrorResponse(error);
  }
}
