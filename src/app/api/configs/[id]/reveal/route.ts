import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canReveal } from "@/lib/rbac"
import { decryptSecret } from "@/lib/crypto"
import { writeAudit } from "@/lib/audit"
import { checkRateLimit, tooManyRequestsResponse } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/http"
import { AuditAction } from "@prisma/client"

async function getOrgMembership(userId: string) {
  return prisma.orgMember.findFirst({
    where: { userId },
    include: { org: true },
  })
}

/**
 * POST /api/configs/:id/reveal
 *
 * Decrypts and returns the plaintext value for a secret config entry.
 * Rate-limited to 5 reveals per user per 60 seconds.
 * Every successful reveal is written to the audit log.
 * The plaintext value is NEVER written to the audit log.
 */
export async function POST(
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

  if (!canReveal(orgMember.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Rate limit: 5 reveals per user per 60 seconds
  const rlKey = `reveal:${session.user.id}`
  const rl = await checkRateLimit(rlKey, 5, 60_000)
  if (!rl.allowed) {
    return tooManyRequestsResponse(rl.resetAt)
  }

  // Find the setting — must belong to the user's org
  const setting = await prisma.setting.findFirst({
    where: { id, orgId: orgMember.orgId, deletedAt: null },
  })

  if (!setting) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (!setting.isSecret) {
    // Non-secrets are already returned in the list endpoint as plaintext
    return NextResponse.json({ value: setting.valueCipher })
  }

  let plaintext: string
  try {
    plaintext = decryptSecret(setting.valueCipher)
  } catch {
    // Decryption failure (key rotation / data corruption) — do NOT expose error details
    return NextResponse.json(
      { error: "Unable to decrypt this value. Contact your administrator." },
      { status: 500 },
    )
  }

  // Audit the reveal — NEVER write the plaintext value
  writeAudit({
    orgId: orgMember.orgId,
    actorId: session.user.id,
    actorEmail: session.user.email ?? "",
    action: AuditAction.REVEAL,
    resource: `config:${setting.service}.${setting.key}.${setting.environment}`,
    ipAddress: getClientIp(req),
    userAgent: req.headers.get("user-agent") ?? "",
  })

  return NextResponse.json({ value: plaintext })
}
