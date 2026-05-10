import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { secretRepository } from "@/lib/repositories";
import { SecretsVault } from "@/components/secrets/SecretsVault";

type SearchParams = {
  projectId?: string;
  envId?: string;
  search?: string;
};

/**
 * Secrets Vault page.
 *
 * Server component — fetches masked secrets list. Reveal operations are
 * handled via client-side API calls to `/api/secrets/reveal` which requires
 * re-authentication (session elevation).
 */
export default async function SecretsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const params = await searchParams;

  // Use a default project context; in a real deployment this would
  // come from the user's active org/project selection.
  const projectId = params.projectId ?? "";
  const envId = params.envId;

  let items: Awaited<ReturnType<typeof secretRepository.list>>["items"] = [];
  let total = 0;

  if (projectId) {
    const result = await secretRepository.list({
      projectId,
      envId,
      search: params.search,
    });
    items = result.items;
    total = result.total;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Secrets Vault</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
          Encrypted at rest with AES-256-GCM. Reveal requires re-authentication.
        </p>
      </div>

      <SecretsVault
        initialItems={items.map((s) => ({
          id: s.id,
          name: s.name,
          key: s.key,
          description: s.description,
          tags: s.tags,
          maskedValue: s.maskedValue,
          rotatedAt: s.rotatedAt?.toISOString() ?? null,
          expiresAt: s.expiresAt?.toISOString() ?? null,
          updatedAt: s.updatedAt.toISOString(),
        }))}
        total={total}
        projectId={projectId}
        envId={envId ?? null}
      />
    </div>
  );
}
