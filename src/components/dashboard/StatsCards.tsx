type Stats = {
  totalConfigs: number;
  totalSecrets: number;
  totalCertificates: number;
};

type StatCard = {
  label: string;
  value: number;
  icon: string;
  colorClass: string;
};

/**
 * Dashboard stats cards row.
 * Server component — receives data from page, no fetching here.
 */
export function StatsCards({ stats }: { stats: Stats }) {
  const cards: StatCard[] = [
    {
      label: "Config Items",
      value: stats.totalConfigs,
      icon: "⚙",
      colorClass: "badge-config",
    },
    {
      label: "Secrets",
      value: stats.totalSecrets,
      icon: "🔐",
      colorClass: "badge-secret",
    },
    {
      label: "Certificates",
      value: stats.totalCertificates,
      icon: "📜",
      colorClass: "badge-cert",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--color-muted)" }}>
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-bold">{card.value.toLocaleString()}</p>
            </div>
            <span className={`badge ${card.colorClass} text-base px-2.5 py-1`}>{card.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
