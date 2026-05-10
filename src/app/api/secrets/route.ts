import { NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { asErrorResponse } from "@/lib/http";
import { secretRepository } from "@/lib/repositories";
import {
  createSecretSchema,
  updateSecretSchema,
  listSecretsQuerySchema,
} from "@/lib/validation";
import { writeAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/http";
import type { SessionUser } from "@/lib/auth";

// ---------------------------------------------------------------------------
// GET /api/secrets?projectId=...&envId=...
// Returns masked secrets — no cipher values ever returned here.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = withAuth(async (req: Request, _user: SessionUser): Promise<NextResponse> => {
  try {
    const params = Object.fromEntries(new URL(req.url).searchParams);
    const query = listSecretsQuerySchema.parse(params);

    const { items, total } = await secretRepository.list({
      projectId: query.projectId,
      envId: query.envId,
      search: query.search,
      tag: query.tag,
      skip: query.skip,
      take: query.take,
    });

    return NextResponse.json({ data: items, total });
  } catch (error) {
    return asErrorResponse(error);
  }
});

// ---------------------------------------------------------------------------
// POST /api/secrets — create
// ---------------------------------------------------------------------------

export const POST = withAuth(async (req: Request, user: SessionUser): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const input = createSecretSchema.parse(body);

    const secret = await secretRepository.create({
      projectId: input.projectId,
      envId: input.envId,
      name: input.name,
      key: input.key,
      rawValue: input.rawValue,
      description: input.description,
      tags: input.tags,
      expiresAt: input.expiresAt,
      createdById: user.id,
    });

    await writeAudit(
      { actorId: user.id, actorEmail: user.email, ipAddress: getClientIp(req) },
      {
        action: "secret.create",
        resource: `secret:${secret.id}`,
        resourceType: "Secret",
        // SECURITY: Never log the key or value
        diff: { name: secret.name, projectId: secret.projectId, envId: secret.envId },
      },
    );

    return NextResponse.json({ ok: true, id: secret.id }, { status: 201 });
  } catch (error) {
    return asErrorResponse(error);
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/secrets — update
// ---------------------------------------------------------------------------

export const PATCH = withAuth(async (req: Request, user: SessionUser): Promise<NextResponse> => {
  try {
    const body = await req.json();
    const input = updateSecretSchema.parse(body);

    const secret = await secretRepository.update({
      id: input.id,
      name: input.name,
      rawValue: input.rawValue,
      description: input.description,
      tags: input.tags,
      expiresAt: input.expiresAt,
    });

    await writeAudit(
      { actorId: user.id, actorEmail: user.email, ipAddress: getClientIp(req) },
      {
        action: "secret.update",
        resource: `secret:${secret.id}`,
        resourceType: "Secret",
        diff: { name: secret.name, rotated: !!input.rawValue },
      },
    );

    return NextResponse.json({ ok: true, id: secret.id });
  } catch (error) {
    return asErrorResponse(error);
  }
});
