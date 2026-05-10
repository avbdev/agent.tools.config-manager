"use client";

import { useMemo, useState } from "react";

type ConfigRow = {
  id: string;
  key: string;
  type: string;
  value: unknown;
  isSecret: boolean;
  tags: string[];
  description: string;
  scope: { global: string; org: string; project: string; environment: string };
  updatedAt: string;
};

export function DashboardClient({ initialData }: { initialData: ConfigRow[] }) {
  const [rows, setRows] = useState(initialData);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => rows.filter((r) => `${r.key} ${r.description}`.toLowerCase().includes(q.toLowerCase())), [rows, q]);

  async function refresh() {
    const res = await fetch("/api/configs", { cache: "no-store" });
    const json = await res.json();
    setRows(json.data || []);
  }

  async function save(formData: FormData) {
    const body = {
      key: formData.get("key"),
      type: formData.get("type"),
      value: formData.get("value"),
      isSecret: formData.get("isSecret") === "true",
      tags: String(formData.get("tags") || "").split(",").map((t) => t.trim()).filter(Boolean),
      description: formData.get("description") || "",
      scope: {
        global: "global",
        org: formData.get("org") || "core",
        project: formData.get("project") || "app",
        environment: formData.get("environment") || "dev",
      },
    };
    await fetch("/api/configs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    await refresh();
  }

  async function bulkDelete() {
    if (!selected.length) return;
    await fetch("/api/configs", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: selected, operation: "delete" }),
    });
    setSelected([]);
    await refresh();
  }

  return (
    <div className="space-y-6">
      <section className="glass-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Configuration Control Plane</h2>
          <input value={q} onChange={(e) => setQ(e.target.value)} className="input-premium" placeholder="Search key, description..." />
        </div>
        <form action={save} className="mt-4 grid gap-3 md:grid-cols-2">
          <input className="input-premium" name="key" placeholder="API_KEY" required />
          <input className="input-premium" name="value" placeholder="value" required />
          <select className="input-premium" name="type" defaultValue="string">
            <option value="string">string</option><option value="number">number</option><option value="boolean">boolean</option><option value="json">json</option>
          </select>
          <select className="input-premium" name="isSecret" defaultValue="true">
            <option value="true">secret</option><option value="false">non-secret</option>
          </select>
          <input className="input-premium" name="org" placeholder="org" defaultValue="acme" />
          <input className="input-premium" name="project" placeholder="project" defaultValue="webapp" />
          <input className="input-premium" name="environment" placeholder="environment" defaultValue="dev" />
          <input className="input-premium" name="tags" placeholder="tags csv: payments,critical" />
          <input className="input-premium md:col-span-2" name="description" placeholder="description" />
          <button className="btn-premium md:col-span-2" type="submit">Save Versioned Config</button>
        </form>
      </section>

      <section className="glass-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Configs ({filtered.length})</h3>
          <button onClick={bulkDelete} className="btn-danger" type="button">Bulk delete ({selected.length})</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-zinc-400"><th></th><th>Key</th><th>Scope</th><th>Type</th><th>Value</th><th>Tags</th></tr></thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-t border-white/10">
                  <td><input type="checkbox" checked={selected.includes(row.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, row.id] : selected.filter((x) => x !== row.id))} /></td>
                  <td className="py-3 font-medium">{row.key}<p className="text-xs text-zinc-400">{row.description}</p></td>
                  <td>{row.scope.org}/{row.scope.project}/{row.scope.environment}</td>
                  <td>{row.type}</td>
                  <td className="font-mono text-xs">{row.isSecret ? "••••••••" : String(row.value)}</td>
                  <td>{row.tags.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
