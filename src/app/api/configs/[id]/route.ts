import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { Environment } from "@prisma/client"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canUpdate, canDelete } from "@/lib/rbac"
import { encryptSecret } from "@/lib/crypto"
import { writeAudit } from "@/lib/audit"
import { getClientIp } from "@/lib/http"
import { AuditAction } from "@prisma/client"

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getOrgMembership(userId: string) {
  return prisma.orgMember.findFirst({
    where: { userId },
    include: { org: true },
  })
}

async function findSetting(id: string, orgId: string) {
  return prisma.setting.findFirst({
    where: { id, orgId, deletedAt: null },
  })
}

// ─── PATCH /api/configs/[id] ──────────────────────────────────────────────────

const updateSchema = z.object({
  value: z.string().min(1).optional(),
  isSecret: z.boolean().optional(),
  environment: z.nativeEnum(Environment).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const orgMember = await getOrgMembership(session.user.id)
  if (!orgMember) {
    return NextResponse.json({ error: "No org membership found" }, { status: 403 })
  }

  if (!canUpdate(orgMember.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const existing = await findSetting(id, orgMember.orgId)
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    )
  }

  const updates: Record<string, unknown> = {}
  if (parsed.data.value !== undefined) {
    const isSecret = parsed.data.isSecret ?? existing.isSecret
    updates.valueCipher = isSecret ? encryptSecret(parsed.data.value) : parsed.data.value
  }
  if (parsed.data.isSecret !== undefined) updates.isSecret = parsed.data.isSecret
  if (parsed.data.environment !== undefined) updates.environment = parsed.data.environment

  const updated = await prisma.setting.update({ where: { id }, data: updates })

  writeAudit({
    orgId: orgMember.orgId,
    actorId: session.user.id,
    actorEmail: session.user.email ?? "",
    action: AuditAction.UPDATE,
    resource: `config:${existing.service}.${existing.key}.${existing.environment}`,
    oldValue: existing.isSecret ? "[secret]" : existing.valueCipher,
    newValue: updated.isSecret ? "[secret]" : updated.valueCipher,
    ipAddress: getClientIp(req),
    userAgent: req.headers.get("user-agent") ?? "",
  })

  return NextResponse.json({ id: updated.id, ok: true })
}

// ─── DELETE /api/configs/[id] ─────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const orgMember = await getOrgMembership(session.user.id)
  if (!orgMember) {
    return NextResponse.json({ error: "No org membership found" }, { status: 403 })
  }

  if (!canDelete(orgMember.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const existing = await findSetting(id, orgMember.orgId)
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Soft delete
  await prisma.setting.update({ where: { id }, data: { deletedAt: new Date() } })

  writeAudit({
    orgId: orgMember.orgId,
    actorId: session.user.id,
    actorEmail: session.user.email ?? "",
    action: AuditAction.DELETE,
    resource: `config:${existing.service}.${existing.key}.${existing.environment}`,
    ipAddress: getClientIp(req),
    userAgent: req.headers.get("user-agent") ?? "",
  })

  return NextResponse.json({ ok: true })
}
