import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./dashboard-client";
import { serviceToScope } from "@/lib/config-schema";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const settings = await prisma.setting.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const initialData = settings.map((s) => {
    let parsed: { value?: unknown; type?: string; tags?: string[]; description?: string } = {};
    try {
      parsed = JSON.parse(s.valueCipher);
    } catch {
      parsed = { value: s.isSecret ? "********" : s.valueCipher, type: "string", tags: [], description: "" };
    }
    return {
      id: s.id,
      key: s.key,
      value: s.isSecret ? "********" : parsed.value,
      type: parsed.type || "string",
      isSecret: s.isSecret,
      tags: parsed.tags || [],
      description: parsed.description || "",
      scope: serviceToScope(s.service),
      updatedAt: s.updatedAt.toISOString(),
    };
  });

  return (
    <main className="mx-auto w-full max-w-7xl p-6 md:p-10 space-y-6">
      <section className="hero-premium rounded-3xl p-8 md:p-12">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Config Manager</h1>
        <p className="mt-3 text-zinc-200 max-w-2xl">Feature-rich environment hierarchy, versioned config operations, schema-typed values, and secure secret defaults for public deployment.</p>
        <p className="mt-4 text-sm text-zinc-300">Logged in as {user.email} ({user.role})</p>
      </section>

      <form action="/api/auth/logout" method="post">
        <button className="rounded bg-zinc-800 text-white px-4 py-2">Logout</button>
      </form>

      <DashboardClient initialData={initialData} />

      {user.role === Role.ADMIN && (
        <section className="glass-card p-4">
          <h2 className="font-semibold mb-3">Admin</h2>
          <p className="text-sm">Use /api/users and /api/audit endpoints for user role management and logs.</p>
        </section>
      )}
    </main>
  );
}
