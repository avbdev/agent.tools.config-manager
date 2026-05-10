import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentActivity } from "@/components/dashboard/RecentActivity";

/**
 * Dashboard overview page.
 *
 * Server component — fetches aggregated stats and recent audit activity
 * directly from the database (no API round-trip overhead).
 */
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const [configCount, secretCount, certCount, auditLogs] = await Promise.all([
    prisma.configItem.count(),
    prisma.secret.count(),
    prisma.certificate.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        action: true,
        resource: true,
        resourceType: true,
        actorEmail: true,
        createdAt: true,
      },
    }),
  ]);

  const stats = {
    totalConfigs: configCount,
    totalSecrets: secretCount,
    totalCertificates: certCount,
  };

  const activity = auditLogs.map((l) => ({
    id: l.id,
    action: l.action,
    resource: l.resource,
    resourceType: l.resourceType,
    actorEmail: l.actorEmail,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
          All infrastructure configurations across your organizations.
        </p>
      </div>

      <StatsCards stats={stats} />
      <RecentActivity items={activity} />
    </div>
  );
}
