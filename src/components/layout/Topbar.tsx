"use client";

import { useState } from "react";

type Props = {
  userEmail: string;
};

/**
 * Top navigation bar with user avatar and logout action.
 * Client component for interactive logout form submission.
 */
export function Topbar({ userEmail }: Props) {
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  const initials = userEmail.slice(0, 2).toUpperCase();

  return (
    <header
      className="h-14 shrink-0 flex items-center justify-between px-6"
      style={{
        borderBottom: "1px solid var(--color-border)",
        background: "rgba(8, 10, 25, 0.75)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div />

      <div className="flex items-center gap-3">
        <span className="text-sm" style={{ color: "var(--color-muted)" }}>
          {userEmail}
        </span>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            background: "linear-gradient(135deg, var(--color-brand-start), var(--color-brand-end))",
          }}
        >
          {initials}
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="btn-ghost text-xs px-3 py-1.5"
        >
          {loggingOut ? "…" : "Logout"}
        </button>
      </div>
    </header>
  );
}
