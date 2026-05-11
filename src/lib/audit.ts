import { prisma } from "@/lib/prisma"
import { AuditAction } from "@prisma/client"

export interface AuditParams {
  orgId: string
  actorId: string
  actorEmail: string
  action: AuditAction
  /** Structured resource identifier, e.g. "config:stripe.API_KEY.PROD" */
  resource: string
  /** JSON snapshot of the previous value (secrets must be masked). */
  oldValue?: string | null
  /** JSON snapshot of the new value (secrets must be masked). */
  newValue?: string | null
  ipAddress?: string
  userAgent?: string
  /** OTel trace ID for cross-system correlation. */
  traceId?: string
}

/**
 * Write an audit log entry. Fire-and-forget — the promise is intentionally
 * NOT awaited so audit writes never block the request or response.
 * Errors are caught and logged; they never surface to the caller.
 */
export function writeAudit(params: AuditParams): void {
  prisma.auditLog
    .create({
      data: {
        orgId: params.orgId,
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        action: params.action,
        resource: params.resource,
        oldValue: params.oldValue ?? null,
        newValue: params.newValue ?? null,
        ipAddress: params.ipAddress ?? "unknown",
        userAgent: params.userAgent ?? "",
        traceId: params.traceId ?? "",
      },
    })
    .catch((err: unknown) => {
      console.error("[audit] Failed to write audit log:", err)
    })
}
