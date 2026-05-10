export default function Home() {
  return (
    <main className="mx-auto max-w-5xl p-8 space-y-8">
      <section className="hero-premium rounded-3xl p-8 md:p-12">
        <h1 className="text-4xl font-bold tracking-tight">agent.tools.config-manager</h1>
        <p className="mt-3 text-zinc-200">Secure, premium, environment-aware configuration control plane with secret-safe defaults.</p>
      </section>
      <div className="grid md:grid-cols-2 gap-6">
        <form className="glass-card p-5 space-y-2" method="post" action="/api/auth/register">
          <h2 className="font-semibold">Register</h2>
          <input className="input-premium" name="name" placeholder="Name" />
          <input className="input-premium" name="email" placeholder="Email" type="email" />
          <input className="input-premium" name="password" placeholder="Password" type="password" />
          <button className="btn-premium">Create account</button>
        </form>
        <form className="glass-card p-5 space-y-2" method="post" action="/api/auth/login">
          <h2 className="font-semibold">Login</h2>
          <input className="input-premium" name="email" placeholder="Email" type="email" />
          <input className="input-premium" name="password" placeholder="Password" type="password" />
          <button className="btn-premium">Sign in</button>
        </form>
      </div>
      <a className="underline text-zinc-300" href="/dashboard">Open dashboard</a>
    </main>
  );
}
