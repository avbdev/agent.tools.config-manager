import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { asErrorResponse } from "@/lib/http";
import { canManageSecrets } from "@/lib/rbac";
import { encryptSecret } from "@/lib/crypto";
import { writeAudit } from "@/lib/audit";
import {
  configPayloadSchema,
  normalizeTypedValue,
  scopeToService,
  serializeConfigPayload,
  serviceToScope,
} from "@/lib/config-schema";

const querySchema = z.object({
  q: z.string().optional(),
  environment: z.string().optional(),
  org: z.string().optional(),
  project: z.string().optional(),
  tag: z.string().optional(),
});

function parseStoredValue(cipher: string) {
  try {
    return JSON.parse(cipher) as { value?: unknown; type?: string; tags?: string[]; description?: string; isSecret?: boolean };
  } catch {
    return { value: "********", type: "string", tags: [] };
  }
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const query = querySchema.parse(Object.fromEntries(new URL(req.url).searchParams.entries()));
    const settings = await prisma.setting.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 500,
    });

    const filtered = settings
      .map((s) => {
        const parsed = parseStoredValue(s.valueCipher);
        const scope = serviceToScope(s.service);
        const tags = parsed.tags || [];
        return {
          id: s.id,
          key: s.key,
          scope,
          type: parsed.type || "string",
          tags,
          description: parsed.description || "",
          value: s.isSecret ? "********" : parsed.value,
          isSecret: s.isSecret,
          updatedAt: s.updatedAt,
        };
      })
      .filter((s) => {
        if (query.environment && s.scope.environment !== query.environment) return false;
        if (query.org && s.scope.org !== query.org) return false;
        if (query.project && s.scope.project !== query.project) return false;
        if (query.tag && !s.tags.includes(query.tag)) return false;
        if (query.q && !`${s.key} ${s.description} ${s.tags.join(" ")}`.toLowerCase().includes(query.q.toLowerCase())) return false;
        return true;
      });

    return NextResponse.json({ data: filtered });
  } catch (error) {
    return asErrorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageSecrets(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const input = configPayloadSchema.parse(body);
    const service = scopeToService(input.scope);

    const previous = await prisma.setting.findUnique({
      where: { ownerId_service_key: { ownerId: user.id, service, key: input.key } },
    });

    const normalized = {
      ...input,
      value: normalizeTypedValue(input.type, input.value),
    };
    const serialized = serializeConfigPayload(normalized);
    const valueCipher = input.isSecret ? encryptSecret(serialized) : serialized;

    const setting = await prisma.setting.upsert({
      where: { ownerId_service_key: { ownerId: user.id, service, key: input.key } },
      create: { ownerId: user.id, key: input.key, service, isSecret: input.isSecret, valueCipher },
      update: { isSecret: input.isSecret, valueCipher },
    });

    await writeAudit(
      user.id,
      "config.versioned_upsert",
      JSON.stringify({
        settingId: setting.id,
        service,
        key: input.key,
        previousValueCipher: previous?.valueCipher ?? null,
        previousIsSecret: previous?.isSecret ?? null,
        nextValueCipher: valueCipher,
        nextIsSecret: input.isSecret,
      }),
    );

    return NextResponse.json({ ok: true, id: setting.id });
  } catch (error) {
    return asErrorResponse(error);
  }
}

const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  operation: z.enum(["delete", "tag-add"]),
  tag: z.string().optional(),
});

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageSecrets(user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();

    if (body?.action === "rollback") {
      const schema = z.object({ settingId: z.string().min(1) });
      const input = schema.parse(body);
      const history = await prisma.auditLog.findMany({
        where: { actorId: user.id, action: "config.versioned_upsert", details: { contains: input.settingId } },
        orderBy: { createdAt: "desc" },
        take: 1,
      });

      const latest = history[0];
      if (!latest) return NextResponse.json({ error: "No rollback point" }, { status: 404 });
      const payload = JSON.parse(latest.details) as { previousValueCipher: string | null; previousIsSecret: boolean | null };
      if (!payload.previousValueCipher || payload.previousIsSecret === null) {
        return NextResponse.json({ error: "No previous value to rollback" }, { status: 400 });
      }

      await prisma.setting.update({
        where: { id: input.settingId },
        data: { valueCipher: payload.previousValueCipher, isSecret: payload.previousIsSecret },
      });
      await writeAudit(user.id, "config.rollback", input.settingId);
      return NextResponse.json({ ok: true });
    }

    const input = bulkSchema.parse(body);
    if (input.operation === "delete") {
      const deleted = await prisma.setting.deleteMany({ where: { ownerId: user.id, id: { in: input.ids } } });
      await writeAudit(user.id, "config.bulk_delete", JSON.stringify({ ids: input.ids, count: deleted.count }));
      return NextResponse.json({ ok: true, count: deleted.count });
    }

    const settings = await prisma.setting.findMany({ where: { ownerId: user.id, id: { in: input.ids } } });
    for (const setting of settings) {
      if (setting.isSecret) continue;
      const parsed = parseStoredValue(setting.valueCipher);
      const tags = new Set([...(parsed.tags || []), input.tag || "managed"]);
      await prisma.setting.update({
        where: { id: setting.id },
        data: {
          valueCipher: JSON.stringify({ ...parsed, tags: [...tags] }),
        },
      });
    }
    await writeAudit(user.id, "config.bulk_tag", JSON.stringify({ ids: input.ids, tag: input.tag || "managed" }));
    return NextResponse.json({ ok: true, count: settings.length });
  } catch (error) {
    return asErrorResponse(error);
  }
}
