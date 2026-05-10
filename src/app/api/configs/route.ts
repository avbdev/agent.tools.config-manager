import { NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { asErrorResponse } from "@/lib/http";
import { configItemRepository } from "@/lib/repositories";
import {
  createConfigSchema,
  updateConfigSchema,
  listConfigsQuerySchema,
  bulkDeleteSchema,
  rollbackSchema,
} from "@/lib/validation";
import { writeAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/http";
import type { SessionUser } from "@/lib/auth";

// ---------------------------------------------------------------------------
// GET /api/configs?projectId=...&envId=...&search=...
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = withAuth(async (req: Request, _user: SessionUser): Promise<NextResponse> => {
  try {
    const params = Object.fromEntries(new URL(req.url).searchParams);
    const query = listConfigsQuerySchema.parse(params);

    const { items, total } = await configItemRepository.list({
      projectId: query.projectId,
      envId: query.envId,
      search: query.search,
      tag: query.tag,
      isSecret: query.isSecret,
      skip: query.skip,
      take: query.take,
    });

    // Strip valuePlain for secrets — never return plaintext in list
    const safeItems = items.map((item) => ({
      id: item.id,
      projectId: item.projectId,
      envId: item.envId,
      key: item.key,
      valueType: item.valueType,
      isSecret: item.isSecret,
      displayValue: item.isSecret ? "••••••••" : (item.valuePlain ?? ""),
      description: item.description,
      tags: item.tags,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return NextResponse.json({ data: safeItems, total });
  } catch (error) {
    return asErrorResponse(error);
  }
});

// ---------------------------------------------------------------------------
// POST /api/configs — create
// ---------------------------------------------------------------------------

export const POST = withAuth(async (req: Request, user: SessionUser): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const input = createConfigSchema.parse(body);

    const item = await configItemRepository.create({
      projectId: input.projectId,
      envId: input.envId,
      key: input.key,
      valueType: input.valueType,
      rawValue: input.rawValue,
      isSecret: input.isSecret,
      description: input.description,
      tags: input.tags,
      createdById: user.id,
    });

    await writeAudit(
      { actorId: user.id, actorEmail: user.email, ipAddress: getClientIp(req) },
      {
        action: "config.create",
        resource: `config:${item.id}`,
        resourceType: "ConfigItem",
        diff: { key: item.key, projectId: item.projectId, envId: item.envId },
      },
    );

    return NextResponse.json({ ok: true, id: item.id }, { status: 201 });
  } catch (error) {
    return asErrorResponse(error);
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/configs — update or rollback
// ---------------------------------------------------------------------------

export const PATCH = withAuth(async (req: Request, user: SessionUser): Promise<NextResponse> => {
  try {
    const body = await req.json();

    if (body?.action === "rollback") {
      const input = rollbackSchema.parse(body);
      const item = await configItemRepository.rollbackToVersion(
        input.configItemId,
        input.targetVersion,
        user.id,
      );

      await writeAudit(
        { actorId: user.id, actorEmail: user.email, ipAddress: getClientIp(req) },
        {
          action: "config.rollback",
          resource: `config:${item.id}`,
          resourceType: "ConfigItem",
          diff: { targetVersion: input.targetVersion },
        },
      );

      return NextResponse.json({ ok: true, id: item.id });
    }

    const input = updateConfigSchema.parse(body);
    const item = await configItemRepository.update({
      id: input.id,
      valueType: input.valueType,
      rawValue: input.rawValue,
      isSecret: input.isSecret,
      description: input.description,
      tags: input.tags,
      createdById: user.id,
    });

    await writeAudit(
      { actorId: user.id, actorEmail: user.email, ipAddress: getClientIp(req) },
      {
        action: "config.update",
        resource: `config:${item.id}`,
        resourceType: "ConfigItem",
        diff: { key: item.key },
      },
    );

    return NextResponse.json({ ok: true, id: item.id });
  } catch (error) {
    return asErrorResponse(error);
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/configs — bulk delete
// ---------------------------------------------------------------------------

export const DELETE = withAuth(async (req: Request, user: SessionUser): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const input = bulkDeleteSchema.parse(body);

    const count = await configItemRepository.bulkDelete(input.ids, input.projectId);

    await writeAudit(
      { actorId: user.id, actorEmail: user.email, ipAddress: getClientIp(req) },
      {
        action: "config.bulk_delete",
        resource: `project:${input.projectId}`,
        resourceType: "ConfigItem",
        diff: { ids: input.ids, count },
      },
    );

    return NextResponse.json({ ok: true, count });
  } catch (error) {
    return asErrorResponse(error);
  }
});
