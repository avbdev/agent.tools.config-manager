import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const settings = await prisma.setting.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <main className="mx-auto max-w-5xl p-8 space-y-6">
      <h1 className="text-2xl font-bold">Config Manager Dashboard</h1>
      <p className="text-sm text-zinc-600">Logged in as {user.email} ({user.role})</p>

      <form action="/api/auth/logout" method="post">
        <button className="rounded bg-zinc-800 text-white px-4 py-2">Logout</button>
      </form>

      <section className="border rounded p-4">
        <h2 className="font-semibold mb-3">Add / Update Setting</h2>
        <form className="grid gap-2" method="post" action="/api/settings">
          <input className="border p-2 rounded" name="service" placeholder="service (e.g. stripe)" />
          <input className="border p-2 rounded" name="key" placeholder="key (e.g. API_KEY)" />
          <input className="border p-2 rounded" name="value" placeholder="value" />
          <select className="border p-2 rounded" name="isSecret">
            <option value="true">Secret</option>
            <option value="false">Plain config</option>
          </select>
          <button className="rounded bg-blue-600 text-white px-4 py-2">Save</button>
        </form>
      </section>

      <section className="border rounded p-4">
        <h2 className="font-semibold mb-3">Your Settings</h2>
        <ul className="space-y-2 text-sm">
          {settings.map((s) => (
            <li key={s.id} className="border rounded p-2">{s.service} / {s.key} = {s.isSecret ? "********" : s.valueCipher}</li>
          ))}
        </ul>
      </section>

      {user.role === Role.ADMIN && (
        <section className="border rounded p-4">
          <h2 className="font-semibold mb-3">Admin</h2>
          <p className="text-sm">Use /api/users and /api/audit endpoints for user role management and logs.</p>
        </section>
      )}
    </main>
  );
}
