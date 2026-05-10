export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-8 space-y-8">
      <h1 className="text-3xl font-bold">agent.tools.config-manager</h1>
      <p className="text-zinc-600">Secure, role-based configuration management with encrypted secret storage.</p>
      <div className="grid md:grid-cols-2 gap-6">
        <form className="border rounded p-4 space-y-2" method="post" action="/api/auth/register">
          <h2 className="font-semibold">Register</h2>
          <input className="border p-2 rounded w-full" name="name" placeholder="Name" />
          <input className="border p-2 rounded w-full" name="email" placeholder="Email" type="email" />
          <input className="border p-2 rounded w-full" name="password" placeholder="Password" type="password" />
          <button className="rounded bg-blue-600 text-white px-4 py-2">Create account</button>
        </form>
        <form className="border rounded p-4 space-y-2" method="post" action="/api/auth/login">
          <h2 className="font-semibold">Login</h2>
          <input className="border p-2 rounded w-full" name="email" placeholder="Email" type="email" />
          <input className="border p-2 rounded w-full" name="password" placeholder="Password" type="password" />
          <button className="rounded bg-zinc-800 text-white px-4 py-2">Sign in</button>
        </form>
      </div>
      <a className="underline" href="/dashboard">Open dashboard</a>
    </main>
  );
}
