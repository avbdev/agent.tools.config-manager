import { NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware";
import { asErrorResponse, forbidden } from "@/lib/http";
import { auditLogRepository } from "@/lib/repositories";
import { z } from "zod";
import { canManageUsers } from "@/lib/rbac";
import type { SessionUser } from "@/lib/auth";

const querySchema = z.object({
  orgId: z.string().cuid().optional(),
  actorId: z.string().cuid().optional(),
  action: z.string().max(64).optional(),
  resourceType: z.string().max(64).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  skip: z.coerce.number().int().nonnegative().default(0),
  take: z.coerce.number().int().min(1).max(200).default(50),
});

/**
 * GET /api/audit
 * Returns paginated, filterable audit log entries.
 * Restricted to ADMIN and SUPERADMIN roles.
 */
export const GET = withAuth(async (req: Request, user: SessionUser): Promise<NextResponse> => {
  try {
    if (!canManageUsers(user.role)) return forbidden();

    const params = Object.fromEntries(new URL(req.url).searchParams);
    const query = querySchema.parse(params);

    const { items, total } = await auditLogRepository.list({
      orgId: query.orgId,
      actorId: query.actorId,
      action: query.action,
      resourceType: query.resourceType,
      from: query.from,
      to: query.to,
      skip: query.skip,
      take: query.take,
    });

    return NextResponse.json({ data: items, total });
  } catch (error) {
    return asErrorResponse(error);
  }
});
