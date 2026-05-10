"use client";

import { useState, useCallback } from "react";

type SecretRow = {
  id: string;
  name: string;
  key: string;
  description: string;
  tags: string[];
  maskedValue: string;
  rotatedAt: string | null;
  expiresAt: string | null;
  updatedAt: string;
};

type Props = {
  initialItems: SecretRow[];
  total: number;
  projectId: string;
  envId: string | null;
};

/**
 * Secrets Vault client component.
 *
 * Manages the reveal-with-re-auth flow, masked display, copy-to-clipboard,
 * and delete confirmation. Never logs or exposes revealed values beyond
 * the transient reveal state (cleared after 30 seconds).
 */
export function SecretsVault({ initialItems, total, projectId }: Props) {
  const [items, setItems] = useState(initialItems);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [elevating, setElevating] = useState(false);
  const [elevatePassword, setElevatePassword] = useState("");
  const [elevateError, setElevateError] = useState("");
  const [pendingRevealId, setPendingRevealId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Clear revealed values after 30s
  const scheduleRevealClear = useCallback((id: string) => {
    setTimeout(() => {
      setRevealed((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 30_000);
  }, []);

  async function handleRevealRequest(secretId: string) {
    // Check if session is already elevated
    const statusRes = await fetch("/api/auth/elevate", { method: "HEAD" }).catch(() => null);
    if (statusRes?.ok) {
      await performReveal(secretId);
    } else {
      setPendingRevealId(secretId);
      setElevating(true);
    }
  }

  async function handleElevateAndReveal() {
    setElevateError("");
    const res = await fetch("/api/auth/elevate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: elevatePassword }),
    });
    if (!res.ok) {
      setElevateError("Invalid password. Try again.");
      return;
    }
    setElevating(false);
    setElevatePassword("");
    if (pendingRevealId) {
      await performReveal(pendingRevealId);
      setPendingRevealId(null);
    }
  }

  async function performReveal(id: string) {
    const res = await fetch("/api/secrets/reveal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        setPendingRevealId(id);
        setElevating(true);
      }
      return;
    }
    const data = (await res.json()) as { value: string };
    setRevealed((prev) => ({ ...prev, [id]: data.value }));
    scheduleRevealClear(id);
  }

  async function handleCopy(id: string) {
    const value = revealed[id];
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(id);
    setTimeout(() => setCopied((prev) => (prev === id ? null : prev)), 2000);
  }

  async function handleDelete(id: string) {
    if (!confirm("Permanently delete this secret?")) return;
    await fetch("/api/secrets", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, projectId }),
    });
    setItems((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <>
      {/* Re-auth modal */}
      {elevating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="card p-6 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-semibold">Re-authenticate to reveal secret</h2>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              Revealing a secret requires confirming your identity.
            </p>
            <input
              type="password"
              className="input"
              placeholder="Your password"
              value={elevatePassword}
              onChange={(e) => setElevatePassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleElevateAndReveal()}
              autoFocus
            />
            {elevateError && (
              <p className="text-xs" style={{ color: "var(--color-danger)" }}>{elevateError}</p>
            )}
            <div className="flex gap-2">
              <button className="btn flex-1" onClick={handleElevateAndReveal}>Confirm</button>
              <button
                className="btn-ghost flex-1"
                onClick={() => { setElevating(false); setPendingRevealId(null); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <h2 className="font-semibold">Secrets ({total})</h2>
          <span className="text-xs badge badge-secret">All values encrypted</span>
        </div>

        {items.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm" style={{ color: "var(--color-muted)" }}>
            No secrets found. Add one via the API or CLI.
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {items.map((secret) => {
              const isRevealed = !!revealed[secret.id];

              return (
                <div key={secret.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold">{secret.key}</span>
                        <span className="badge badge-secret">secret</span>
                        {secret.expiresAt && new Date(secret.expiresAt) < new Date() && (
                          <span className="badge" style={{ background: "rgba(251,191,36,0.2)", color: "#fcd34d", border: "1px solid rgba(251,191,36,0.3)" }}>
                            EXPIRED
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
                        {secret.name}
                        {secret.description ? ` — ${secret.description}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isRevealed ? (
                        <>
                          <span className="font-mono text-sm px-2 py-1 rounded" style={{ background: "rgba(0,0,0,0.4)", color: "#86efac" }}>
                            {revealed[secret.id]}
                          </span>
                          <button
                            className="btn-ghost text-xs py-1 px-2"
                            onClick={() => handleCopy(secret.id)}
                          >
                            {copied === secret.id ? "Copied!" : "Copy"}
                          </button>
                        </>
                      ) : (
                        <span className="masked-value">••••••••</span>
                      )}

                      <button
                        className="btn-ghost text-xs py-1 px-2"
                        onClick={() => handleRevealRequest(secret.id)}
                        title="Reveal requires re-authentication"
                      >
                        {isRevealed ? "Hide" : "Reveal"}
                      </button>
                      <button
                        className="btn-danger text-xs py-1 px-2"
                        onClick={() => handleDelete(secret.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {secret.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {secret.tags.map((tag) => (
                        <span key={tag} className="badge badge-string text-xs">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
