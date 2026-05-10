import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

/**
 * Root page — redirects authenticated users to dashboard,
 * unauthenticated users see the login/register gate.
 */
export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Hero */}
        <div className="hero p-8 text-center">
          <div
            className="mx-auto mb-4 w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            CM
          </div>
          <h1 className="text-2xl font-bold tracking-tight">ConfigManager</h1>
          <p className="mt-2 text-sm text-zinc-300">
            Secure, enterprise-grade configuration control plane.
          </p>
        </div>

        {/* Login form */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold">Sign in</h2>
          <form method="post" action="/api/auth/login" className="space-y-3">
            <input
              className="input"
              name="email"
              placeholder="Email address"
              type="email"
              autoComplete="email"
              required
            />
            <input
              className="input"
              name="password"
              placeholder="Password"
              type="password"
              autoComplete="current-password"
              required
            />
            <button className="btn w-full" type="submit">
              Sign in
            </button>
          </form>
        </div>

        {/* Register form */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold">Create account</h2>
          <form method="post" action="/api/auth/register" className="space-y-3">
            <input className="input" name="name" placeholder="Full name" required />
            <input
              className="input"
              name="email"
              placeholder="Email address"
              type="email"
              autoComplete="email"
              required
            />
            <input
              className="input"
              name="password"
              placeholder="Password (min 8 chars, upper + lower + number)"
              type="password"
              autoComplete="new-password"
              required
            />
            <button className="btn w-full" type="submit">
              Create account
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
