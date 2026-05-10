import Link from "next/link";
import type { Role } from "@/generated/prisma";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: "⬡" },
  { href: "/dashboard/configs", label: "Config Store", icon: "⚙" },
  { href: "/dashboard/secrets", label: "Secrets Vault", icon: "🔐" },
  { href: "/dashboard/audit-log", label: "Audit Log", icon: "📋" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚡" },
];

type Props = {
  userEmail: string;
  userRole: Role;
};

/**
 * Application sidebar shell.
 *
 * Server component — renders navigation links and user identity badge.
 * Active state is handled via CSS (client-side active link detection
 * can be layered via a thin `ActiveLink` client wrapper if needed).
 */
export function Sidebar({ userEmail, userRole }: Props) {
  return (
    <aside
      className="w-60 shrink-0 flex flex-col h-full"
      style={{
        background: "rgba(8, 10, 25, 0.92)",
        borderRight: "1px solid var(--color-border)",
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-2">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{
              background: "linear-gradient(135deg, var(--color-brand-start), var(--color-brand-end))",
            }}
          >
            CM
          </span>
          <div>
            <p className="text-sm font-semibold leading-none">ConfigManager</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
              {userRole}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="nav-item block">
            <span className="w-5 text-center">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User badge */}
      <div
        className="px-4 py-4 border-t text-xs truncate"
        style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
      >
        {userEmail}
      </div>
    </aside>
  );
}
