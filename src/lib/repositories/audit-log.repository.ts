import { prisma } from "@/lib/prisma";
import type { AuditLog } from "@/generated/prisma";

export type AuditLogFilter = {
  orgId?: string;
  actorId?: string;
  action?: string;
  resource?: string;
  resourceType?: string;
  from?: Date;
  to?: Date;
  skip?: number;
  take?: number;
};

/**
 * Repository for AuditLog (read-only query side).
 *
 * Writes are performed exclusively via `writeAudit` in `@/lib/audit`.
 * This repository provides only read operations — the Prisma middleware
 * enforces immutability at the ORM level.
 */
export class AuditLogRepository {
  /**
   * Lists audit log entries with optional filters, ordered newest-first.
   */
  async list(filter: AuditLogFilter): Promise<{
    items: (AuditLog & { actor: { email: string; role: string } })[];
    total: number;
  }> {
    const where = {
      ...(filter.orgId && { orgId: filter.orgId }),
      ...(filter.actorId && { actorId: filter.actorId }),
      ...(filter.action && { action: { contains: filter.action } }),
      ...(filter.resource && { resource: { contains: filter.resource } }),
      ...(filter.resourceType && { resourceType: filter.resourceType }),
      ...((filter.from ?? filter.to) && {
        createdAt: {
          ...(filter.from && { gte: filter.from }),
          ...(filter.to && { lte: filter.to }),
        },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: filter.skip ?? 0,
        take: filter.take ?? 50,
        include: {
          actor: { select: { email: true, role: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, total };
  }

  /** Finds a single audit log entry by ID. */
  async findById(id: string): Promise<AuditLog | null> {
    return prisma.auditLog.findUnique({ where: { id } });
  }
}

export const auditLogRepository = new AuditLogRepository();
