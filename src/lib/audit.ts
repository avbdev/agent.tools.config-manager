import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "auth.login"
  | "auth.logout"
  | "auth.register"
  | "auth.elevate"
  | "config.create"
  | "config.update"
  | "config.delete"
  | "config.bulk_delete"
  | "config.rollback"
  | "secret.create"
  | "secret.update"
  | "secret.delete"
  | "secret.reveal"
  | "certificate.create"
  | "certificate.update"
  | "certificate.delete"
  | "certificate.rotate"
  | "token.create"
  | "token.revoke"
  | "user.role.update"
  | "org.create"
  | "org.member.add"
  | "org.member.remove";

export type AuditContext = {
  actorId: string;
  actorEmail: string;
  orgId?: string;
  ipAddress?: string;
  userAgent?: string;
};

export type AuditPayload = {
  action: AuditAction;
  resource: string;       // e.g. "secret:clxyz123"
  resourceType: string;   // e.g. "Secret"
  /** JSON-serialisable diff — MUST NOT contain plaintext secret values. */
  diff?: Record<string, unknown>;
};

/**
 * Writes an immutable audit log entry.
 *
 * The AuditLog table has a Prisma middleware guard that blocks all
 * UPDATE and DELETE operations at the ORM level.
 *
 * SECURITY: `diff` must never include plaintext secret values.
 * Callers are responsible for stripping or masking sensitive fields
 * before passing them here.
 *
 * @param ctx  - Actor context (who performed the action).
 * @param payload - Action, resource reference, and sanitized diff.
 */
export async function writeAudit(
  ctx: AuditContext,
  payload: AuditPayload,
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: ctx.actorId,
      actorEmail: ctx.actorEmail,
      orgId: ctx.orgId ?? null,
      action: payload.action,
      resource: payload.resource,
      resourceType: payload.resourceType,
      diff: payload.diff ? JSON.stringify(payload.diff) : "",
      ipAddress: ctx.ipAddress ?? "",
      userAgent: ctx.userAgent ?? "",
    },
  });
}
