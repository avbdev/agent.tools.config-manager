import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canManageUsers } from "@/lib/rbac"
import { Role, AuditAction } from "@prisma/client"
import { writeAudit } from "@/lib/audit"
import { asErrorResponse } from "@/lib/http"
import { getClientIp } from "@/lib/http"

const schema = z.object({
  userId: z.string().min(1),
  role: z.enum([Role.ADMIN, Role.EDITOR, Role.VIEWER]),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!canManageUsers(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json({ data: users })
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!canManageUsers(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const orgMember = await prisma.orgMember.findFirst({
      where: { userId: session.user.id },
    })

    const input = schema.parse(await req.json())
    const target = await prisma.user.findUnique({ where: { id: input.userId } })

    await prisma.user.update({
      where: { id: input.userId },
      data: { role: input.role },
    })

    if (orgMember) {
      writeAudit({
        orgId: orgMember.orgId,
        actorId: session.user.id,
        actorEmail: session.user.email ?? "",
        action: AuditAction.ROLE_CHANGE,
        resource: `user:${input.userId}`,
        oldValue: target?.role,
        newValue: input.role,
        ipAddress: getClientIp(req),
        userAgent: req.headers.get("user-agent") ?? "",
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return asErrorResponse(error)
  }
}
