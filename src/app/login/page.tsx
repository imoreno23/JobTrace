import Link from "next/link";
import { signIn, signUp } from "./actions";

type Props = { searchParams: Promise<{ error?: string; message?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = params.error === "setup" ? "Supabase is not connected yet. Add the project URL and publishable key to .env.local." : params.error;
  return <main className="screen"><section className="panel auth-panel">
    <Link className="brand" href="/">jobtrace<span>.</span></Link>
    <p className="eyebrow">YOUR WORKSPACE</p><h1>Welcome back.</h1>
    <p>Sign in to access JobTrace from any device.</p>
    {error && <div className="notice error" role="alert">{error}</div>}
    {params.message && <div className="notice" role="status">{params.message}</div>}
    <form action={signIn} className="auth-form">
      <label>Email<input name="email" type="email" autoComplete="email" required /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" minLength={8} required /></label>
      <button className="button primary" type="submit">Sign in <span aria-hidden="true">→</span></button>
    </form>
    <details className="signup"><summary>New to JobTrace? Create an account</summary>
      <form action={signUp} className="auth-form signup-form">
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
        <button className="button secondary" type="submit">Create account</button>
      </form>
    </details>
  </section></main>;
}
