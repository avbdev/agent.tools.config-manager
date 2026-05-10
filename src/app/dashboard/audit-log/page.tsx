import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { auditLogRepository } from "@/lib/repositories";
import { canManageUsers } from "@/lib/rbac";
import { AuditTimeline } from "@/components/audit-log/AuditTimeline";

type SearchParams = {
  action?: string;
  actorId?: string;
  resourceType?: string;
  skip?: string;
};

/**
 * Audit Log page.
 *
 * Server component — fetches paginated, filterable audit log entries.
 * Restricted to ADMIN and SUPERADMIN roles.
 */
export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (!canManageUsers(user.role)) redirect("/dashboard");

  const params = await searchParams;
  const skip = parseInt(params.skip ?? "0", 10);
  const take = 50;

  const { items, total } = await auditLogRepository.list({
    action: params.action,
    actorId: params.actorId,
    resourceType: params.resourceType,
    skip,
    take,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
          Immutable record of all actions. No entries can be modified or deleted.
        </p>
      </div>

      <AuditTimeline
        items={items.map((entry) => ({
          id: entry.id,
          action: entry.action,
          resource: entry.resource,
          resourceType: entry.resourceType,
          actorEmail: entry.actorEmail,
          diff: entry.diff,
          ipAddress: entry.ipAddress,
          createdAt: entry.createdAt.toISOString(),
        }))}
        total={total}
        skip={skip}
        take={take}
      />
    </div>
  );
}
