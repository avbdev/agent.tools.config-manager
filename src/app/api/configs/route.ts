import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { Environment, AuditAction } from "@prisma/client"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { canCreate } from "@/lib/rbac"
import { encryptSecret } from "@/lib/crypto"
import { writeAudit } from "@/lib/audit"
import { getClientIp } from "@/lib/http"

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getOrgMembership(userId: string) {
  return prisma.orgMember.findFirst({
    where: { userId },
    include: { org: true },
  })
}

function toConfigItem(s: {
  id: string
  service: string
  key: string
  valueCipher: string
  isSecret: boolean
  environment: Environment
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: s.id,
    service: s.service,
    key: s.key,
    value: s.isSecret ? null : s.valueCipher,
    isSecret: s.isSecret,
    environment: s.environment,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }
}

// ─── GET /api/configs ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const orgMember = await getOrgMembership(session.user.id)
  if (!orgMember) {
    return NextResponse.json({ error: "No org membership found" }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const cursor = searchParams.get("cursor") ?? undefined
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100)
  const service = searchParams.get("service") ?? undefined
  const environment = searchParams.get("environment") as Environment | null

  const where = {
    orgId: orgMember.orgId,
    deletedAt: null,
    ...(service ? { service } : {}),
    ...(environment ? { environment } : {}),
  }

  const [total, items] = await Promise.all([
    prisma.setting.count({ where }),
    prisma.setting.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }),
  ])

  const hasMore = items.length > limit
  const page = hasMore ? items.slice(0, limit) : items
  const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null

  return NextResponse.json({ data: page.map(toConfigItem), nextCursor, total })
}

// ─── POST /api/configs ─────────────────────────────────────────────────────────

const createSchema = z.object({
  service: z.string().min(1).max(100),
  key: z.string().min(1).max(200),
  value: z.string().min(1),
  isSecret: z.boolean().default(true),
  environment: z.nativeEnum(Environment).default(Environment.PROD),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const orgMember = await getOrgMembership(session.user.id)
  if (!orgMember) {
    return NextResponse.json({ error: "No org membership found" }, { status: 403 })
  }

  if (!canCreate(orgMember.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues.map((i) => i.message) },
      { status: 400 },
    )
  }

  const { service, key, value, isSecret, environment } = parsed.data
  const valueCipher = isSecret ? encryptSecret(value) : value

  const setting = await prisma.setting.upsert({
    where: {
      orgId_service_key_environment: {
        orgId: orgMember.orgId,
        service,
        key,
        environment,
      },
    },
    update: { valueCipher, isSecret },
    create: { orgId: orgMember.orgId, service, key, valueCipher, isSecret, environment },
  })

  writeAudit({
    orgId: orgMember.orgId,
    actorId: session.user.id,
    actorEmail: session.user.email ?? "",
    action: AuditAction.CREATE,
    resource: `config:${service}.${key}.${environment}`,
    newValue: isSecret ? "[secret]" : value,
    ipAddress: getClientIp(req),
    userAgent: req.headers.get("user-agent") ?? "",
  })

  return NextResponse.json({ id: setting.id, ok: true }, { status: 201 })
}
