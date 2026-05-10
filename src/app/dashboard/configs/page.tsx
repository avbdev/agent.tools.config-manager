import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { configItemRepository } from "@/lib/repositories";
import { ConfigStore } from "@/components/configs/ConfigStore";

type SearchParams = {
  projectId?: string;
  envId?: string;
  search?: string;
  tag?: string;
};

/**
 * Config Store page.
 *
 * Server component — fetches config items for the selected project/env.
 * Write operations (create / update / delete) are handled client-side
 * via the ConfigStore component calling the /api/configs route.
 */
export default async function ConfigsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const params = await searchParams;
  const projectId = params.projectId ?? "";

  let items: Awaited<ReturnType<typeof configItemRepository.list>>["items"] = [];
  let total = 0;

  if (projectId) {
    const result = await configItemRepository.list({
      projectId,
      envId: params.envId,
      search: params.search,
      tag: params.tag,
    });
    items = result.items;
    total = result.total;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Config Store</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
          Typed, versioned configuration across environments and projects.
        </p>
      </div>

      <ConfigStore
        initialItems={items.map((c) => ({
          id: c.id,
          key: c.key,
          valueType: c.valueType,
          isSecret: c.isSecret,
          displayValue: c.isSecret ? "••••••••" : (c.valuePlain ?? ""),
          description: c.description,
          tags: c.tags,
          updatedAt: c.updatedAt.toISOString(),
        }))}
        total={total}
        projectId={projectId}
        envId={params.envId ?? null}
      />
    </div>
  );
}
