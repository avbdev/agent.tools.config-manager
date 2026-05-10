type ActivityItem = {
  id: string;
  action: string;
  resource: string;
  resourceType: string;
  actorEmail: string;
  createdAt: string;
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * Recent audit activity feed.
 * Server component — receives serialised activity items from the page.
 */
export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <section className="card p-5">
      <h2 className="text-base font-semibold mb-4">Recent Activity</h2>

      {items.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-muted)" }}>
          No activity yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between py-2 border-b last:border-0"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded"
                  style={{
                    background: "rgba(127,73,255,0.15)",
                    color: "#a78bfa",
                    border: "1px solid rgba(127,73,255,0.25)",
                    flexShrink: 0,
                  }}
                >
                  {item.action}
                </span>
                <span
                  className="text-sm truncate"
                  style={{ color: "var(--color-muted)" }}
                >
                  {item.resource}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4 text-xs" style={{ color: "var(--color-muted)" }}>
                <span className="hidden sm:block truncate max-w-28">{item.actorEmail}</span>
                <span>{formatRelativeTime(item.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
