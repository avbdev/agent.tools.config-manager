"use client";

import { useState } from "react";

type AuditEntry = {
  id: string;
  action: string;
  resource: string;
  resourceType: string;
  actorEmail: string;
  diff: string;
  ipAddress: string;
  createdAt: string;
};

type Props = {
  items: AuditEntry[];
  total: number;
  skip: number;
  take: number;
};

const ACTION_COLOR: Record<string, string> = {
  "secret.reveal": "rgba(239,68,68,0.2)",
  "secret.create": "rgba(52,211,153,0.2)",
  "secret.delete": "rgba(239,68,68,0.2)",
  "config.create": "rgba(96,165,250,0.2)",
  "config.delete": "rgba(239,68,68,0.2)",
  "auth.login":    "rgba(129,140,248,0.2)",
  "auth.elevate":  "rgba(251,191,36,0.2)",
};

const ACTION_TEXT: Record<string, string> = {
  "secret.reveal": "#fca5a5",
  "secret.create": "#6ee7b7",
  "secret.delete": "#fca5a5",
  "config.create": "#93c5fd",
  "config.delete": "#fca5a5",
  "auth.login":    "#a5b4fc",
  "auth.elevate":  "#fcd34d",
};

/**
 * Audit timeline client component.
 * Renders an immutable audit log with expandable diff viewer and
 * client-side action/type filtering.
 */
export function AuditTimeline({ items, total, skip, take }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState("");

  const filtered = filterAction
    ? items.filter((i) => i.action.includes(filterAction))
    : items;

  const page = Math.floor(skip / take) + 1;
  const totalPages = Math.ceil(total / take);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          className="input max-w-xs"
          placeholder="Filter by action…"
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
        />
        <span className="text-sm ml-auto" style={{ color: "var(--color-muted)" }}>
          Page {page} of {totalPages} — {total} entries
        </span>
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm" style={{ color: "var(--color-muted)" }}>
            No audit entries found.
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {filtered.map((entry) => {
              const bg = ACTION_COLOR[entry.action] ?? "rgba(127,73,255,0.12)";
              const fg = ACTION_TEXT[entry.action] ?? "#a78bfa";
              const isExpanded = expanded === entry.id;

              return (
                <li key={entry.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded shrink-0 mt-0.5"
                      style={{ background: bg, color: fg, border: `1px solid ${fg}30` }}
                    >
                      {entry.action}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-mono truncate">{entry.resource}</span>
                        <span className="badge badge-config">{entry.resourceType}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs" style={{ color: "var(--color-muted)" }}>
                        <span>{entry.actorEmail}</span>
                        {entry.ipAddress && <span>{entry.ipAddress}</span>}
                        <span>{new Date(entry.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {entry.diff && (
                      <button
                        className="btn-ghost text-xs py-0.5 px-2 shrink-0"
                        onClick={() => setExpanded(isExpanded ? null : entry.id)}
                      >
                        {isExpanded ? "Hide" : "Diff"}
                      </button>
                    )}
                  </div>

                  {isExpanded && entry.diff && (
                    <pre
                      className="mt-3 p-3 rounded text-xs overflow-x-auto"
                      style={{
                        background: "rgba(0,0,0,0.4)",
                        color: "#86efac",
                        fontFamily: "var(--font-mono)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      {JSON.stringify(JSON.parse(entry.diff), null, 2)}
                    </pre>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-end">
          {page > 1 && (
            <a href={`?skip=${skip - take}`} className="btn-ghost text-xs">← Previous</a>
          )}
          {page < totalPages && (
            <a href={`?skip=${skip + take}`} className="btn text-xs">Next →</a>
          )}
        </div>
      )}
    </div>
  );
}
