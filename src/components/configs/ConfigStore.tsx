"use client";

import { useState, useMemo } from "react";

const VALUE_TYPE_OPTIONS = ["STRING", "NUMBER", "BOOLEAN", "JSON", "URL"] as const;

type ConfigRow = {
  id: string;
  key: string;
  valueType: string;
  isSecret: boolean;
  displayValue: string;
  description: string;
  tags: string[];
  updatedAt: string;
};

type Props = {
  initialItems: ConfigRow[];
  total: number;
  projectId: string;
  envId: string | null;
};

/**
 * Config Store client component.
 *
 * Handles CRUD operations for config items, with filtering by type and
 * free-text search. Write operations call /api/configs.
 */
export function ConfigStore({ initialItems, total, projectId, envId }: Props) {
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filterType !== "all" && item.valueType !== filterType) return false;
      if (
        search &&
        !`${item.key} ${item.description} ${item.tags.join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [items, search, filterType]);

  async function refresh() {
    const qs = new URLSearchParams({ projectId, ...(envId && { envId }) });
    const res = await fetch(`/api/configs?${qs}`);
    if (res.ok) {
      const json = (await res.json()) as { data: ConfigRow[] };
      setItems(json.data);
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      projectId,
      envId: envId ?? fd.get("envId"),
      key: fd.get("key"),
      valueType: fd.get("valueType"),
      rawValue: fd.get("rawValue"),
      isSecret: fd.get("isSecret") === "true",
      description: fd.get("description") ?? "",
      tags: String(fd.get("tags") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    await fetch("/api/configs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    setShowForm(false);
    await refresh();
  }

  async function handleBulkDelete() {
    if (!selected.length || !confirm(`Delete ${selected.length} configs?`)) return;
    await fetch("/api/configs", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ids: selected, projectId }),
    });
    setSelected([]);
    await refresh();
  }

  const typeColorMap: Record<string, string> = {
    STRING: "badge-string",
    NUMBER: "badge-number",
    BOOLEAN: "badge-boolean",
    JSON: "badge-json",
    URL: "badge-config",
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search configs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input w-36"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All types</option>
          {VALUE_TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button className="btn ml-auto" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ Add Config"}
        </button>
        {selected.length > 0 && (
          <button className="btn-danger" onClick={handleBulkDelete}>
            Delete ({selected.length})
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card p-5">
          <h3 className="font-semibold mb-4">New Config Item</h3>
          <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
            <input className="input" name="key" placeholder="KEY_NAME" required />
            <input className="input" name="rawValue" placeholder="value" required />
            <select className="input" name="valueType" defaultValue="STRING">
              {VALUE_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select className="input" name="isSecret" defaultValue="false">
              <option value="false">Non-secret</option>
              <option value="true">Secret</option>
            </select>
            <input className="input" name="tags" placeholder="tags (comma-separated)" />
            <input className="input" name="description" placeholder="Description" />
            <button className="btn sm:col-span-2" type="submit">Save Config</button>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <h2 className="font-semibold">
            Configs ({filtered.length} of {total})
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm" style={{ color: "var(--color-muted)" }}>
            No config items found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-xs font-medium border-b"
                  style={{ color: "var(--color-muted)", borderColor: "var(--color-border)" }}
                >
                  <th className="w-8 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selected.length === filtered.length && filtered.length > 0}
                      onChange={(e) =>
                        setSelected(e.target.checked ? filtered.map((r) => r.id) : [])
                      }
                    />
                  </th>
                  <th className="px-4 py-3 text-left">Key</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Value</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Tags</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b table-row-hover" style={{ borderColor: "var(--color-border)" }}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(row.id)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, row.id]
                              : selected.filter((x) => x !== row.id),
                          )
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium">{row.key}</span>
                      {row.description && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                          {row.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${typeColorMap[row.valueType] ?? "badge-config"}`}>
                        {row.valueType}
                      </span>
                      {row.isSecret && (
                        <span className="badge badge-secret ml-1">secret</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {row.isSecret ? (
                        <span className="masked-value">••••••••</span>
                      ) : (
                        <span className="truncate max-w-40 block">{row.displayValue}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {row.tags.map((tag) => (
                          <span key={tag} className="badge badge-string">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 text-xs hidden lg:table-cell"
                      style={{ color: "var(--color-muted)" }}
                    >
                      {new Date(row.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
